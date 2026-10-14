import "server-only";
import { parse } from "node-html-parser";
import { TIERS, type TierConfig } from "@/config/models";
import { headPartial, briefForWriters, normalizeBrief, planMessage, type Brief } from "@/lib/ai/brief";
import { directionsForPrompt, fontNames } from "@/lib/ai/design";
import { streamChat, parseJsonLoose, type ChatMessage, type Usage } from "@/lib/ai/openrouter";
import { briefSystemPrompt, buildBriefMessages, buildMessages, buildQaMessages, buildRepairMessages, buildWriterMessages } from "@/lib/ai/prompts";
import { applyOps, listPages, parseResponse, type ApplyFailure } from "@/lib/ai/protocol";
import { hrefToPage, resolveIncludes } from "@/lib/site/render";
import type { Attachment, FileMap, SelectedElement } from "@/lib/types";

/**
 * The model-facing build pipeline, independent of the database and billing.
 *
 * New site (staged, ~2 sequential model steps regardless of page count):
 *   1. plan    — the tier model writes a design brief (direction, palette, fonts, class recipes, pages, sections)
 *   2. write   — header/footer and every page are written in parallel from the same brief
 *   3. check   — a static checker finds concrete errors; a cheap model fixes them (free to the user)
 *
 * Edit (existing site): one streamed call with SEARCH/REPLACE edits, plus a repair pass.
 */

export type BuildEvent =
  | { type: "text"; text: string }
  | { type: "status"; message: string }
  | { type: "thinking" }
  | { type: "model"; model: string };

export type BuildResult = {
  files: FileMap;
  changed: string[];
  failures: ApplyFailure[];
  /** Everything streamed to the user (prose + file blocks). */
  transcript: string;
  /** Prose for the chat message. */
  text: string;
  truncated: boolean;
  costUsd: number;
  inputTokens: number;
  outputTokens: number;
  models: string[];
};

type Ctx = {
  tier: TierConfig;
  userId: string;
  signal?: AbortSignal;
  onEvent: (e: BuildEvent) => void;
};

class Meter {
  costUsd = 0;
  inputTokens = 0;
  outputTokens = 0;
  models = new Set<string>();
  add(u: Usage | null, model?: string) {
    if (u) {
      this.costUsd += u.costUsd;
      this.inputTokens += u.inputTokens;
      this.outputTokens += u.outputTokens;
    }
    if (model) this.models.add(model);
  }
}

/** Runs one streamed completion to the end and returns its text. */
async function run(
  ctx: Ctx,
  meter: Meter,
  opts: { models: string[]; messages: ChatMessage[]; maxTokens: number; reasoning?: "low" | "medium" | null; onText?: (t: string) => void },
) {
  let text = "";
  let finish = "";
  let model = "";
  let usage: Usage | null = null;
  for await (const ev of streamChat({
    models: opts.models,
    messages: opts.messages,
    maxTokens: opts.maxTokens,
    reasoning: opts.reasoning ?? null,
    userId: ctx.userId,
    signal: ctx.signal,
  })) {
    if (ev.type === "text") {
      text += ev.text;
      opts.onText?.(ev.text);
    } else if (ev.type === "reasoning") ctx.onEvent({ type: "thinking" });
    else if (ev.type === "model") {
      model = ev.model;
      ctx.onEvent({ type: "model", model });
    } else if (ev.type === "finish") finish = ev.reason;
    else if (ev.type === "usage") usage = ev.usage;
  }
  meter.add(usage, model);
  return { text, truncated: finish === "length" };
}

async function pool<T>(items: T[], limit: number, worker: (item: T) => Promise<void>) {
  const queue = [...items];
  await Promise.all(
    Array.from({ length: Math.min(limit, queue.length) }, async () => {
      while (queue.length) await worker(queue.shift()!);
    }),
  );
}

// ─────────────────────────── checks ───────────────────────────

const STOCK_URL = /(images\.unsplash\.com|source\.unsplash|picsum\.photos|placehold\.co|placeholder\.com|via\.placeholder)/i;

/** Concrete, objectively fixable errors (not style opinions). Format: "file: problem". */
export function findBuildErrors(files: FileMap): string[] {
  const errors: string[] = [];
  const pages = listPages(files);
  for (const page of pages) {
    const src = files[page];
    if (!/@include\s+partials\/header\.html/.test(src) && files["partials/header.html"]) errors.push(`${page}: does not include partials/header.html`);
    if (!/@include\s+partials\/footer\.html/.test(src) && files["partials/footer.html"]) errors.push(`${page}: does not include partials/footer.html`);
    if (!/@include\s+partials\/head\.html/.test(src) && files["partials/head.html"]) errors.push(`${page}: <head> does not include partials/head.html`);
    const root = parse(resolveIncludes(src, files), { blockTextElements: { script: true, style: true } });
    if (!root.querySelector("title")?.text.trim()) errors.push(`${page}: missing <title>`);
    if (!root.querySelector('meta[name="description"]')) errors.push(`${page}: missing meta description`);
    const h1 = root.querySelectorAll("h1").length;
    if (h1 !== 1) errors.push(`${page}: has ${h1} <h1> elements (needs exactly one)`);
    for (const a of root.querySelectorAll("a[href]")) {
      const t = hrefToPage(a.getAttribute("href") ?? "");
      if (t && files[t.page] === undefined) errors.push(`${page}: link to missing page "${a.getAttribute("href")}" (point it at an existing page)`);
    }
    for (const img of root.querySelectorAll("img")) {
      if (img.getAttribute("alt") === undefined) errors.push(`${page}: <img> without alt attribute`);
      if (STOCK_URL.test(img.getAttribute("src") ?? "")) errors.push(`${page}: uses an external stock image URL — replace with a data-ai-image placeholder (no src)`);
    }
    for (const form of root.querySelectorAll("form")) {
      if (!form.getAttribute("data-sl-form")) errors.push(`${page}: <form> is missing data-sl-form="…" (forms won't deliver)`);
    }
  }
  return [...new Set(errors)].slice(0, 25);
}

async function fixErrors(ctx: Ctx, meter: Meter, files: FileMap) {
  const errors = findBuildErrors(files);
  if (!errors.length) return { files, changed: [] as string[] };
  ctx.onEvent({ type: "status", message: `Polishing ${errors.length} detail${errors.length > 1 ? "s" : ""}…` });
  try {
    const { text } = await run(ctx, meter, { models: TIERS.fast.models, messages: buildQaMessages(files, errors), maxTokens: 12_000 });
    const res = applyOps(files, parseResponse(text).ops.filter((o) => o.kind === "edit" || o.kind === "file"));
    return { files: res.files, changed: res.changed };
  } catch (err) {
    if (ctx.signal?.aborted) throw err;
    console.error("qa pass failed", err);
    return { files, changed: [] };
  }
}

// ─────────────────────────── new site ───────────────────────────

async function planSite(ctx: Ctx, meter: Meter, opts: { prompt: string; projectName: string; attachments?: Attachment[]; sourceContent?: string }) {
  const { text } = await run(ctx, meter, {
    models: ctx.tier.models,
    messages: [
      { role: "system", content: [{ type: "text", text: briefSystemPrompt(directionsForPrompt(), fontNames()), cache_control: { type: "ephemeral" } }] },
      ...buildBriefMessages(opts),
    ],
    maxTokens: 6_000,
    reasoning: ctx.tier.reasoning,
  });
  return normalizeBrief(parseJsonLoose(text), opts.projectName);
}

function pageTask(brief: Brief, file: string) {
  const page = brief.pages.find((p) => p.file === file)!;
  const isHome = file === "index.html";
  return `Write the page \`${file}\` ("${page.navLabel}") as <sl-file path="${file}">…</sl-file>.
Use exactly this title, meta description and h1 from the brief, the standard page skeleton with the three partial includes, and build every section listed for this page in order, using the brief's recipes and tokens. Write rich, specific copy (${isHome ? "450+" : "250+"} words of real content).${
    isHome ? ` Include the JSON-LD (${brief.schemaType}) for the business, plus FAQPage JSON-LD if there's an FAQ.` : ""
  }`;
}

const SHARED_TASK = `Write the shared chrome as two files:
1. <sl-file path="partials/header.html"> — the site header from the brief's nav and primaryCta: logo wordmark linking to index.html, desktop nav, the primary CTA button, and a working Alpine.js mobile menu (follow the reference pattern). Include the skip-to-content link as the first element. For local/service businesses, include a tap-to-call link (<a href="tel:…">) visible on mobile.
2. <sl-file path="partials/footer.html"> — the footer described in the brief: brand blurb, nav links to every page, contact details as real links (<a href="tel:…">, <a href="mailto:…">, address text; use placeholders like href="tel:[[Phone number]]" when unknown), a secondary CTA, and a copyright line.
Do not write partials/head.html or any pages.`;

export async function generateSite(
  opts: Ctx & { prompt: string; projectName: string; attachments?: Attachment[]; imagesEnabled?: boolean; sourceContent?: string },
): Promise<BuildResult> {
  const meter = new Meter();
  let transcript = "";
  const say = (t: string) => {
    transcript += t;
    opts.onEvent({ type: "text", text: t });
  };

  opts.onEvent({ type: "status", message: "Planning the design…" });
  const brief = await planSite(opts, meter, opts);
  if (!brief) {
    // Planner output unusable: fall back to the single-call builder.
    opts.onEvent({ type: "status", message: "Building…" });
    const prompt = opts.sourceContent ? `${opts.prompt}\n\nContent from the current website:\n${opts.sourceContent}` : opts.prompt;
    const res = await editSite({ ...opts, prompt, files: {}, history: [] });
    return { ...res, costUsd: res.costUsd + meter.costUsd, models: [...new Set([...meter.models, ...res.models])] };
  }

  say(planMessage(brief));
  let files: FileMap = { "partials/head.html": headPartial(brief) };
  say(`<sl-file path="partials/head.html">\n${files["partials/head.html"]}\n</sl-file>\n\n`);

  const briefJson = briefForWriters(brief);
  const tasks: { label: string; allowed: string[]; task: string }[] = [
    { label: "header & footer", allowed: ["partials/header.html", "partials/footer.html", "assets/site.js", "assets/styles.css"], task: SHARED_TASK },
    ...brief.pages.map((p) => ({ label: p.file, allowed: [p.file], task: pageTask(brief, p.file) })),
  ];

  let done = 0;
  let truncated = false;
  const failures: ApplyFailure[] = [];
  opts.onEvent({ type: "status", message: `Writing ${brief.pages.length} page${brief.pages.length > 1 ? "s" : ""} in parallel…` });

  await pool(tasks, 6, async (t) => {
    const messages = buildWriterMessages({
      projectName: brief.siteName,
      briefJson,
      headPartial: files["partials/head.html"],
      task: t.task,
      attachments: opts.attachments,
      imagesEnabled: opts.imagesEnabled ?? true,
      sourceContent: opts.sourceContent,
    });
    let attempt = 0;
    while (attempt < 2) {
      attempt++;
      try {
        const res = await run(opts, meter, { models: opts.tier.models, messages, maxTokens: Math.min(opts.tier.maxTokens, 24_000) });
        const ops = parseResponse(res.text).ops.filter((o) => o.kind === "file" && o.complete && t.allowed.includes(o.path));
        if (!ops.length) throw new Error(`no usable output for ${t.label}`);
        truncated ||= res.truncated;
        const applied = applyOps(files, ops);
        files = { ...files, ...Object.fromEntries(applied.changed.map((p) => [p, applied.files[p]])) };
        for (const op of ops) if (op.kind === "file") say(`<sl-file path="${op.path}">\n${op.content}\n</sl-file>\n\n`);
        done++;
        opts.onEvent({ type: "status", message: `Wrote ${t.label} (${done}/${tasks.length})` });
        return;
      } catch (err) {
        if (opts.signal?.aborted) throw err;
        if (attempt >= 2) {
          console.error(`writer task ${t.label} failed`, err);
          failures.push({ path: t.label, reason: "could not be written" });
        }
      }
    }
  });

  if (!listPages(files).includes("index.html")) throw new Error("The home page could not be generated.");

  const fixed = await fixErrors(opts, meter, files);
  files = fixed.files;

  const pages = listPages(files);
  const summary = `\n**Done.** ${pages.length} page${pages.length > 1 ? "s" : ""} built in the ${brief.fonts.display} / ${brief.fonts.body} style${
    failures.length ? ` (${failures.map((f) => f.path).join(", ")} didn't finish; ask me to "write ${failures[0].path}")` : ""
  }.\n\n- Click any text in the preview to edit it for free\n- Fill in the highlighted [[placeholders]] with your real details\n- Ask for changes like "make the hero darker" or "add a pricing page"`;
  say(summary);

  return {
    files,
    changed: Object.keys(files),
    failures,
    transcript,
    text: parseResponse(transcript).text,
    truncated,
    costUsd: meter.costUsd,
    inputTokens: meter.inputTokens,
    outputTokens: meter.outputTokens,
    models: [...meter.models],
  };
}

// ─────────────────────────── edits ───────────────────────────

export async function editSite(
  opts: Ctx & {
    files: FileMap;
    prompt: string;
    projectName: string;
    history: { role: "user" | "assistant"; content: string }[];
    selection?: SelectedElement | null;
    attachments?: Attachment[];
    imagesEnabled?: boolean;
  },
): Promise<BuildResult> {
  const meter = new Meter();
  let transcript = "";
  const messages = buildMessages({
    projectName: opts.projectName,
    files: opts.files,
    history: opts.history,
    prompt: opts.prompt,
    selection: opts.selection,
    attachments: opts.attachments,
    imagesEnabled: opts.imagesEnabled ?? true,
  });

  const main = await run(opts, meter, {
    models: opts.tier.models,
    messages,
    maxTokens: opts.tier.maxTokens,
    reasoning: opts.tier.reasoning,
    onText: (t) => {
      transcript += t;
      opts.onEvent({ type: "text", text: t });
    },
  });

  const parsed = parseResponse(main.text);
  let result = applyOps(opts.files, parsed.ops);

  // SEARCH blocks that didn't match: ask once for full files instead of failing.
  const failedPaths = [...new Set(result.failures.filter((f) => f.path !== "*").map((f) => f.path))];
  if (failedPaths.length) {
    opts.onEvent({ type: "status", message: "Double-checking an edit…" });
    try {
      const repair = await run(opts, meter, {
        models: opts.tier.models,
        messages: buildRepairMessages(messages, main.text, failedPaths, result.files),
        maxTokens: opts.tier.maxTokens,
      });
      const fixOps = parseResponse(repair.text).ops.filter((o) => o.kind === "file" && failedPaths.includes(o.path));
      const fixed = applyOps(result.files, fixOps);
      result = { files: fixed.files, changed: [...new Set([...result.changed, ...fixed.changed])], failures: fixed.failures };
    } catch (err) {
      if (opts.signal?.aborted) throw err;
      console.error("repair pass failed", err);
    }
  }

  // A brand-new site built through this path (planner fallback) still gets the free error check.
  if (!Object.keys(opts.files).length && result.changed.length) {
    const fixed = await fixErrors(opts, meter, result.files);
    result = { ...result, files: fixed.files };
  }

  return {
    files: result.files,
    changed: result.changed,
    failures: result.failures,
    transcript,
    text: parsed.text,
    truncated: main.truncated || parsed.ops.some((o) => !o.complete),
    costUsd: meter.costUsd,
    inputTokens: meter.inputTokens,
    outputTokens: meter.outputTokens,
    models: [...meter.models],
  };
}

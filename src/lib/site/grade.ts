import "server-only";
import { parse } from "node-html-parser";
import { assertPublicUrl, fetchHtml, ImportError } from "@/lib/site/import";

/**
 * Free website grader (curblit.com/tools/website-grader). Checks a live page the way a
 * search engine or AI crawler sees it — raw HTML, no JavaScript — and explains each result.
 */

export type CheckStatus = "pass" | "warn" | "fail";
export type GradeCheck = {
  id: string;
  category: "Visibility" | "Content" | "Technical" | "Conversion";
  label: string;
  status: CheckStatus;
  detail: string;
  why: string;
  weight: number;
};
export type GradeResult = {
  url: string;
  host: string;
  score: number;
  grade: "A" | "B" | "C" | "D" | "F";
  checks: GradeCheck[];
  stats: { responseMs: number; htmlKb: number; words: number; scripts: number; images: number };
};

async function exists(url: URL, path: string, test: (body: string) => boolean) {
  try {
    const target = new URL(path, url);
    await assertPublicUrl(target.toString());
    const res = await fetch(target, { redirect: "follow", signal: AbortSignal.timeout(6000), headers: { "User-Agent": "Mozilla/5.0 (compatible; CurblitGrader/1.0)" } });
    if (!res.ok) return { ok: false, body: "" };
    const body = (await res.text()).slice(0, 200_000);
    return { ok: test(body), body };
  } catch {
    return { ok: false, body: "" };
  }
}

function letter(score: number): GradeResult["grade"] {
  return score >= 90 ? "A" : score >= 80 ? "B" : score >= 65 ? "C" : score >= 50 ? "D" : "F";
}

/** What the grader can't see from a page's HTML alone (fetched live, or known for our own sites). */
export type GradeContext = { responseMs: number; sitemap: boolean; robotsOk: boolean; robotsBlocksAll: boolean };

export async function gradeWebsite(input: string): Promise<GradeResult> {
  const start = /^https?:\/\//i.test(input.trim()) ? input.trim() : `https://${input.trim()}`;
  const t0 = Date.now();
  const page = await fetchHtml(start);
  const responseMs = Date.now() - t0;
  if (!page) throw new ImportError("We couldn't load that page. Make sure the site is online and public.");
  const { url, html } = page;
  const [sitemap, robots] = await Promise.all([
    exists(url, "/sitemap.xml", (b) => /<(urlset|sitemapindex)\b/i.test(b)),
    exists(url, "/robots.txt", (b) => b.length > 0),
  ]);
  const robotsBlocksAll = /^\s*disallow:\s*\/\s*$/im.test(robots.body) && /user-agent:\s*\*/i.test(robots.body);
  return gradeHtml(url, html, { responseMs, sitemap: sitemap.ok, robotsOk: robots.ok, robotsBlocksAll });
}

/** Grades a page's HTML. Pure (no network), so it also scores Curblit's own builds. */
export function gradeHtml(url: URL, html: string, ctx: GradeContext): GradeResult {
  const { responseMs } = ctx;
  const root = parse(html, { blockTextElements: { script: true, style: true, noscript: true } });
  const checks: GradeCheck[] = [];
  const add = (c: GradeCheck) => checks.push(c);

  const title = root.querySelector("title")?.text.trim() ?? "";
  const description = root.querySelector('meta[name="description"]')?.getAttribute("content")?.trim() ?? "";
  const h1s = root.querySelectorAll("h1").map((h) => h.text.replace(/\s+/g, " ").trim()).filter(Boolean);
  const scripts = root.querySelectorAll("script[src]").length;
  const images = root.querySelectorAll("img");
  const body = root.querySelector("body") ?? root;
  const textRoot = parse(body.toString());
  textRoot.querySelectorAll("script,style,noscript,svg,template").forEach((n) => n.remove());
  const words = textRoot.text.split(/\s+/).filter((w) => /[a-z0-9]/i.test(w)).length;

  // ── Visibility ──
  add({
    id: "rendering",
    category: "Visibility",
    label: "Readable without JavaScript",
    weight: 14,
    status: words >= 150 ? "pass" : words >= 50 ? "warn" : "fail",
    detail:
      words >= 150
        ? `${words} words of real text are in the page's HTML.`
        : `Only ${words} words are in the HTML${scripts > 3 ? ` — the content is likely built by JavaScript (${scripts} scripts)` : ""}.`,
    why: "Google renders JavaScript slowly in a second pass, and most AI search crawlers (ChatGPT, Perplexity) don't run it at all. Text that isn't in the HTML often isn't found.",
  });
  add({
    id: "title",
    category: "Visibility",
    label: "Page title",
    weight: 10,
    status: !title ? "fail" : title.length < 25 || title.length > 65 ? "warn" : "pass",
    detail: !title ? "No <title> tag." : `"${title.slice(0, 80)}" (${title.length} characters${title.length < 25 ? ", too short" : title.length > 65 ? ", will be cut off" : ""}).`,
    why: "The title is the blue headline in Google results. Aim for 50–60 characters with your main service, location and brand.",
  });
  add({
    id: "description",
    category: "Visibility",
    label: "Meta description",
    weight: 8,
    status: !description ? "fail" : description.length < 70 || description.length > 165 ? "warn" : "pass",
    detail: !description ? "No meta description." : `${description.length} characters.`,
    why: "The description is the snippet under your title in search results. A good one (120–160 characters) gets more clicks.",
  });
  add({
    id: "h1",
    category: "Content",
    label: "One clear H1 heading",
    weight: 6,
    status: h1s.length === 1 ? "pass" : h1s.length === 0 ? "fail" : "warn",
    detail: h1s.length === 1 ? `"${h1s[0].slice(0, 80)}"` : h1s.length === 0 ? "No H1 heading." : `${h1s.length} H1 headings.`,
    why: "The H1 tells search engines what the page is about. Use exactly one.",
  });
  add({
    id: "content",
    category: "Content",
    label: "Enough content to rank",
    weight: 7,
    status: words >= 400 ? "pass" : words >= 200 ? "warn" : "fail",
    detail: `${words} words on the page.`,
    why: "Pages with under ~300 words rarely rank. Describe your services, area, process and answer common questions.",
  });
  const jsonLd = root.querySelectorAll('script[type="application/ld+json"]').length;
  add({
    id: "schema",
    category: "Visibility",
    label: "Structured data (schema.org)",
    weight: 7,
    status: jsonLd ? "pass" : "fail",
    detail: jsonLd ? `${jsonLd} structured data block${jsonLd > 1 ? "s" : ""} found.` : "No JSON-LD structured data.",
    why: "Structured data tells Google your business type, hours and location, and powers rich results.",
  });
  const missingAlt = images.filter((i) => !i.getAttribute("alt")?.trim()).length;
  add({
    id: "alt",
    category: "Content",
    label: "Image descriptions (alt text)",
    weight: 4,
    status: images.length === 0 || missingAlt === 0 ? "pass" : missingAlt / images.length > 0.3 ? "fail" : "warn",
    detail: images.length === 0 ? "No images found in the HTML." : `${missingAlt} of ${images.length} images have no alt text.`,
    why: "Alt text makes images accessible and lets them show up in image search.",
  });

  // ── Technical ──
  add({
    id: "https",
    category: "Technical",
    label: "Secure connection (HTTPS)",
    weight: 8,
    status: url.protocol === "https:" ? "pass" : "fail",
    detail: url.protocol === "https:" ? "Served over HTTPS." : "Not served over HTTPS; browsers show a “Not secure” warning.",
    why: "HTTPS is a Google ranking signal and builds visitor trust.",
  });
  add({
    id: "mobile",
    category: "Technical",
    label: "Mobile-friendly viewport",
    weight: 7,
    status: root.querySelector('meta[name="viewport"]') ? "pass" : "fail",
    detail: root.querySelector('meta[name="viewport"]') ? "Viewport tag present." : "No viewport tag, so the page won't scale on phones.",
    why: "Most local searches happen on phones, and Google indexes the mobile version of your site.",
  });
  add({
    id: "speed",
    category: "Technical",
    label: "Server response time",
    weight: 5,
    status: responseMs < 800 ? "pass" : responseMs < 2000 ? "warn" : "fail",
    detail: `${(responseMs / 1000).toFixed(2)}s to load the HTML (${Math.round(html.length / 1024)} KB).`,
    why: "Slow pages lose visitors and rank lower. Static sites on a CDN typically respond in well under half a second.",
  });
  const sitemap = { ok: ctx.sitemap };
  const robots = { ok: ctx.robotsOk };
  const blocksAll = ctx.robotsBlocksAll;
  add({
    id: "sitemap",
    category: "Technical",
    label: "XML sitemap",
    weight: 5,
    status: sitemap.ok ? "pass" : "fail",
    detail: sitemap.ok ? "/sitemap.xml found." : "No /sitemap.xml.",
    why: "A sitemap lists every page so search engines find them quickly. Submit it in Google Search Console.",
  });
  add({
    id: "robots",
    category: "Technical",
    label: "Search engines allowed",
    weight: 6,
    status: blocksAll ? "fail" : robots.ok ? "pass" : "warn",
    detail: blocksAll ? "robots.txt blocks all crawlers (Disallow: /)." : robots.ok ? "robots.txt allows crawling." : "No robots.txt (crawlers default to allowed).",
    why: "A leftover “Disallow: /” from development is one of the most common reasons sites never appear on Google.",
  });
  const og = root.querySelector('meta[property="og:title"]') && root.querySelector('meta[property="og:image"]');
  add({
    id: "social",
    category: "Visibility",
    label: "Social sharing preview",
    weight: 4,
    status: og ? "pass" : "warn",
    detail: og ? "Open Graph title and image set." : "Missing Open Graph title/image.",
    why: "Without these, links shared on Facebook, LinkedIn, iMessage and Slack show a blank or random preview.",
  });
  add({
    id: "canonical",
    category: "Technical",
    label: "Canonical URL",
    weight: 3,
    status: root.querySelector('link[rel="canonical"]') ? "pass" : "warn",
    detail: root.querySelector('link[rel="canonical"]') ? "Canonical tag present." : "No canonical tag.",
    why: "Tells Google which address is the real one, so www/non-www or tracking-link copies don't split your ranking.",
  });

  // ── Conversion ──
  const contact = root.querySelectorAll('a[href^="tel:"], a[href^="mailto:"], form').length;
  add({
    id: "contact",
    category: "Conversion",
    label: "Easy to contact",
    weight: 6,
    status: contact ? "pass" : "warn",
    detail: contact ? "Click-to-call, email or a form is on the page." : "No tap-to-call link, email link or form on this page.",
    why: "Visitors who can't act in one tap leave. Put a call button or a short form on every page.",
  });

  const total = checks.reduce((n, c) => n + c.weight, 0);
  const earned = checks.reduce((n, c) => n + (c.status === "pass" ? c.weight : c.status === "warn" ? c.weight / 2 : 0), 0);
  const score = Math.round((earned / total) * 100);
  const order: Record<CheckStatus, number> = { fail: 0, warn: 1, pass: 2 };
  checks.sort((a, b) => order[a.status] - order[b.status] || b.weight - a.weight);

  return {
    url: url.toString(),
    host: url.hostname.replace(/^www\./, ""),
    score,
    grade: letter(score),
    checks,
    stats: { responseMs, htmlKb: Math.round(html.length / 1024), words, scripts, images: images.length },
  };
}

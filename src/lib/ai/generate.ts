import "server-only";
import { IMAGE_CREDITS, MAX_IMAGES_PER_MESSAGE, TIERS, type ModelTier, type TierConfig } from "@/config/models";
import { getPlan, type Plan, type PlanId } from "@/config/plans";
import { generateSiteImages } from "@/lib/ai/images";
import { editSite, generateSite, type BuildEvent } from "@/lib/ai/build";
import { OpenRouterError } from "@/lib/ai/openrouter";
import { parseResponse } from "@/lib/ai/protocol";
import { grantCredits, InsufficientCreditsError, refundCredits, spendCredits, syncCredits, totalCredits } from "@/lib/credits";
import { sendAdminAlert } from "@/lib/email";
import { serverEnv } from "@/lib/env";
import { ApiError, rateLimit } from "@/lib/http";
import { applyImageUrls, pendingImages } from "@/lib/site/render";
import { supabaseAdmin } from "@/lib/supabase/admin";
import type { Attachment, FileMap, Message, Profile, Project, SelectedElement } from "@/lib/types";
import { truncate } from "@/lib/utils";

/** Newline-delimited JSON events streamed to the builder. */
export type GenEvent =
  | { t: "start"; messageId: string; userMessageId: string; credits: number }
  | { t: "delta"; d: string }
  | { t: "thinking" }
  | { t: "status"; s: string }
  | { t: "files"; files: FileMap; changed: string[]; versionId: string }
  | { t: "done"; message: Message; files: FileMap; versionId: string | null; credits: number }
  | { t: "error"; error: string; refunded: boolean };

export type GenerationInput = {
  profile: Profile;
  project: Project;
  prompt: string;
  tier: ModelTier;
  images: boolean;
  selection?: SelectedElement | null;
  attachments?: Attachment[];
};

type Prepared = GenerationInput & {
  plan: Plan;
  tierConfig: TierConfig;
  /** First build of an empty project (staged pipeline, priced as a full build). */
  isNewSite: boolean;
  /** Credits charged for this message. */
  charge: number;
  ledgerId: number;
  userMessageId: string;
  assistantMessageId: string;
};

const STALE_LOCK_MS = 12 * 60 * 1000;

export async function todaysAiSpend() {
  const { data } = await supabaseAdmin()
    .from("ai_spend_daily")
    .select("cost_usd")
    .eq("day", new Date().toISOString().slice(0, 10))
    .maybeSingle();
  return Number(data?.cost_usd ?? 0);
}

/** Circuit breaker: caps total AI spend per day so a bug or abuse can't run up a huge bill. */
async function checkBudget(plan: PlanId) {
  const spent = await todaysAiSpend();
  const budget = serverEnv.dailyAiBudgetUsd;
  if (spent >= budget || (plan === "free" && spent >= budget * 0.8)) {
    if (await rateLimit("alert:budget", 1, 6 * 3600)) {
      void sendAdminAlert(
        "Daily AI budget reached",
        `<p>AI spend today is $${spent.toFixed(2)} (budget $${budget}). ${plan === "free" ? "Free users are paused." : "All generations are paused."}</p><p>Raise DAILY_AI_BUDGET_USD if this is legitimate growth.</p>`,
      );
    }
    throw new ApiError(503, "We're seeing unusually high demand right now. Please try again in a little while — you haven't been charged.", "busy");
  }
}

async function unlock(projectId: string) {
  await supabaseAdmin()
    .from("projects")
    .update({ status: "idle", generating_since: null, cancel_requested: false })
    .eq("id", projectId);
}

async function recordSpend(cost: number) {
  if (cost > 0) await supabaseAdmin().rpc("record_ai_spend", { p_cost: cost });
}

/** Validates, locks the project and charges credits. Throws ApiError (before any streaming). */
export async function prepareGeneration(input: GenerationInput): Promise<Prepared> {
  const admin = supabaseAdmin();
  const plan = getPlan(input.profile.plan);
  const tierConfig = TIERS[input.tier];
  const { project, profile } = input;

  if (!plan.tiers.includes(input.tier)) {
    throw new ApiError(403, `The ${tierConfig.label} model is included in the Pro plan.`, "upgrade");
  }
  if (project.blocked) throw new ApiError(403, "This project has been suspended. Contact support if you think this is a mistake.");
  if (!(await rateLimit(`gen:${profile.id}`, 40, 3600))) {
    throw new ApiError(429, "You're sending messages very quickly. Take a short break and try again in a few minutes.");
  }
  await checkBudget(plan.id);

  const staleBefore = new Date(Date.now() - STALE_LOCK_MS).toISOString();
  const { data: locked } = await admin
    .from("projects")
    .update({ status: "generating", generating_since: new Date().toISOString(), cancel_requested: false })
    .eq("id", project.id)
    .or(`status.eq.idle,generating_since.lt."${staleBefore}"`)
    .select("id")
    .maybeSingle();
  if (!locked) throw new ApiError(409, "This site is already being updated. Wait for it to finish, or press Stop.", "busy");

  const isNewSite = Object.keys(project.files).length === 0;
  const charge = isNewSite ? tierConfig.buildCredits : tierConfig.credits;
  let ledgerId: number;
  try {
    ({ ledgerId } = await spendCredits(profile.id, charge, isNewSite ? `New site (${tierConfig.label})` : `${tierConfig.label} message`, project.id));
  } catch (err) {
    await unlock(project.id);
    if (err instanceof InsufficientCreditsError) {
      throw new ApiError(
        402,
        `${isNewSite ? "Building a new site" : "This message"} needs ${charge} credit${charge > 1 ? "s" : ""}. ${plan.id === "free" ? "Free credits refill daily, or upgrade for more." : "Top up or wait for your monthly refill."}`,
        "credits",
      );
    }
    throw err;
  }

  const { data: msgs, error } = await admin
    .from("messages")
    .insert([
      {
        project_id: project.id,
        role: "user",
        content: input.prompt,
        tier: input.tier,
        attachments: input.attachments?.length ? input.attachments : null,
      },
    ])
    .select("id")
    .single();
  if (error || !msgs) {
    await refundCredits(ledgerId, "Refund: could not start");
    await unlock(project.id);
    throw new Error(error?.message ?? "could not save message");
  }
  // Inserted separately so it sorts after the user message.
  const { data: assistant } = await admin
    .from("messages")
    .insert({
      project_id: project.id,
      role: "assistant",
      tier: input.tier,
      status: "streaming",
      credits_charged: charge,
      ledger_id: ledgerId,
    })
    .select("id")
    .single();

  return { ...input, plan, tierConfig, isNewSite, charge, ledgerId, userMessageId: msgs.id, assistantMessageId: assistant!.id };
}

function friendlyError(err: unknown) {
  if (err instanceof OpenRouterError) {
    if (err.status === 402) {
      void rateLimit("alert:openrouter-credits", 1, 3600).then((ok) => {
        if (ok) void sendAdminAlert("OpenRouter balance is empty", "<p>Generations are failing with 402. Top up your OpenRouter credits (and consider enabling auto top-up).</p>");
      });
      return "The AI service is temporarily unavailable. You haven't been charged — please try again shortly.";
    }
    if (err.status === 429) return "The AI is very busy right now. You haven't been charged — please try again in a minute.";
    if (err.status === 400 && /context|too long|maximum/i.test(err.message)) {
      return "This site has grown too large for one request. Try asking for a change to a specific page.";
    }
  }
  return "Something went wrong while generating. You haven't been charged — please try again.";
}

export async function runGeneration(p: Prepared, emit: (e: GenEvent) => void) {
  const admin = supabaseAdmin();
  const abort = new AbortController();
  let cancelled = false;
  let costUsd = 0;
  let model = p.tierConfig.models[0];
  let raw = "";
  let saved = false;
  let lastThinking = 0;

  const cancelPoll = setInterval(async () => {
    const { data } = await admin.from("projects").select("cancel_requested").eq("id", p.project.id).maybeSingle();
    if (data?.cancel_requested) {
      cancelled = true;
      abort.abort();
    }
  }, 2500);

  try {
    emit({ t: "start", messageId: p.assistantMessageId, userMessageId: p.userMessageId, credits: p.charge });

    const { data: hist } = await admin
      .from("messages")
      .select("role, content, files_changed")
      .eq("project_id", p.project.id)
      .eq("status", "done")
      .neq("id", p.userMessageId)
      .order("created_at", { ascending: false })
      .limit(8);
    const history = (hist ?? [])
      .reverse()
      .map((m: { role: "user" | "assistant"; content: string; files_changed: string[] }) => ({
        role: m.role,
        content: m.role === "assistant" && m.files_changed?.length ? `${m.content}\n\n(Files changed: ${m.files_changed.join(", ")})` : m.content,
      }));

    // New sites use the staged planner + parallel writers; existing sites get targeted edits.
    const ctx = {
      tier: p.tierConfig,
      userId: p.profile.id,
      signal: abort.signal,
      onEvent: (e: BuildEvent) => {
        if (e.type === "text") {
          raw += e.text;
          emit({ t: "delta", d: e.text });
        } else if (e.type === "status") emit({ t: "status", s: e.message });
        else if (e.type === "model") model = e.model;
        else if (Date.now() - lastThinking > 1500) {
          lastThinking = Date.now();
          emit({ t: "thinking" });
        }
      },
    };
    const build = p.isNewSite
      ? await generateSite({
          ...ctx,
          prompt: p.prompt,
          projectName: p.project.name,
          attachments: p.attachments,
          imagesEnabled: p.images,
          sourceContent: p.project.settings?.importedContent,
        })
      : await editSite({
          ...ctx,
          files: p.project.files,
          prompt: p.prompt,
          projectName: p.project.name,
          history,
          selection: p.selection,
          attachments: p.attachments,
          imagesEnabled: p.images,
        });
    if (cancelled) throw new Error("cancelled");
    costUsd += build.costUsd;
    model = build.models[0] ?? model;
    const usage = { inputTokens: build.inputTokens, outputTokens: build.outputTokens };
    const result = { files: build.files, changed: build.changed };
    const note = build.truncated
      ? "\n\n_The response hit its length limit, so the last file may be unfinished. Say “continue” to finish it._"
      : "";
    const content = (build.text || (result.changed.length ? "Done." : "I wasn't able to make that change.")) + note;

    if (!result.changed.length) {
      // You only pay when your site changes.
      await refundCredits(p.ledgerId, "No changes made — refunded");
      const { data: msg } = await admin
        .from("messages")
        .update({ content, status: "done", credits_charged: 0, cost_usd: costUsd, model, input_tokens: usage?.inputTokens, output_tokens: usage?.outputTokens })
        .eq("id", p.assistantMessageId)
        .select("*")
        .single();
      await unlock(p.project.id);
      await recordSpend(costUsd);
      const fresh = await syncCredits(p.profile.id);
      emit({ t: "done", message: msg as Message, files: p.project.files, versionId: null, credits: totalCredits(fresh) });
      return;
    }

    let files = result.files;
    const { data: version } = await admin
      .from("project_versions")
      .insert({ project_id: p.project.id, files, label: truncate(p.prompt.replace(/\s+/g, " "), 90), source: "ai" })
      .select("id")
      .single();
    await admin.from("projects").update({ files }).eq("id", p.project.id);
    saved = true;
    let charged = p.charge;
    await admin
      .from("messages")
      .update({
        content,
        status: "done",
        model,
        cost_usd: costUsd,
        input_tokens: usage?.inputTokens,
        output_tokens: usage?.outputTokens,
        files_changed: result.changed,
        version_id: version?.id ?? null,
      })
      .eq("id", p.assistantMessageId);
    emit({ t: "files", files, changed: result.changed, versionId: version!.id });

    // Custom photos for any <img data-ai-image> without a real src.
    const wanted = p.images && p.plan.aiImages && !cancelled ? pendingImages(files).slice(0, MAX_IMAGES_PER_MESSAGE) : [];
    if (wanted.length) {
      const balance = totalCredits(await syncCredits(p.profile.id));
      const affordable = Math.min(wanted.length, Math.floor(balance / IMAGE_CREDITS));
      if (affordable === 0) {
        emit({ t: "status", s: "Not enough credits left for photos, so placeholders were kept." });
      } else {
        const requests = wanted.slice(0, affordable);
        let imageLedger: number | null = null;
        try {
          ({ ledgerId: imageLedger } = await spendCredits(p.profile.id, affordable * IMAGE_CREDITS, `${affordable} AI photo${affordable > 1 ? "s" : ""}`, p.project.id));
        } catch (err) {
          if (!(err instanceof InsufficientCreditsError)) throw err;
        }
        if (imageLedger !== null) {
          emit({ t: "status", s: `Creating ${affordable} custom photo${affordable > 1 ? "s" : ""}…` });
          const res = await generateSiteImages({
            projectId: p.project.id,
            userId: p.profile.id,
            requests,
            onProgress: (done, total) => emit({ t: "status", s: `Creating custom photos… ${done}/${total}` }),
          });
          costUsd += res.costUsd;
          if (res.failed === affordable) await refundCredits(imageLedger, "Photos failed — refunded");
          else if (res.failed) await grantCredits(p.profile.id, { bonus: res.failed * IMAGE_CREDITS }, "Refund: photos that failed to generate", p.project.id);
          charged += (affordable - res.failed) * IMAGE_CREDITS;
          if (res.urls.size) {
            files = applyImageUrls(files, res.urls);
            await admin.from("projects").update({ files }).eq("id", p.project.id);
            if (version) await admin.from("project_versions").update({ files }).eq("id", version.id);
            emit({ t: "files", files, changed: result.changed, versionId: version!.id });
          }
        }
      }
    }

    const { data: msg } = await admin
      .from("messages")
      .update({ credits_charged: charged, cost_usd: costUsd })
      .eq("id", p.assistantMessageId)
      .select("*")
      .single();
    await unlock(p.project.id);
    await recordSpend(costUsd);
    const fresh = await syncCredits(p.profile.id);
    emit({ t: "done", message: msg as Message, files, versionId: version?.id ?? null, credits: totalCredits(fresh) });
  } catch (err) {
    if (!cancelled) console.error("generation failed", err);
    const error = cancelled ? "Stopped. You haven't been charged." : friendlyError(err);
    if (!saved) await refundCredits(p.ledgerId, cancelled ? "Stopped — refunded" : "Generation failed — refunded");
    await admin
      .from("messages")
      .update({
        status: cancelled ? "cancelled" : "error",
        error,
        content: parseResponse(raw).text.slice(0, 4000),
        credits_charged: saved ? p.charge : 0,
        cost_usd: costUsd,
        model,
      })
      .eq("id", p.assistantMessageId);
    await unlock(p.project.id);
    await recordSpend(costUsd);
    emit({ t: "error", error, refunded: !saved });
  } finally {
    clearInterval(cancelPoll);
  }
}

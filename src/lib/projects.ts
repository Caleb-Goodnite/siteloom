import "server-only";
import { UTILITY_MODELS } from "@/config/models";
import { getPlan } from "@/config/plans";
import { complete, parseJsonLoose } from "@/lib/ai/openrouter";
import { ApiError } from "@/lib/http";
import { supabaseAdmin } from "@/lib/supabase/admin";
import type { Profile } from "@/lib/types";
import { isValidSlug, randomSuffix, slugify } from "@/lib/utils";

export function nameFromPrompt(prompt: string) {
  const quoted = prompt.match(/["“]([^"”]{2,40})["”]/)?.[1];
  if (quoted) return quoted.trim();
  const forMatch = prompt.match(/\b(?:for|called|named)\s+([A-Z][\w&'’.-]*(?:\s+[A-Z][\w&'’.-]*){0,3})/);
  if (forMatch) return forMatch[1].trim();
  const words = prompt.replace(/[^\w\s'-]/g, " ").split(/\s+/).filter(Boolean).slice(0, 4);
  const name = words.map((w) => w[0].toUpperCase() + w.slice(1)).join(" ");
  return name || "Untitled site";
}

export async function uniqueSlug(base: string) {
  const admin = supabaseAdmin();
  let root = slugify(base, 36);
  if (root.length < 3) root = `site-${root}`.replace(/-+$/, "");
  for (let i = 0; i < 6; i++) {
    const candidate = i === 0 && isValidSlug(root) ? root : `${root}-${randomSuffix(4)}`;
    if (!isValidSlug(candidate)) continue;
    const { data } = await admin.from("projects").select("id").eq("slug", candidate).maybeSingle();
    if (!data) return candidate;
  }
  return `site-${randomSuffix(8)}`;
}

export async function createProject(
  profile: Profile,
  opts: { prompt?: string; name?: string; source?: { url: string; content: string; title: string } },
) {
  const admin = supabaseAdmin();
  const plan = getPlan(profile.plan);
  const { count } = await admin.from("projects").select("id", { count: "exact", head: true }).eq("user_id", profile.id);
  if ((count ?? 0) >= plan.maxProjects) {
    throw new ApiError(403, `Your ${plan.name} plan includes ${plan.maxProjects} projects. Delete one or upgrade for more.`, "upgrade");
  }
  const fromSource = opts.source?.title.split(/\s[|–—-]\s/)[0]?.trim();
  const name = (opts.name?.trim() || fromSource || (opts.prompt ? nameFromPrompt(opts.prompt) : "Untitled site")).slice(0, 60);
  const slug = await uniqueSlug(name);
  const settings = opts.source
    ? { siteName: name, sourceUrl: opts.source.url, importedContent: opts.source.content }
    : { siteName: name };
  const { data, error } = await admin
    .from("projects")
    .insert({ user_id: profile.id, name, slug, initial_prompt: opts.prompt?.slice(0, 4000) ?? null, settings })
    .select("id, name, slug")
    .single();
  if (error) throw new Error(error.message);
  return data as { id: string; name: string; slug: string };
}

/** Background: ask a cheap model for a proper business name, then rename (and re-slug) if still unpublished. */
export async function aiNameProject(projectId: string, prompt: string) {
  try {
    const { text } = await complete({
      models: UTILITY_MODELS,
      json: true,
      maxTokens: 80,
      temperature: 0.2,
      messages: [
        {
          role: "system",
          content:
            'Extract the business or project name from a website request. If none is given, invent a short fitting name (1-3 words). Respond as JSON: {"name":"…"}',
        },
        { role: "user", content: prompt.slice(0, 1500) },
      ],
    });
    const name = parseJsonLoose<{ name?: string }>(text)?.name?.trim().slice(0, 60);
    if (!name) return;
    const admin = supabaseAdmin();
    const { data: p } = await admin.from("projects").select("published, settings").eq("id", projectId).single();
    if (!p || p.published) return;
    const slug = await uniqueSlug(name);
    await admin.from("projects").update({ name, slug, settings: { ...(p.settings ?? {}), siteName: name } }).eq("id", projectId);
  } catch (err) {
    console.error("aiNameProject failed", err);
  }
}

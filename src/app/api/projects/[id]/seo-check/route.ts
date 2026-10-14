import { publishedUrl } from "@/config/site";
import { api, ApiError, getOwnedProject, rateLimit, requireApiUser } from "@/lib/http";
import { gradeWebsite } from "@/lib/site/grade";
import { supabaseAdmin } from "@/lib/supabase/admin";
import type { Project } from "@/lib/types";

export const maxDuration = 30;

type Ctx = { params: Promise<{ id: string }> };

/** Grades the live published site with the public auditor and saves the result. */
export const POST = api<Ctx>(async (req, ctx) => {
  const user = await requireApiUser(req);
  const { id } = await ctx.params;
  const project = await getOwnedProject<Project>(id, user.id, "id, slug, custom_domain, domain_verified, published, settings");
  if (!project.published) throw new ApiError(400, "Publish your site first, then check it live.");
  if (!(await rateLimit(`seo-check:${user.id}`, 30, 3600))) throw new ApiError(429, "Too many checks this hour. Try again soon.");
  const url = publishedUrl(project.slug, project.domain_verified ? project.custom_domain : null);
  let result;
  try {
    result = await gradeWebsite(url);
  } catch {
    throw new ApiError(502, "We couldn't reach your live site just now. If you just published, wait a minute and try again.");
  }
  const live = { score: result.score, responseMs: result.stats.responseMs, checkedAt: new Date().toISOString() };
  const seo = project.settings?.seo ? { ...project.settings.seo, live } : undefined;
  if (seo) await supabaseAdmin().from("projects").update({ settings: { ...project.settings, seo } }).eq("id", id);
  return Response.json({ result, seo });
});

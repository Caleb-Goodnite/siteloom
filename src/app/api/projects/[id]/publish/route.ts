import { getProfile } from "@/lib/auth";
import { getPlan } from "@/config/plans";
import { moderateSite } from "@/lib/ai/moderation";
import { sendAdminAlert } from "@/lib/email";
import { api, ApiError, getOwnedProject, rateLimit, requireApiUser } from "@/lib/http";
import { invalidateSite } from "@/lib/site/hosting";
import { deployProject } from "@/lib/site/deploy";
import { supabaseAdmin } from "@/lib/supabase/admin";
import type { Project } from "@/lib/types";

export const maxDuration = 60;

type Ctx = { params: Promise<{ id: string }> };

export const POST = api<Ctx>(async (req, ctx) => {
  const user = await requireApiUser(req);
  const { id } = await ctx.params;
  const [project, profile] = await Promise.all([getOwnedProject<Project>(id, user.id), getProfile(user.id)]);
  const plan = getPlan(profile.plan);
  const admin = supabaseAdmin();

  if (project.blocked) throw new ApiError(403, "This site was suspended and can't be published.");
  if (!project.files["index.html"]) throw new ApiError(400, "Build your site first — there's no home page yet.");
  if (project.status === "generating") throw new ApiError(409, "Wait for the AI to finish first.");
  if (!(await rateLimit(`publish:${user.id}`, 30, 3600))) throw new ApiError(429, "Too many publishes. Try again shortly.");

  if (!project.published) {
    const { count } = await admin
      .from("projects")
      .select("id", { count: "exact", head: true })
      .eq("user_id", user.id)
      .eq("published", true);
    if ((count ?? 0) >= plan.maxPublished) {
      throw new ApiError(403, `Your ${plan.name} plan includes ${plan.maxPublished} published site${plan.maxPublished > 1 ? "s" : ""}. Unpublish one or upgrade.`, "upgrade");
    }
  }

  const verdict = await moderateSite(project.files);
  if (verdict.verdict !== "allow") {
    await admin.from("moderation_events").insert({
      project_id: id,
      stage: "publish",
      verdict: verdict.verdict,
      categories: verdict.categories,
      reason: verdict.reason,
    });
    if (verdict.verdict === "review") {
      void sendAdminAlert("Site held for review", `<p>Project <code>${id}</code> (${project.name}) was held at publish: ${verdict.reason}</p>`);
      throw new ApiError(422, "Thanks! Your site needs a quick manual review before it goes live. We'll email you — usually within a day.", "review");
    }
    throw new ApiError(422, verdict.reason || "This site can't be published under our acceptable use policy.", "blocked");
  }

  const result = await deployProject(project, plan.id);
  return Response.json(result);
});

export const DELETE = api<Ctx>(async (req, ctx) => {
  const user = await requireApiUser(req);
  const { id } = await ctx.params;
  const project = await getOwnedProject<Project>(id, user.id, "id, slug, custom_domain");
  await supabaseAdmin().from("projects").update({ published: false, published_files: null, showcase: false }).eq("id", id);
  invalidateSite(project);
  return Response.json({ ok: true });
});

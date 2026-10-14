import { IMAGE_CREDITS, MAX_IMAGES_PER_MESSAGE } from "@/config/models";
import { getPlan } from "@/config/plans";
import { getProfile } from "@/lib/auth";
import { generateSiteImages } from "@/lib/ai/images";
import { grantCredits, InsufficientCreditsError, refundCredits, spendCredits, syncCredits, totalCredits } from "@/lib/credits";
import { api, ApiError, getOwnedProject, rateLimit, requireApiUser } from "@/lib/http";
import { applyImageUrls, pendingImages } from "@/lib/site/render";
import { supabaseAdmin } from "@/lib/supabase/admin";
import type { Project } from "@/lib/types";

export const maxDuration = 300;

type Ctx = { params: Promise<{ id: string }> };

/** Generates photos for remaining image placeholders without sending a chat message. */
export const POST = api<Ctx>(async (req, ctx) => {
  const user = await requireApiUser(req);
  const { id } = await ctx.params;
  const [project, profile] = await Promise.all([getOwnedProject<Project>(id, user.id), getProfile(user.id)]);
  if (!getPlan(profile.plan).aiImages) throw new ApiError(403, "AI photos are not included in your plan.", "upgrade");
  if (project.status === "generating") throw new ApiError(409, "Wait for the AI to finish first.");
  if (!(await rateLimit(`images:${user.id}`, 10, 3600))) throw new ApiError(429, "Too many photo requests. Try again shortly.");

  const pending = pendingImages(project.files).slice(0, MAX_IMAGES_PER_MESSAGE);
  if (!pending.length) return Response.json({ files: project.files, generated: 0 });

  let ledgerId: number;
  try {
    ({ ledgerId } = await spendCredits(user.id, pending.length * IMAGE_CREDITS, `${pending.length} AI photos`, id));
  } catch (err) {
    if (err instanceof InsufficientCreditsError) throw new ApiError(402, `Generating ${pending.length} photos needs ${pending.length * IMAGE_CREDITS} credits.`, "credits");
    throw err;
  }

  const res = await generateSiteImages({ projectId: id, userId: user.id, requests: pending });
  if (res.costUsd) await supabaseAdmin().rpc("record_ai_spend", { p_cost: res.costUsd });
  if (res.failed === pending.length) {
    await refundCredits(ledgerId, "Photos failed — refunded");
    throw new ApiError(502, "Photo generation is unavailable right now. You haven't been charged.");
  }
  if (res.failed) await grantCredits(user.id, { bonus: res.failed * IMAGE_CREDITS }, "Refund: photos that failed to generate", id);

  // Re-read files in case they changed while photos were generating.
  const { data: fresh } = await supabaseAdmin().from("projects").select("files").eq("id", id).single();
  const files = applyImageUrls(fresh?.files ?? project.files, res.urls);
  const admin = supabaseAdmin();
  await admin.from("projects").update({ files }).eq("id", id);
  await admin.from("project_versions").insert({ project_id: id, files, label: `Generated ${res.urls.size} photos`, source: "images" });
  const credits = totalCredits(await syncCredits(user.id));
  return Response.json({ files, generated: res.urls.size, failed: res.failed, credits });
});

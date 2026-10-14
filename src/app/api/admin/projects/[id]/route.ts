import { z } from "zod";
import { getProfile, isAdmin } from "@/lib/auth";
import { api, ApiError, requireApiUser } from "@/lib/http";
import { invalidateSite } from "@/lib/site/hosting";
import { supabaseAdmin } from "@/lib/supabase/admin";

type Ctx = { params: Promise<{ id: string }> };

const Body = z.object({ action: z.enum(["block", "unblock"]), reason: z.string().max(300).optional() });

export const POST = api<Ctx>(async (req, ctx) => {
  const user = await requireApiUser(req);
  if (!isAdmin(await getProfile(user.id))) throw new ApiError(403, "Admins only");
  const { id } = await ctx.params;
  const { action, reason } = Body.parse(await req.json());
  const admin = supabaseAdmin();
  const { data: project } = await admin.from("projects").select("id, slug, custom_domain").eq("id", id).single();
  if (!project) throw new ApiError(404, "Not found");
  await admin
    .from("projects")
    .update(action === "block" ? { blocked: true, blocked_reason: reason ?? "Violates acceptable use policy" } : { blocked: false, blocked_reason: null })
    .eq("id", id);
  await admin.from("abuse_reports").update({ status: action === "block" ? "actioned" : "dismissed" }).eq("project_id", id).eq("status", "open");
  invalidateSite(project);
  return Response.json({ ok: true });
});

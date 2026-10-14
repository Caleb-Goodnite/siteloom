import { z } from "zod";
import { getProfile, isAdmin } from "@/lib/auth";
import { api, ApiError, requireApiUser } from "@/lib/http";
import { supabaseAdmin } from "@/lib/supabase/admin";

type Ctx = { params: Promise<{ id: string }> };

const Body = z.object({ status: z.enum(["open", "actioned", "dismissed"]) });

export const POST = api<Ctx>(async (req, ctx) => {
  const user = await requireApiUser(req);
  if (!isAdmin(await getProfile(user.id))) throw new ApiError(403, "Admins only");
  const { id } = await ctx.params;
  const { status } = Body.parse(await req.json());
  await supabaseAdmin().from("abuse_reports").update({ status }).eq("id", id);
  return Response.json({ ok: true });
});

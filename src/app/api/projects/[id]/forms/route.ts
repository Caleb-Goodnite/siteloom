import { z } from "zod";
import { api, getOwnedProject, requireApiUser } from "@/lib/http";
import { supabaseAdmin } from "@/lib/supabase/admin";

type Ctx = { params: Promise<{ id: string }> };

export const GET = api<Ctx>(async (_req, ctx) => {
  const user = await requireApiUser();
  const { id } = await ctx.params;
  await getOwnedProject(id, user.id, "id");
  const { data } = await supabaseAdmin()
    .from("form_submissions")
    .select("*")
    .eq("project_id", id)
    .order("created_at", { ascending: false })
    .limit(500);
  return Response.json({ submissions: data ?? [] });
});

const Patch = z.object({ ids: z.array(z.string().uuid()).max(500), read: z.boolean() });

export const PATCH = api<Ctx>(async (req, ctx) => {
  const user = await requireApiUser(req);
  const { id } = await ctx.params;
  await getOwnedProject(id, user.id, "id");
  const { ids, read } = Patch.parse(await req.json());
  await supabaseAdmin().from("form_submissions").update({ read }).eq("project_id", id).in("id", ids);
  return Response.json({ ok: true });
});

const Del = z.object({ ids: z.array(z.string().uuid()).max(500) });

export const DELETE = api<Ctx>(async (req, ctx) => {
  const user = await requireApiUser(req);
  const { id } = await ctx.params;
  await getOwnedProject(id, user.id, "id");
  const { ids } = Del.parse(await req.json());
  await supabaseAdmin().from("form_submissions").delete().eq("project_id", id).in("id", ids);
  return Response.json({ ok: true });
});

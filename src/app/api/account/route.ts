import { z } from "zod";
import { accountSummary } from "@/components/app/app-shell";
import { getProfile } from "@/lib/auth";
import { api, requireApiUser } from "@/lib/http";
import { invalidateSite } from "@/lib/site/hosting";
import { stripe } from "@/lib/stripe";
import { ASSETS_BUCKET, supabaseAdmin } from "@/lib/supabase/admin";

/** The signed-in header on static marketing pages loads the account from here. */
export const GET = api(async (req) => {
  const user = await requireApiUser(req);
  const profile = await getProfile(user.id);
  return Response.json(accountSummary(profile), { headers: { "Cache-Control": "private, no-store" } });
});

const Patch = z.object({
  full_name: z.string().trim().max(80).optional(),
  email_notifications: z.boolean().optional(),
  marketing_emails: z.boolean().optional(),
});

export const PATCH = api(async (req) => {
  const user = await requireApiUser(req);
  const body = Patch.parse(await req.json());
  await supabaseAdmin().from("profiles").update(body).eq("id", user.id);
  return Response.json({ ok: true });
});

/** Permanently deletes the account: cancels billing, takes sites offline, removes files and data. */
export const DELETE = api(async (req) => {
  const user = await requireApiUser(req);
  const body = z.object({ confirm: z.literal("DELETE") }).parse(await req.json());
  void body;
  const profile = await getProfile(user.id);
  const admin = supabaseAdmin();

  if (profile.stripe_subscription_id) {
    await stripe().subscriptions.cancel(profile.stripe_subscription_id).catch((e) => console.error("cancel failed", e));
  }
  const { data: projects } = await admin.from("projects").select("id, slug, custom_domain, published").eq("user_id", user.id);
  for (const p of projects ?? []) {
    const { data: objects } = await admin.storage.from(ASSETS_BUCKET).list(p.id, { limit: 1000 });
    if (objects?.length) await admin.storage.from(ASSETS_BUCKET).remove(objects.map((o) => `${p.id}/${o.name}`));
    if (p.published) invalidateSite(p);
  }
  // Cascades to profile, projects, versions, messages, submissions, analytics.
  const { error } = await admin.auth.admin.deleteUser(user.id);
  if (error) throw new Error(error.message);
  return Response.json({ ok: true });
});

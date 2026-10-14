import "server-only";
import { cache } from "react";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { after } from "next/server";
import { SIGNUP_BONUS } from "@/config/plans";
import { grantCredits, syncCredits } from "@/lib/credits";
import { sendWelcomeEmail } from "@/lib/email";
import { serverEnv } from "@/lib/env";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import type { Profile } from "@/lib/types";

export type SessionUser = { id: string; email: string };

export const REFERRAL_COOKIE = "sl_ref";

/** The verified signed-in user, or null. Deduplicated per request. */
export const getSessionUser = cache(async (): Promise<SessionUser | null> => {
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL) return null;
  const supabase = await createClient();
  const { data } = await supabase.auth.getClaims();
  const claims = data?.claims;
  if (!claims?.sub) return null;
  return { id: claims.sub, email: (claims.email as string | undefined) ?? "" };
});

export async function requireUser(next?: string) {
  const user = await getSessionUser();
  if (!user) redirect(next ? `/login?next=${encodeURIComponent(next)}` : "/login");
  return user;
}

/**
 * The user's profile with credits refilled if due. On the very first call it also
 * grants the welcome bonus, attributes a referral and sends the welcome email.
 */
export const getProfile = cache(async (userId: string): Promise<Profile> => {
  const profile = await syncCredits(userId);
  if (profile.welcomed) return profile;
  return onboard(profile);
});

async function onboard(profile: Profile): Promise<Profile> {
  const admin = supabaseAdmin();
  const update: Record<string, unknown> = { welcomed: true };

  const refCode = (await cookies()).get(REFERRAL_COOKIE)?.value?.toLowerCase();
  if (refCode && !profile.referred_by && refCode !== profile.referral_code) {
    const { data: referrer } = await admin.from("profiles").select("id").eq("referral_code", refCode).maybeSingle();
    if (referrer && referrer.id !== profile.id) update.referred_by = referrer.id;
  }

  // Conditional update: only the first concurrent request wins, so the bonus is granted once.
  const { data: claimed } = await admin
    .from("profiles")
    .update(update)
    .eq("id", profile.id)
    .eq("welcomed", false)
    .select("id")
    .maybeSingle();

  if (claimed) {
    await grantCredits(profile.id, { bonus: SIGNUP_BONUS }, "Welcome bonus");
    after(() => sendWelcomeEmail(profile.email, profile.full_name));
  }
  return syncCredits(profile.id);
}

export function isAdmin(profile: Pick<Profile, "is_admin" | "email">) {
  return profile.is_admin || serverEnv.adminEmails.includes(profile.email.toLowerCase());
}

export async function requireAdmin() {
  const user = await requireUser("/admin");
  const profile = await getProfile(user.id);
  if (!isAdmin(profile)) redirect("/dashboard");
  return { user, profile };
}

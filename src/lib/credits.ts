import "server-only";
import { PLANS } from "@/config/plans";
import { supabaseAdmin } from "@/lib/supabase/admin";
import type { Profile } from "@/lib/types";

/**
 * Refill rules per plan, passed to Postgres so the locked row's current plan decides
 * the refill atomically. Free refills daily; paid plans refill monthly (renewal
 * webhooks also reset it, and yearly plans rely on this monthly refill).
 */
function refillRules() {
  return Object.fromEntries(
    Object.values(PLANS).map((p) => [
      p.id,
      p.id === "free"
        ? { refill: p.dailyCredits, every: "1 day" }
        : { refill: p.monthlyCredits, every: "1 month" },
    ]),
  );
}

export class InsufficientCreditsError extends Error {
  constructor() {
    super("insufficient_credits");
  }
}

export async function syncCredits(userId: string): Promise<Profile> {
  const { data, error } = await supabaseAdmin().rpc("sync_credits", { p_user: userId, p_rules: refillRules() });
  if (error) throw new Error(`sync_credits failed: ${error.message}`);
  return data as Profile;
}

export async function spendCredits(userId: string, amount: number, reason: string, ref?: string) {
  const { data, error } = await supabaseAdmin().rpc("spend_credits", {
    p_user: userId,
    p_amount: amount,
    p_rules: refillRules(),
    p_reason: reason,
    p_ref: ref ?? null,
  });
  if (error) {
    if (error.message.includes("insufficient_credits")) throw new InsufficientCreditsError();
    throw new Error(`spend_credits failed: ${error.message}`);
  }
  const row = (Array.isArray(data) ? data[0] : data) as { ledger_id: number; allowance: number; bonus: number };
  return { ledgerId: row.ledger_id, remaining: row.allowance + row.bonus };
}

export async function refundCredits(ledgerId: number, reason: string) {
  const { error } = await supabaseAdmin().rpc("refund_credits", { p_ledger_id: ledgerId, p_reason: reason });
  if (error) console.error("refund_credits failed", error);
}

export async function grantCredits(
  userId: string,
  opts: { bonus?: number; setAllowance?: number | null },
  reason: string,
  ref?: string,
) {
  const { error } = await supabaseAdmin().rpc("grant_credits", {
    p_user: userId,
    p_bonus: opts.bonus ?? 0,
    p_set_allowance: opts.setAllowance ?? null,
    p_reason: reason,
    p_ref: ref ?? null,
  });
  if (error) throw new Error(`grant_credits failed: ${error.message}`);
}

export function totalCredits(p: Pick<Profile, "credits_allowance" | "credits_bonus">) {
  return p.credits_allowance + p.credits_bonus;
}

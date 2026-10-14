import { Coins, Gift } from "lucide-react";
import { Suspense } from "react";
import { BillingActions, BuyCredits, CopyField, CheckoutEffects } from "@/components/app/billing-actions";
import { PricingTable } from "@/components/marketing/pricing-table";
import { Badge } from "@/components/ui/misc";
import { CREDIT_PACKS, getPlan, REFERRAL_REWARD } from "@/config/plans";
import { site } from "@/config/site";
import { getProfile, requireUser } from "@/lib/auth";
import { totalCredits } from "@/lib/credits";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { formatRelative } from "@/lib/utils";

export default async function BillingPage() {
  const user = await requireUser("/dashboard/billing");
  const profile = await getProfile(user.id);
  const plan = getPlan(profile.plan);
  const admin = supabaseAdmin();
  const [{ data: ledger }, { count: referred }, { count: rewarded }] = await Promise.all([
    admin.from("credit_ledger").select("id, delta_allowance, delta_bonus, reason, created_at").eq("user_id", user.id).order("created_at", { ascending: false }).limit(25),
    admin.from("profiles").select("id", { count: "exact", head: true }).eq("referred_by", user.id),
    admin.from("profiles").select("id", { count: "exact", head: true }).eq("referred_by", user.id).eq("referral_rewarded", true),
  ]);

  const nextRefill =
    plan.id === "free"
      ? new Date(new Date(profile.credits_reset_at).getTime() + 86400_000)
      : new Date(new Date(profile.credits_reset_at).setMonth(new Date(profile.credits_reset_at).getMonth() + 1));
  const refLink = `${site.url}/?ref=${profile.referral_code}`;

  return (
    <div className="space-y-10">
      <Suspense>
        <CheckoutEffects />
      </Suspense>
      <h1 className="font-display text-5xl text-ink">Billing & credits</h1>

      <div className="grid gap-4 md:grid-cols-3">
        <div className="rounded-2xl border border-line bg-card p-6">
          <p className="text-sm text-muted">Current plan</p>
          <p className="mt-1 flex items-center gap-2 text-2xl font-semibold text-ink">
            {plan.name}
            {profile.subscription_status && profile.subscription_status !== "active" && plan.id !== "free" && (
              <Badge tone={profile.subscription_status === "past_due" ? "danger" : "warn"}>{profile.subscription_status.replace("_", " ")}</Badge>
            )}
          </p>
          {profile.current_period_end && plan.id !== "free" && (
            <p className="mt-1 text-sm text-ink-2">
              {profile.cancel_at_period_end ? "Ends" : "Renews"} on {new Date(profile.current_period_end).toLocaleDateString()}
              {profile.billing_interval === "year" ? " (yearly)" : ""}
            </p>
          )}
          {profile.subscription_status === "past_due" && (
            <p className="mt-2 text-sm text-danger">Your last payment failed. Update your card to keep your plan.</p>
          )}
          <div className="mt-5">
            <BillingActions hasCustomer={Boolean(profile.stripe_customer_id)} />
          </div>
        </div>

        <div className="rounded-2xl border border-line bg-card p-6">
          <p className="flex items-center gap-1.5 text-sm text-muted">
            <Coins className="size-4 text-accent" /> Credits available
          </p>
          <p className="mt-1 font-display text-5xl text-ink">{totalCredits(profile)}</p>
          <p className="mt-1 text-sm text-ink-2">
            {profile.credits_allowance} from your plan · {profile.credits_bonus} bonus
          </p>
          <p className="mt-1 text-xs text-muted">
            Plan credits refill to {plan.id === "free" ? plan.dailyCredits : plan.monthlyCredits} on {nextRefill.toLocaleDateString()}. Bonus credits never expire.
          </p>
        </div>

        <div className="rounded-2xl border border-line bg-card p-6">
          <p className="text-sm text-muted">Top up</p>
          <p className="mt-1 text-sm text-ink-2">One-time packs. They never expire.</p>
          <div className="mt-4 space-y-2">
            {CREDIT_PACKS.map((p) => (
              <BuyCredits key={p.id} pack={p.id} label={`${p.credits.toLocaleString()} credits`} price={`$${p.price}`} />
            ))}
          </div>
        </div>
      </div>

      <section>
        <h2 className="mb-6 text-lg font-semibold text-ink">Plans</h2>
        <PricingTable currentPlan={plan.id} />
      </section>

      <section className="grid gap-4 md:grid-cols-2">
        <div className="rounded-2xl border border-line bg-card p-6">
          <h2 className="flex items-center gap-2 text-lg font-semibold text-ink">
            <Gift className="size-5 text-accent" /> Give credits, get credits
          </h2>
          <p className="mt-1 text-sm text-ink-2">
            When someone signs up with your link and starts a paid plan, you get {REFERRAL_REWARD.referrer} credits and they get {REFERRAL_REWARD.referee}.
          </p>
          <div className="mt-4">
            <CopyField value={refLink} />
          </div>
          <p className="mt-3 text-xs text-muted">
            {referred ?? 0} signed up · {rewarded ?? 0} upgraded
          </p>
        </div>

        <div className="rounded-2xl border border-line bg-card p-6">
          <h2 className="text-lg font-semibold text-ink">Credit history</h2>
          <ul className="mt-3 max-h-72 divide-y divide-line overflow-y-auto text-sm scrollbar-thin">
            {(ledger ?? []).map((l) => {
              const delta = l.delta_allowance + l.delta_bonus;
              return (
                <li key={l.id} className="flex items-center justify-between gap-3 py-2">
                  <span className="min-w-0 truncate text-ink-2">{l.reason}</span>
                  <span className="flex shrink-0 items-center gap-3">
                    <span className="text-xs text-muted">{formatRelative(l.created_at)}</span>
                    <span className={delta >= 0 ? "font-medium text-ok" : "font-medium text-ink"}>
                      {delta >= 0 ? "+" : ""}
                      {delta}
                    </span>
                  </span>
                </li>
              );
            })}
            {!ledger?.length && <li className="py-2 text-muted">No activity yet.</li>}
          </ul>
        </div>
      </section>
    </div>
  );
}

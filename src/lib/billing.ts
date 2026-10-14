import "server-only";
import type Stripe from "stripe";
import { CREDIT_PACKS, getPlan, parseLookupKey, PLANS, REFERRAL_REWARD, type PlanId } from "@/config/plans";
import { grantCredits } from "@/lib/credits";
import { redeployPublished } from "@/lib/site/deploy";
import { stripe } from "@/lib/stripe";
import { supabaseAdmin } from "@/lib/supabase/admin";

const ENTITLED = new Set(["active", "trialing", "past_due"]);

async function userIdForCustomer(customerId: string, metadataUserId?: string | null) {
  if (metadataUserId) return metadataUserId;
  const { data } = await supabaseAdmin().from("profiles").select("id").eq("stripe_customer_id", customerId).maybeSingle();
  if (data) return data.id as string;
  // Fall back to the customer's own metadata (set when we created it).
  const customer = await stripe().customers.retrieve(customerId);
  return !customer.deleted ? (customer.metadata?.user_id ?? null) : null;
}

const idOf = (v: string | { id: string } | null | undefined) => (typeof v === "string" ? v : (v?.id ?? null));

/** The invoice's subscription id across API versions (moved under `parent` in 2025). */
function invoiceSubscriptionId(invoice: Stripe.Invoice) {
  const legacy = (invoice as unknown as { subscription?: string | { id: string } | null }).subscription;
  return idOf(invoice.parent?.subscription_details?.subscription ?? legacy);
}

/** Mirrors a Stripe subscription onto the profile (plan, status, period) and adjusts credits. */
export async function syncSubscription(sub: Stripe.Subscription) {
  const admin = supabaseAdmin();
  const customerId = idOf(sub.customer)!;
  const userId = await userIdForCustomer(customerId, sub.metadata?.user_id);
  if (!userId) {
    console.warn("subscription for unknown user", sub.id);
    return null;
  }
  const item = sub.items.data[0];
  const parsed = parseLookupKey(item?.price.lookup_key);
  const entitled = ENTITLED.has(sub.status) && parsed;
  const plan: PlanId = entitled ? parsed.plan : "free";

  const { data: before } = await admin.from("profiles").select("plan, credits_allowance").eq("id", userId).single();

  await admin
    .from("profiles")
    .update({
      plan,
      billing_interval: entitled ? parsed.interval : null,
      stripe_customer_id: customerId,
      stripe_subscription_id: entitled ? sub.id : null,
      subscription_status: sub.status,
      current_period_end: item?.current_period_end ? new Date(item.current_period_end * 1000).toISOString() : null,
      cancel_at_period_end: sub.cancel_at_period_end || Boolean(sub.cancel_at),
    })
    .eq("id", userId);

  const oldPlan = getPlan(before?.plan);
  const newPlan = getPlan(plan);
  if (oldPlan.id !== newPlan.id && oldPlan.badge !== newPlan.badge) {
    // Add/remove the "Made with" badge on live sites.
    const { data: live } = await admin.from("projects").select("id").eq("user_id", userId).eq("published", true);
    for (const p of live ?? []) await redeployPublished(p.id).catch((e) => console.error("redeploy failed", e));
  }
  if (oldPlan.id !== newPlan.id) {
    if (newPlan.id === "free") {
      await downgradeToFree(userId);
    } else if (newPlan.monthlyCredits > oldPlan.monthlyCredits) {
      // Upgrade: start the new allowance immediately.
      await grantCredits(userId, { setAllowance: newPlan.monthlyCredits }, `${newPlan.name} plan credits`, sub.id);
    } else if ((before?.credits_allowance ?? 0) > newPlan.monthlyCredits) {
      await grantCredits(userId, { setAllowance: newPlan.monthlyCredits }, `Changed to ${newPlan.name}`, sub.id);
    }
  }
  return { userId, plan };
}

async function downgradeToFree(userId: string) {
  const admin = supabaseAdmin();
  const { data } = await admin.from("profiles").select("credits_allowance").eq("id", userId).single();
  // Epoch reset date: the free daily allowance kicks in on the next request.
  await admin
    .from("profiles")
    .update({ plan: "free", billing_interval: null, stripe_subscription_id: null, credits_allowance: 0, credits_reset_at: "1970-01-01T00:00:00Z" })
    .eq("id", userId);
  if (data?.credits_allowance) {
    await admin.from("credit_ledger").insert({ user_id: userId, delta_allowance: -data.credits_allowance, reason: "Subscription ended" });
  }
}

async function rewardReferral(userId: string) {
  const admin = supabaseAdmin();
  // Conditional update makes this idempotent across webhook retries.
  const { data } = await admin
    .from("profiles")
    .update({ referral_rewarded: true })
    .eq("id", userId)
    .eq("referral_rewarded", false)
    .not("referred_by", "is", null)
    .select("referred_by")
    .maybeSingle();
  if (!data?.referred_by) return;
  await grantCredits(data.referred_by, { bonus: REFERRAL_REWARD.referrer }, "Referral reward — a friend upgraded", userId);
  await grantCredits(userId, { bonus: REFERRAL_REWARD.referee }, "Referral bonus — thanks for joining");
}

export async function handleStripeEvent(event: Stripe.Event) {
  switch (event.type) {
    case "checkout.session.completed": {
      const session = event.data.object;
      const customerId = idOf(session.customer);
      const userId = session.metadata?.user_id ?? session.client_reference_id;
      if (userId && customerId) {
        await supabaseAdmin().from("profiles").update({ stripe_customer_id: customerId }).eq("id", userId).is("stripe_customer_id", null);
      }
      if (session.mode === "payment" && session.payment_status === "paid" && userId) {
        const pack = CREDIT_PACKS.find((p) => p.id === session.metadata?.pack);
        if (pack) await grantCredits(userId, { bonus: pack.credits }, `Purchased ${pack.credits} credits`, session.id);
      }
      if (session.mode === "subscription" && session.subscription) {
        await syncSubscription(await stripe().subscriptions.retrieve(idOf(session.subscription)!));
      }
      break;
    }
    case "checkout.session.async_payment_succeeded": {
      const session = event.data.object;
      const userId = session.metadata?.user_id ?? session.client_reference_id;
      const pack = CREDIT_PACKS.find((p) => p.id === session.metadata?.pack);
      if (userId && pack) await grantCredits(userId, { bonus: pack.credits }, `Purchased ${pack.credits} credits`, session.id);
      break;
    }
    case "customer.subscription.created":
    case "customer.subscription.updated":
    case "customer.subscription.deleted":
    case "customer.subscription.paused":
    case "customer.subscription.resumed": {
      // Always sync from the latest state: events can arrive out of order, and the payload
      // shape follows the webhook endpoint's API version rather than the SDK's.
      await syncSubscription(await stripe().subscriptions.retrieve(event.data.object.id));
      break;
    }
    case "invoice.paid": {
      const invoice = event.data.object;
      const subId = invoiceSubscriptionId(invoice);
      if (!subId) break;
      // Re-sync first: webhooks can arrive out of order.
      const synced = await syncSubscription(await stripe().subscriptions.retrieve(subId));
      if (!synced || synced.plan === "free") break;
      if (invoice.billing_reason === "subscription_cycle" || invoice.billing_reason === "subscription_create") {
        const plan = PLANS[synced.plan];
        await grantCredits(synced.userId, { setAllowance: plan.monthlyCredits }, `${plan.name} monthly credits`, invoice.id);
      }
      if (invoice.billing_reason === "subscription_create") await rewardReferral(synced.userId);
      break;
    }
    case "invoice.payment_failed": {
      const invoice = event.data.object;
      const subId = invoiceSubscriptionId(invoice);
      if (subId) await syncSubscription(await stripe().subscriptions.retrieve(subId));
      break;
    }
    default:
      break;
  }
}

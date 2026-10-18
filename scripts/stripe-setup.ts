/**
 * One-command Stripe setup. Idempotent — safe to re-run after changing prices in
 * src/config/plans.ts.
 *
 *   npm run stripe:setup
 *
 * Creates/updates:
 *  - a Product per paid plan with monthly + yearly Prices (lookup keys: pro_month, pro_year, …)
 *  - a Product per credit pack with a one-time Price (lookup key: credits_250, …)
 *  - the Customer Portal configuration (plan switching, cancellation, invoices)
 *  - the webhook endpoint (when NEXT_PUBLIC_APP_URL is a public https URL), printing its secret
 */
import { config } from "dotenv";
import Stripe from "stripe";
import { CREDIT_PACKS, PAID_PLANS, PLANS, planLookupKey } from "../src/config/plans";

config({ path: ".env.local" });
config();

const key = process.env.STRIPE_SECRET_KEY;
if (!key) {
  console.error("Set STRIPE_SECRET_KEY in .env.local first.");
  process.exit(1);
}
const appUrl = (process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000").replace(/\/$/, "");
const base = process.env.STRIPE_API_BASE ? new URL(process.env.STRIPE_API_BASE) : null;
const stripe = new Stripe(key, base ? { host: base.hostname, port: Number(base.port || 443), protocol: base.protocol.replace(":", "") as "http" | "https" } : {});

const WEBHOOK_EVENTS: Stripe.WebhookEndpointCreateParams.EnabledEvent[] = [
  "checkout.session.completed",
  "checkout.session.async_payment_succeeded",
  "customer.subscription.created",
  "customer.subscription.updated",
  "customer.subscription.deleted",
  "customer.subscription.paused",
  "customer.subscription.resumed",
  "invoice.paid",
  "invoice.payment_failed",
];

async function ensureProduct(appKey: string, name: string, description: string) {
  for await (const p of stripe.products.list({ limit: 100, active: true })) {
    if (p.metadata?.app_key === appKey) {
      if (p.name !== name || p.description !== description) await stripe.products.update(p.id, { name, description });
      return p.id;
    }
  }
  const created = await stripe.products.create({ name, description, metadata: { app_key: appKey } });
  return created.id;
}

async function ensurePrice(product: string, lookupKey: string, amountUsd: number, interval?: "month" | "year") {
  const unit = Math.round(amountUsd * 100);
  const existing = (await stripe.prices.list({ lookup_keys: [lookupKey], active: true, limit: 1 })).data[0];
  const same =
    existing &&
    existing.unit_amount === unit &&
    existing.product === product &&
    (interval ? existing.recurring?.interval === interval : !existing.recurring);
  if (same) return existing.id;
  const created = await stripe.prices.create({
    product,
    currency: "usd",
    unit_amount: unit,
    lookup_key: lookupKey,
    transfer_lookup_key: true,
    ...(interval ? { recurring: { interval } } : {}),
    tax_behavior: "exclusive",
  });
  if (existing) await stripe.prices.update(existing.id, { active: false });
  console.log(`  price ${lookupKey}: $${amountUsd}${interval ? `/${interval}` : ""} ${existing ? "(replaced)" : "(created)"}`);
  return created.id;
}

async function main() {
  console.log(`Stripe ${key!.startsWith("sk_live") ? "LIVE" : "test"} mode${base ? ` via ${base.origin}` : ""}\n`);

  const portalProducts: Stripe.BillingPortal.ConfigurationCreateParams.Features.SubscriptionUpdate.Product[] = [];
  for (const id of PAID_PLANS) {
    const plan = PLANS[id];
    const product = await ensureProduct(`plan_${id}`, `${plan.name} plan`, plan.blurb);
    const month = await ensurePrice(product, planLookupKey(id, "month"), plan.priceMonthly, "month");
    const year = await ensurePrice(product, planLookupKey(id, "year"), plan.priceYearly, "year");
    portalProducts.push({ product, prices: [month, year] });
    console.log(`✓ ${plan.name}: $${plan.priceMonthly}/mo, $${plan.priceYearly}/yr`);
  }
  for (const pack of CREDIT_PACKS) {
    const product = await ensureProduct(pack.id, `${pack.credits.toLocaleString()} credits`, "One-time credit top-up. Never expires.");
    await ensurePrice(product, pack.id, pack.price);
    console.log(`✓ ${pack.credits} credits: $${pack.price}`);
  }

  const features: Stripe.BillingPortal.ConfigurationCreateParams.Features = {
    customer_update: { enabled: true, allowed_updates: ["email", "address", "tax_id", "name"] },
    invoice_history: { enabled: true },
    payment_method_update: { enabled: true },
    subscription_cancel: {
      enabled: true,
      mode: "at_period_end",
      cancellation_reason: { enabled: true, options: ["too_expensive", "missing_features", "switched_service", "unused", "other"] },
    },
    subscription_update: {
      enabled: true,
      default_allowed_updates: ["price"],
      proration_behavior: "create_prorations",
      products: portalProducts,
    },
  };
  const configs = await stripe.billingPortal.configurations.list({ limit: 20, active: true });
  const current = configs.data.find((c) => c.is_default) ?? configs.data[0];
  if (current) {
    await stripe.billingPortal.configurations.update(current.id, { features, default_return_url: `${appUrl}/dashboard/billing` });
    console.log("✓ Customer portal updated");
  } else {
    await stripe.billingPortal.configurations.create({
      features,
      business_profile: { headline: "Manage your plan, payment method and invoices." },
      default_return_url: `${appUrl}/dashboard/billing`,
    });
    console.log("✓ Customer portal created");
  }

  const webhookUrl = `${appUrl}/api/stripe/webhook`;
  if (appUrl.startsWith("https://") && !appUrl.includes("localhost")) {
    let found: Stripe.WebhookEndpoint | undefined;
    for await (const w of stripe.webhookEndpoints.list({ limit: 100 })) if (w.url === webhookUrl) found = w;
    if (found) {
      await stripe.webhookEndpoints.update(found.id, { enabled_events: WEBHOOK_EVENTS });
      console.log(`✓ Webhook already exists: ${webhookUrl} (secret unchanged — copy it from the Stripe dashboard if needed)`);
    } else {
      const created = await stripe.webhookEndpoints.create({
        url: webhookUrl,
        enabled_events: WEBHOOK_EVENTS,
        description: "Curblit app",
        // Match the SDK so event payloads have the shape the app's types expect.
        api_version: Stripe.API_VERSION,
      });
      console.log(`✓ Webhook created: ${webhookUrl}\n\n  Add this to your environment:\n  STRIPE_WEBHOOK_SECRET=${created.secret}\n`);
    }
  } else {
    console.log(`\nLocal development: forward webhooks with the Stripe CLI:\n  stripe listen --forward-to localhost:3000/api/stripe/webhook\nand put the printed whsec_… value in STRIPE_WEBHOOK_SECRET.`);
  }
  console.log("\nDone.");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});

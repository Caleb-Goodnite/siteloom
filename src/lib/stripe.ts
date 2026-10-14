import "server-only";
import Stripe from "stripe";
import { site } from "@/config/site";
import { serverEnv } from "@/lib/env";
import { supabaseAdmin } from "@/lib/supabase/admin";
import type { Profile } from "@/lib/types";

let client: Stripe | null = null;

/**
 * Stripe client. Set STRIPE_API_BASE (e.g. http://localhost:12111) to point at a
 * Stripe mock/simulator instead of api.stripe.com for local testing.
 */
export function stripe() {
  if (!client) {
    const base = process.env.STRIPE_API_BASE ? new URL(process.env.STRIPE_API_BASE) : null;
    client = new Stripe(serverEnv.stripeSecretKey, {
      appInfo: { name: site.name, url: site.url },
      maxNetworkRetries: 2,
      ...(base
        ? {
            host: base.hostname,
            port: Number(base.port || (base.protocol === "https:" ? 443 : 80)),
            protocol: base.protocol.replace(":", "") as "http" | "https",
          }
        : {}),
    });
  }
  return client;
}

const priceCache = new Map<string, { id: string; at: number }>();

/** Resolves a price by lookup key (e.g. "pro_month"), cached for 10 minutes. */
export async function priceIdFor(lookupKey: string) {
  const hit = priceCache.get(lookupKey);
  if (hit && Date.now() - hit.at < 600_000) return hit.id;
  const prices = await stripe().prices.list({ lookup_keys: [lookupKey], active: true, limit: 1 });
  const price = prices.data[0];
  if (!price) throw new Error(`No active Stripe price with lookup key "${lookupKey}". Run: npm run stripe:setup`);
  priceCache.set(lookupKey, { id: price.id, at: Date.now() });
  return price.id;
}

export async function getOrCreateCustomer(profile: Profile) {
  if (profile.stripe_customer_id) return profile.stripe_customer_id;
  const customer = await stripe().customers.create(
    {
      email: profile.email,
      name: profile.full_name ?? undefined,
      metadata: { user_id: profile.id },
    },
    { idempotencyKey: `customer-${profile.id}` },
  );
  await supabaseAdmin().from("profiles").update({ stripe_customer_id: customer.id }).eq("id", profile.id);
  return customer.id;
}

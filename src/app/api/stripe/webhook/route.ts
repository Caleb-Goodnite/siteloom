import type Stripe from "stripe";
import { handleStripeEvent } from "@/lib/billing";
import { serverEnv } from "@/lib/env";
import { stripe } from "@/lib/stripe";
import { supabaseAdmin } from "@/lib/supabase/admin";

export const maxDuration = 60;

/**
 * Stripe → app sync. Each event is processed once (stripe_events table); if handling
 * fails the marker is removed and we return 500 so Stripe retries automatically.
 */
export async function POST(req: Request) {
  const signature = req.headers.get("stripe-signature");
  if (!signature) return new Response("Missing signature", { status: 400 });

  let event: Stripe.Event;
  try {
    event = await stripe().webhooks.constructEventAsync(await req.text(), signature, serverEnv.stripeWebhookSecret);
  } catch (err) {
    console.error("Stripe signature verification failed", err);
    return new Response("Invalid signature", { status: 400 });
  }

  const admin = supabaseAdmin();
  const { error: dup } = await admin.from("stripe_events").insert({ id: event.id, type: event.type });
  if (dup) {
    if (dup.code === "23505") return Response.json({ received: true, duplicate: true });
    console.error("stripe_events insert failed", dup);
    return new Response("Storage error", { status: 500 });
  }

  try {
    await handleStripeEvent(event);
  } catch (err) {
    console.error(`Stripe event ${event.type} (${event.id}) failed`, err);
    await admin.from("stripe_events").delete().eq("id", event.id);
    return new Response("Handler error", { status: 500 });
  }
  return Response.json({ received: true });
}

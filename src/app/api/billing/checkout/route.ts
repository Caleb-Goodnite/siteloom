import { z } from "zod";
import { CREDIT_PACKS, PAID_PLANS, planLookupKey, type PlanId } from "@/config/plans";
import { site } from "@/config/site";
import { getProfile } from "@/lib/auth";
import { api, ApiError, requireApiUser } from "@/lib/http";
import { getOrCreateCustomer, priceIdFor, stripe } from "@/lib/stripe";

const Body = z.union([
  z.object({ plan: z.enum(PAID_PLANS as [PlanId, ...PlanId[]]), interval: z.enum(["month", "year"]) }),
  z.object({ pack: z.string() }),
]);

export const POST = api(async (req) => {
  const user = await requireApiUser(req);
  const body = Body.parse(await req.json());
  const profile = await getProfile(user.id);
  const customer = await getOrCreateCustomer(profile);
  const automaticTax = process.env.STRIPE_AUTOMATIC_TAX === "true";
  const returnUrl = `${site.url}/dashboard/billing`;

  if ("pack" in body) {
    const pack = CREDIT_PACKS.find((p) => p.id === body.pack);
    if (!pack) throw new ApiError(400, "Unknown credit pack.");
    const session = await stripe().checkout.sessions.create({
      mode: "payment",
      customer,
      client_reference_id: user.id,
      line_items: [{ price: await priceIdFor(pack.id), quantity: 1 }],
      metadata: { user_id: user.id, pack: pack.id },
      invoice_creation: { enabled: true },
      automatic_tax: { enabled: automaticTax },
      ...(automaticTax ? { customer_update: { address: "auto" as const } } : {}),
      success_url: `${returnUrl}?checkout=credits`,
      cancel_url: `${returnUrl}?checkout=cancelled`,
    });
    return Response.json({ url: session.url });
  }

  // Existing subscribers change plans in the billing portal (handles proration).
  if (profile.stripe_subscription_id && profile.plan !== "free") {
    const portal = await stripe().billingPortal.sessions.create({
      customer,
      return_url: returnUrl,
      flow_data: { type: "subscription_update", subscription_update: { subscription: profile.stripe_subscription_id } },
    });
    return Response.json({ url: portal.url });
  }

  const session = await stripe().checkout.sessions.create({
    mode: "subscription",
    customer,
    client_reference_id: user.id,
    line_items: [{ price: await priceIdFor(planLookupKey(body.plan, body.interval)), quantity: 1 }],
    metadata: { user_id: user.id },
    subscription_data: { metadata: { user_id: user.id } },
    allow_promotion_codes: true,
    automatic_tax: { enabled: automaticTax },
    ...(automaticTax ? { customer_update: { address: "auto" as const } } : {}),
    success_url: `${returnUrl}?checkout=success&plan=${body.plan}&interval=${body.interval}`,
    cancel_url: `${returnUrl}?checkout=cancelled`,
  });
  return Response.json({ url: session.url });
});

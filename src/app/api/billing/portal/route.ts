import { site } from "@/config/site";
import { getProfile } from "@/lib/auth";
import { api, requireApiUser } from "@/lib/http";
import { getOrCreateCustomer, stripe } from "@/lib/stripe";

/** Stripe-hosted billing portal: invoices, payment method, plan changes, cancellation. */
export const POST = api(async (req) => {
  const user = await requireApiUser(req);
  const profile = await getProfile(user.id);
  const customer = await getOrCreateCustomer(profile);
  const session = await stripe().billingPortal.sessions.create({ customer, return_url: `${site.url}/dashboard/billing` });
  return Response.json({ url: session.url });
});

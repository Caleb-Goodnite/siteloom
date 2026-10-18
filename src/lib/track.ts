import { track as vercelTrack } from "@vercel/analytics";

/**
 * Conversion events for curblit.com's own analytics. Always sent to Vercel Web Analytics
 * (custom events). Also sent to GA4 and the Meta Pixel when those are configured for ads
 * (NEXT_PUBLIC_GA_ID / NEXT_PUBLIC_META_PIXEL_ID); Google Ads imports conversions from GA4.
 */
export type FunnelEvent =
  | "signup"
  | "site_created"
  | "redesign_started"
  | "grader_used"
  | "site_published"
  | "checkout_started"
  | "credits_purchase_started"
  | "purchase";

/** Standard Meta events for the funnel steps ads should optimize toward. */
const META: Partial<Record<FunnelEvent, string>> = {
  signup: "CompleteRegistration",
  site_created: "Lead",
  redesign_started: "Lead",
  checkout_started: "InitiateCheckout",
  purchase: "Purchase",
};

type Win = Window & {
  gtag?: (...args: unknown[]) => void;
  fbq?: (...args: unknown[]) => void;
};

export function track(event: FunnelEvent, props?: Record<string, string | number>) {
  if (typeof window === "undefined") return;
  const w = window as Win;
  try {
    vercelTrack(event, props);
    w.gtag?.("event", event, props ?? {});
    if (META[event]) w.fbq?.("track", META[event], props ?? {});
  } catch {
    // analytics must never break the product
  }
}

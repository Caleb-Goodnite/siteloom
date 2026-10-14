/**
 * Conversion events for siteloom.app's own analytics. Sends to Plausible and/or Google
 * Analytics 4 when they're configured (NEXT_PUBLIC_PLAUSIBLE_DOMAIN / NEXT_PUBLIC_GA_ID);
 * otherwise does nothing.
 */
export type FunnelEvent =
  | "signup"
  | "site_created"
  | "redesign_started"
  | "grader_used"
  | "site_published"
  | "checkout_started"
  | "credits_purchase_started";

type Win = Window & {
  plausible?: (event: string, opts?: { props?: Record<string, string | number> }) => void;
  gtag?: (...args: unknown[]) => void;
};

export function track(event: FunnelEvent, props?: Record<string, string | number>) {
  if (typeof window === "undefined") return;
  const w = window as Win;
  try {
    w.plausible?.(event, props ? { props } : undefined);
    w.gtag?.("event", event, props ?? {});
  } catch {
    // analytics must never break the product
  }
}

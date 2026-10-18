import type { ModelTier } from "./models";

/**
 * Plans and credit economics. Stripe prices are created from this file by
 * `npm run stripe:setup`, keyed by lookup key (`pro_month`, `pro_year`, `credits_250`...),
 * so changing a price here + re-running setup is all it takes.
 *
 * Unit economics (measured Oct 2026): real messages cost ~$0.03–0.04 per credit (worst case:
 * Standard/Max new-site builds); Standard edits cost ~$0.0125–0.025/credit. Allowances are sized
 * so a user who spends every credit at the worst case costs at most ~half the monthly price,
 * and typical usage (~30% of the allowance) costs ~15%. Check the admin page's cost-per-credit
 * figure as real usage comes in.
 * Yearly = 10× monthly ("2 months free"): Starter $190, Pro $390, Business $990.
 */
export type PlanId = "free" | "starter" | "pro" | "business";
export type Interval = "month" | "year";

export type Plan = {
  id: PlanId;
  name: string;
  blurb: string;
  priceMonthly: number;
  priceYearly: number;
  /** Credits granted every billing month (paid plans). */
  monthlyCredits: number;
  /** Credits refilled every 24h (free plan). */
  dailyCredits: number;
  maxProjects: number;
  maxPublished: number;
  customDomains: number;
  /** Show the small "Made with" badge on published sites. */
  badge: boolean;
  tiers: ModelTier[];
  aiImages: boolean;
  highlight?: boolean;
  features: string[];
};

export const PLANS: Record<PlanId, Plan> = {
  free: {
    id: "free",
    name: "Free",
    blurb: "Try it out and publish your first site.",
    priceMonthly: 0,
    priceYearly: 0,
    monthlyCredits: 0,
    dailyCredits: 3,
    maxProjects: 3,
    maxPublished: 1,
    customDomains: 0,
    badge: true,
    tiers: ["fast", "standard"],
    aiImages: true,
    features: [
      "3 credits every day + 20 bonus credits to start",
      "1 published site on a free subdomain",
      "Working contact forms + analytics",
      "Unlimited free text edits",
      "Download your code anytime",
    ],
  },
  starter: {
    id: "starter",
    name: "Starter",
    blurb: "For a business that needs one great site.",
    priceMonthly: 19,
    priceYearly: 190,
    monthlyCredits: 200,
    dailyCredits: 0,
    maxProjects: 10,
    maxPublished: 3,
    customDomains: 1,
    badge: false,
    tiers: ["fast", "standard"],
    aiImages: true,
    features: [
      "200 credits / month",
      "3 published sites",
      "Connect your own domain",
      "Remove the Curblit badge",
      "Form email notifications",
    ],
  },
  pro: {
    id: "pro",
    name: "Pro",
    blurb: "For freelancers and growing businesses.",
    priceMonthly: 39,
    priceYearly: 390,
    monthlyCredits: 500,
    dailyCredits: 0,
    maxProjects: 50,
    maxPublished: 15,
    customDomains: 15,
    badge: false,
    tiers: ["fast", "standard", "max"],
    aiImages: true,
    highlight: true,
    features: [
      "500 credits / month",
      "15 published sites + custom domains",
      "Max model for complex builds",
      "Everything in Starter",
    ],
  },
  business: {
    id: "business",
    name: "Business",
    blurb: "For agencies building sites for clients.",
    priceMonthly: 99,
    priceYearly: 990,
    monthlyCredits: 1200,
    dailyCredits: 0,
    maxProjects: 500,
    maxPublished: 100,
    customDomains: 100,
    badge: false,
    tiers: ["fast", "standard", "max"],
    aiImages: true,
    features: [
      "1,200 credits / month",
      "100 published sites + custom domains",
      "Max model included",
      "Everything in Pro",
    ],
  },
};

export const PAID_PLANS: PlanId[] = ["starter", "pro", "business"];

export type CreditPack = { id: string; credits: number; price: number };

/** One-time top-ups. Purchased credits never expire. */
export const CREDIT_PACKS: CreditPack[] = [
  { id: "credits_250", credits: 250, price: 15 },
  { id: "credits_1000", credits: 1000, price: 50 },
];

/** Granted when someone you referred starts a paid plan. */
export const REFERRAL_REWARD = { referrer: 200, referee: 100 };

export const SIGNUP_BONUS = 20;

export function planLookupKey(plan: PlanId, interval: Interval) {
  return `${plan}_${interval}`;
}

export function parseLookupKey(key: string | null | undefined): { plan: PlanId; interval: Interval } | null {
  if (!key) return null;
  const [plan, interval] = key.split("_") as [PlanId, Interval];
  if (!PLANS[plan] || (interval !== "month" && interval !== "year")) return null;
  return { plan, interval };
}

export function getPlan(id: string | null | undefined): Plan {
  return PLANS[(id as PlanId) ?? "free"] ?? PLANS.free;
}

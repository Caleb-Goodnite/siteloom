import type { Metadata } from "next";
import { Faq } from "@/components/marketing/faq";
import { PricingTable } from "@/components/marketing/pricing-table";
import { IMAGE_CREDITS, TIERS } from "@/config/models";
import { CREDIT_PACKS, PLANS, REFERRAL_REWARD, SIGNUP_BONUS } from "@/config/plans";
import { site } from "@/config/site";

export const metadata: Metadata = {
  title: "Pricing — simple plans, honest credits",
  description: `Start free. Paid plans from $${PLANS.starter.priceMonthly}/month with custom domains. Every AI message shows its price before you send it, and you're never charged when nothing changes.`,
  alternates: { canonical: "/pricing" },
};

const FAQS = [
  {
    q: "How do credits work?",
    a: `Each AI message costs a fixed number of credits depending on the model you choose: ${Object.values(TIERS)
      .map((t) => `${t.label} (${t.credits})`)
      .join(", ")}. The cost is shown on the send button before you send. AI photos cost ${IMAGE_CREDITS} credit${IMAGE_CREDITS > 1 ? "s" : ""} each.`,
  },
  { q: "When am I not charged?", a: "If a generation fails, you press Stop, or the AI doesn't change your site, the credits are refunded automatically. Editing text directly in the preview, editing code, restoring a previous version and publishing are always free." },
  { q: "Do unused credits roll over?", a: "Your plan's monthly credits refresh each billing month and don't roll over. Credits you buy as top-ups never expire and are used after your monthly credits." },
  { q: "What happens on the free plan?", a: `You get ${PLANS.free.dailyCredits} credits every day plus a ${SIGNUP_BONUS}-credit welcome bonus, and can publish one site on a ${site.name} subdomain with a small badge.` },
  { q: "Can I buy more credits?", a: `Yes: ${CREDIT_PACKS.map((p) => `${p.credits.toLocaleString()} credits for $${p.price}`).join(" or ")}. Top-up credits never expire.` },
  { q: "Can I cancel anytime?", a: "Yes. Cancel from the billing portal and keep your plan until the end of the period. Published sites stay online (with the small free-plan badge), and you can always download your code." },
  { q: "Do you have a referral program?", a: `Share your referral link. When someone you referred starts a paid plan, you get ${REFERRAL_REWARD.referrer} credits and they get ${REFERRAL_REWARD.referee}.` },
];

export default function PricingPage() {
  return (
    <div className="px-4 pt-16 sm:px-6">
      <div className="mx-auto max-w-2xl text-center">
        <h1 className="font-display text-6xl leading-[0.98] text-ink sm:text-7xl">Simple plans. Honest credits.</h1>
        <p className="mt-5 text-lg text-ink-2">
          Start free. Upgrade when you want your own domain. You&apos;ll always see what a message costs before you send it, and you&apos;re
          never charged for nothing.
        </p>
      </div>
      <div className="mx-auto mt-12 max-w-6xl">
        <PricingTable />
      </div>
      <div className="mt-24">
        <Faq items={FAQS} title="Pricing questions" />
      </div>
    </div>
  );
}

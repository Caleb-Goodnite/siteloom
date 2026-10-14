"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Check } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { IMAGE_CREDITS, TIERS } from "@/config/models";
import { PLANS, type Interval, type PlanId } from "@/config/plans";
import { cn } from "@/lib/utils";
import { useSignedIn } from "./use-session";

export function PricingTable({ currentPlan }: { currentPlan?: PlanId }) {
  const router = useRouter();
  const signedIn = useSignedIn();
  const [interval, setInterval] = useState<Interval>("year");
  const [busy, setBusy] = useState<PlanId | null>(null);

  async function choose(plan: PlanId) {
    if (plan === "free") {
      router.push(signedIn ? "/dashboard" : "/signup");
      return;
    }
    if (!signedIn) {
      router.push(`/signup?next=${encodeURIComponent(`/dashboard/billing?plan=${plan}&interval=${interval}`)}`);
      return;
    }
    setBusy(plan);
    try {
      const res = await fetch("/api/billing/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ plan, interval }),
      });
      const data = await res.json();
      if (!res.ok || !data.url) throw new Error(data.error ?? "Checkout is unavailable right now.");
      window.location.assign(data.url);
    } catch (err) {
      toast.error((err as Error).message);
      setBusy(null);
    }
  }

  return (
    <div>
      <div className="mx-auto mb-10 flex w-fit items-center gap-1 rounded-full border border-line bg-card p-1 text-sm">
        {(["month", "year"] as const).map((i) => (
          <button
            key={i}
            onClick={() => setInterval(i)}
            className={cn("rounded-full px-4 py-1.5 font-medium transition-colors", interval === i ? "bg-ink text-white" : "text-ink-2 hover:text-ink")}
            aria-pressed={interval === i}
          >
            {i === "month" ? "Monthly" : "Yearly · 2 months free"}
          </button>
        ))}
      </div>
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {Object.values(PLANS).map((plan) => {
          const price = interval === "year" ? plan.priceYearly / 12 : plan.priceMonthly;
          const isCurrent = currentPlan === plan.id;
          return (
            <div
              key={plan.id}
              className={cn(
                "relative flex flex-col rounded-2xl border bg-card p-6",
                plan.highlight ? "border-ink shadow-[0_20px_50px_-24px_rgba(28,25,23,0.45)]" : "border-line",
              )}
            >
              {plan.highlight && (
                <span className="absolute -top-3 left-6 rounded-full bg-accent px-2.5 py-1 text-xs font-semibold text-white">Most popular</span>
              )}
              <h3 className="text-lg font-semibold text-ink">{plan.name}</h3>
              <p className="mt-1 min-h-10 text-sm text-muted">{plan.blurb}</p>
              <p className="mt-5 flex items-baseline gap-1">
                <span className="font-display text-5xl text-ink">${Number.isInteger(price) ? price : price.toFixed(2)}</span>
                <span className="text-sm text-muted">/ month</span>
              </p>
              <p className="mt-1 h-4 text-xs text-muted">{plan.priceMonthly > 0 && interval === "year" ? `$${plan.priceYearly} billed yearly` : ""}</p>
              <Button
                className="mt-5 w-full"
                variant={plan.highlight ? "accent" : "outline"}
                loading={busy === plan.id}
                disabled={isCurrent}
                onClick={() => choose(plan.id)}
              >
                {isCurrent ? "Current plan" : plan.id === "free" ? "Start free" : `Get ${plan.name}`}
              </Button>
              <ul className="mt-6 space-y-2.5 text-sm text-ink-2">
                {plan.features.map((f) => (
                  <li key={f} className="flex gap-2">
                    <Check className="mt-0.5 size-4 shrink-0 text-ok" />
                    {f}
                  </li>
                ))}
              </ul>
            </div>
          );
        })}
      </div>
      <div className="mx-auto mt-10 max-w-3xl rounded-2xl border border-line bg-card/60 p-5 text-sm text-ink-2">
        <p className="font-medium text-ink">What does a message cost?</p>
        <p className="mt-1">
          Every message shows its price before you send it, and you only pay when your site changes. Failed generations are refunded
          automatically, and clicking text to edit it is always free.
        </p>
        <div className="mt-3 flex flex-wrap gap-2">
          {Object.values(TIERS).map((t) => (
            <span key={t.id} className="rounded-full bg-paper-2 px-3 py-1 text-xs">
              <b className="text-ink">{t.label}</b> · {t.credits} credit{t.credits > 1 ? "s" : ""} — {t.blurb.toLowerCase()}
            </span>
          ))}
          <span className="rounded-full bg-paper-2 px-3 py-1 text-xs">
            <b className="text-ink">AI photo</b> · {IMAGE_CREDITS} credit{IMAGE_CREDITS > 1 ? "s" : ""} each
          </span>
        </div>
      </div>
    </div>
  );
}

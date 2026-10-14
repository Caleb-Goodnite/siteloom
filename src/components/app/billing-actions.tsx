"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { Check, Copy } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { PLANS, type PlanId } from "@/config/plans";
import { track } from "@/lib/track";

async function go(url: string, body?: object) {
  const res = await fetch(url, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body ?? {}) });
  const data = await res.json();
  if (!res.ok || !data.url) throw new Error(data.error ?? "Billing is unavailable right now.");
  window.location.assign(data.url);
}

export function BillingActions({ hasCustomer }: { hasCustomer: boolean }) {
  const [busy, setBusy] = useState(false);
  if (!hasCustomer) return <p className="text-xs text-muted">Upgrade below to unlock custom domains and more credits.</p>;
  return (
    <Button
      variant="outline"
      loading={busy}
      onClick={async () => {
        setBusy(true);
        try {
          await go("/api/billing/portal");
        } catch (e) {
          toast.error((e as Error).message);
          setBusy(false);
        }
      }}
    >
      Manage billing & invoices
    </Button>
  );
}

export function BuyCredits({ pack, label, price }: { pack: string; label: string; price: string }) {
  const [busy, setBusy] = useState(false);
  return (
    <Button
      variant="outline"
      className="w-full justify-between"
      loading={busy}
      onClick={async () => {
        setBusy(true);
        try {
          await go("/api/billing/checkout", { pack });
        } catch (e) {
          toast.error((e as Error).message);
          setBusy(false);
        }
      }}
    >
      <span>{label}</span>
      <span className="text-muted">{price}</span>
    </Button>
  );
}

export function CopyField({ value }: { value: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <div className="flex items-center gap-2 rounded-xl border border-line-2 bg-paper/60 p-1.5 pl-3">
      <span className="min-w-0 flex-1 truncate font-mono text-xs text-ink-2">{value}</span>
      <Button
        size="sm"
        variant="outline"
        onClick={async () => {
          await navigator.clipboard.writeText(value);
          setCopied(true);
          setTimeout(() => setCopied(false), 1500);
        }}
      >
        {copied ? <Check className="size-3.5" /> : <Copy className="size-3.5" />}
        {copied ? "Copied" : "Copy"}
      </Button>
    </div>
  );
}

/** Handles ?checkout=… return states and ?plan=…&interval=… deep links from the pricing page. */
export function CheckoutEffects() {
  const params = useSearchParams();
  const router = useRouter();
  const ran = useRef(false);
  useEffect(() => {
    if (ran.current) return;
    ran.current = true;
    const checkout = params.get("checkout");
    if (checkout === "success") {
      toast.success("Welcome aboard! Your plan is active. It can take a few seconds to update.");
      const bought = PLANS[params.get("plan") as PlanId];
      if (bought) {
        const yearly = params.get("interval") === "year";
        track("purchase", { plan: bought.id, interval: yearly ? "year" : "month", value: yearly ? bought.priceYearly : bought.priceMonthly, currency: "USD" });
      }
    }
    if (checkout === "credits") toast.success("Credits purchased. They'll appear in a few seconds.");
    if (checkout) {
      setTimeout(() => router.refresh(), 2500);
      router.replace("/dashboard/billing");
    }
    const plan = checkout ? null : params.get("plan");
    const interval = params.get("interval") ?? "month";
    if (plan) {
      router.replace("/dashboard/billing");
      go("/api/billing/checkout", { plan, interval }).catch((e) => toast.error((e as Error).message));
    }
  }, [params, router]);
  return null;
}

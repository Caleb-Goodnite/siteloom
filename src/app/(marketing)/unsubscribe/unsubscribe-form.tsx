"use client";

import { useSearchParams } from "next/navigation";
import { useState } from "react";
import { Button } from "@/components/ui/button";

export function UnsubscribeForm() {
  const params = useSearchParams();
  const [state, setState] = useState<"idle" | "busy" | "done" | "error">("idle");

  async function confirm() {
    setState("busy");
    const res = await fetch(`/api/unsubscribe?u=${encodeURIComponent(params.get("u") ?? "")}&t=${encodeURIComponent(params.get("t") ?? "")}`, { method: "POST" });
    setState(res.ok ? "done" : "error");
  }

  if (state === "done") return <p className="mt-6 text-ink-2">You&apos;re unsubscribed from tips and offers. You&apos;ll still get emails you need, like form submissions and receipts.</p>;
  if (state === "error") return <p className="mt-6 text-danger">That link is invalid or expired. You can also turn these emails off in Settings.</p>;
  return (
    <div className="mt-6">
      <p className="text-ink-2">Stop receiving tips, onboarding and offer emails? Form submissions and billing emails will still be sent.</p>
      <Button className="mt-6" loading={state === "busy"} onClick={confirm}>
        Unsubscribe
      </Button>
    </div>
  );
}

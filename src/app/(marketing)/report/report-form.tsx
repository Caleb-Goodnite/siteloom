"use client";

import { useSearchParams } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input, Label, Textarea } from "@/components/ui/field";

const REASONS = [
  ["phishing", "Phishing / asks for passwords"],
  ["impersonation", "Impersonates a company or person"],
  ["scam", "Scam or fraud"],
  ["malware", "Malware or suspicious downloads"],
  ["illegal", "Illegal content"],
  ["spam", "Spam"],
  ["other", "Something else"],
] as const;

export function ReportForm() {
  const params = useSearchParams();
  const [url, setUrl] = useState(params.get("url") ?? "");
  const [reason, setReason] = useState<string>("phishing");
  const [details, setDetails] = useState("");
  const [email, setEmail] = useState("");
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    try {
      const res = await fetch("/api/report", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url, reason, details, email }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Could not send report");
      setDone(true);
    } catch (err) {
      toast.error((err as Error).message);
    } finally {
      setBusy(false);
    }
  }

  if (done) {
    return (
      <div className="mt-8 rounded-2xl border border-line bg-card p-6">
        <p className="font-semibold text-ink">Thank you. Your report was received.</p>
        <p className="mt-1 text-sm text-ink-2">We review reports quickly. If you left an email, we may follow up.</p>
      </div>
    );
  }

  return (
    <form onSubmit={submit} className="mt-8 space-y-5 rounded-2xl border border-line bg-card p-6">
      <div>
        <Label htmlFor="url">Site address</Label>
        <Input id="url" type="url" required placeholder="https://example.siteloom.site" value={url} onChange={(e) => setUrl(e.target.value)} />
      </div>
      <fieldset>
        <legend className="mb-2 text-sm font-medium text-ink">What&apos;s wrong?</legend>
        <div className="grid gap-2 sm:grid-cols-2">
          {REASONS.map(([value, label]) => (
            <label key={value} className="flex cursor-pointer items-center gap-2 rounded-xl border border-line px-3 py-2 text-sm has-[:checked]:border-ink has-[:checked]:bg-paper-2">
              <input type="radio" name="reason" value={value} checked={reason === value} onChange={() => setReason(value)} className="accent-ink" />
              {label}
            </label>
          ))}
        </div>
      </fieldset>
      <div>
        <Label htmlFor="details">Details (optional)</Label>
        <Textarea id="details" rows={4} value={details} onChange={(e) => setDetails(e.target.value)} placeholder="What did you see? Which brand is being impersonated?" />
      </div>
      <div>
        <Label htmlFor="email">Your email (optional)</Label>
        <Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
      </div>
      <Button type="submit" loading={busy} className="w-full">
        Send report
      </Button>
    </form>
  );
}

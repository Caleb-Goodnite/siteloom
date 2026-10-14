"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { AlertCircle, ArrowRight, CheckCircle2, Globe, Info, Sparkles } from "lucide-react";
import { toast } from "sonner";
import { Spinner } from "@/components/ui/spinner";
import { track } from "@/lib/track";
import { cn } from "@/lib/utils";
import { savePendingStart, useSignedIn } from "./use-session";

type Check = { id: string; category: string; label: string; status: "pass" | "warn" | "fail"; detail: string; why: string };
type Result = { url: string; host: string; score: number; grade: string; checks: Check[]; stats: { responseMs: number; words: number; scripts: number } };

const ICON = { pass: CheckCircle2, warn: Info, fail: AlertCircle };
const TONE = { pass: "text-ok", warn: "text-warn", fail: "text-danger" };

export function WebsiteGrader() {
  const router = useRouter();
  const signedIn = useSignedIn();
  const [url, setUrl] = useState("");
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState<Result | null>(null);
  const [starting, setStarting] = useState(false);

  async function grade(e: React.FormEvent) {
    e.preventDefault();
    if (url.trim().length < 4) return toast("Enter your website's address.");
    setBusy(true);
    setResult(null);
    try {
      const res = await fetch("/api/tools/grade", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ url }) });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Couldn't check that site");
      setResult(data);
      track("grader_used", { score: data.score });
      window.setTimeout(() => document.getElementById("grade-result")?.scrollIntoView({ behavior: "smooth", block: "start" }), 50);
    } catch (err) {
      toast.error((err as Error).message);
    } finally {
      setBusy(false);
    }
  }

  async function redesign() {
    if (!result) return;
    if (!signedIn) {
      savePendingStart({ importUrl: result.url });
      router.push("/signup?next=/dashboard");
      return;
    }
    setStarting(true);
    const res = await fetch("/api/projects", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ importUrl: result.url }) });
    const data = await res.json();
    if (!res.ok) {
      setStarting(false);
      return toast.error(data.error ?? "Couldn't start the redesign");
    }
    track("redesign_started", { from: "grader" });
    router.push(`/project/${data.id}`);
  }

  const color = !result ? "" : result.score >= 85 ? "#15803d" : result.score >= 65 ? "#b45309" : "#b91c1c";
  const circ = 2 * Math.PI * 52;
  const issues = result?.checks.filter((c) => c.status !== "pass").length ?? 0;

  return (
    <div>
      <form onSubmit={grade} className="mx-auto flex max-w-2xl flex-col gap-2 rounded-[22px] border border-line-2 bg-card p-2 shadow-[0_18px_50px_-24px_rgba(28,25,23,0.3)] sm:flex-row">
        <div className="flex flex-1 items-center gap-2 px-3">
          <Globe className="size-4 shrink-0 text-muted" />
          <label htmlFor="grade-url" className="sr-only">
            Website address
          </label>
          <input
            id="grade-url"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            placeholder="yourbusiness.com"
            inputMode="url"
            autoComplete="url"
            className="h-12 w-full bg-transparent text-[16px] text-ink placeholder:text-muted/70 focus:outline-none"
          />
        </div>
        <button type="submit" disabled={busy} className="inline-flex h-12 items-center justify-center gap-2 rounded-full bg-accent px-6 text-sm font-semibold text-white hover:bg-accent-ink disabled:opacity-60">
          {busy ? <Spinner /> : null} {busy ? "Checking…" : "Grade my website"}
        </button>
      </form>
      <p className="mt-3 text-center text-xs text-muted">Free · no sign-up · checks your page the way Google and AI search crawlers see it</p>

      {result && (
        <div id="grade-result" className="mx-auto mt-12 max-w-3xl scroll-mt-24">
          <div className="flex flex-col items-center gap-6 rounded-3xl border border-line bg-card p-6 sm:flex-row sm:p-8">
            <svg viewBox="0 0 120 120" className="size-32 shrink-0" role="img" aria-label={`Score ${result.score} out of 100`}>
              <circle cx="60" cy="60" r="52" fill="none" stroke="var(--paper-2)" strokeWidth="12" />
              <circle cx="60" cy="60" r="52" fill="none" stroke={color} strokeWidth="12" strokeLinecap="round" strokeDasharray={circ} strokeDashoffset={circ * (1 - result.score / 100)} transform="rotate(-90 60 60)" />
              <text x="60" y="58" textAnchor="middle" fontSize="34" fontWeight="700" fill="var(--ink)">
                {result.score}
              </text>
              <text x="60" y="80" textAnchor="middle" fontSize="13" fill="var(--muted)">
                Grade {result.grade}
              </text>
            </svg>
            <div className="text-center sm:text-left">
              <p className="text-sm text-muted">{result.host}</p>
              <h2 className="mt-1 font-display text-4xl leading-tight text-ink">
                {result.score >= 85 ? "Strong foundation." : result.score >= 65 ? "Decent, with easy wins." : "Search engines are missing a lot."}
              </h2>
              <p className="mt-2 text-ink-2">
                {issues === 0 ? "Everything we checked looks good." : `${issues} thing${issues > 1 ? "s" : ""} to fix, ranked by how much they matter.`}
              </p>
            </div>
          </div>

          <ul className="mt-6 divide-y divide-line rounded-3xl border border-line bg-card">
            {result.checks.map((c) => {
              const Icon = ICON[c.status];
              return (
                <li key={c.id} className="flex gap-4 p-5">
                  <Icon className={cn("mt-0.5 size-5 shrink-0", TONE[c.status])} />
                  <div>
                    <p className="font-medium text-ink">
                      {c.label} <span className="ml-1 text-xs font-normal text-muted">{c.category}</span>
                    </p>
                    <p className="mt-0.5 text-sm text-ink-2">{c.detail}</p>
                    {c.status !== "pass" && <p className="mt-1.5 text-sm text-muted">{c.why}</p>}
                  </div>
                </li>
              );
            })}
          </ul>

          <div className="mt-8 rounded-3xl bg-ink p-8 text-center">
            <Sparkles className="mx-auto size-6 text-accent" />
            <h2 className="mt-3 font-display text-4xl leading-tight text-white">Fix all of this automatically</h2>
            <p className="mx-auto mt-2 max-w-lg text-white/70">
              We&apos;ll keep your real content and rebuild {result.host} as a fast, modern site with every check above handled for you. Free to try.
            </p>
            <button onClick={redesign} disabled={starting} className="mt-6 inline-flex h-12 items-center gap-2 rounded-full bg-accent px-6 text-sm font-semibold text-white hover:bg-accent-ink disabled:opacity-60">
              {starting ? <Spinner /> : null} Redesign {result.host} free <ArrowRight className="size-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

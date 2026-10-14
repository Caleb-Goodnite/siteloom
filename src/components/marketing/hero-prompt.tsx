"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { ArrowUp, Globe } from "lucide-react";
import { toast } from "sonner";
import { Spinner } from "@/components/ui/spinner";
import { industries } from "@/content/industries";
import { track } from "@/lib/track";
import { cn } from "@/lib/utils";
import { savePendingStart, useSignedIn, type PendingStart } from "./use-session";

const EXAMPLES = [
  "A website for Casa Lumbre, a Mexican restaurant in East Austin with a menu, our story, and reservation requests…",
  "A site for Bright Smile Dental in Columbus, OH — services, insurance we accept, and an appointment form…",
  "A landing page for Tracepoint, a SaaS that alerts teams on Slack when cron jobs fail…",
  "A portfolio for a wedding photographer in Southern California with packages and an inquiry form…",
];

const CHIPS = ["restaurants", "plumbers", "photographers", "saas-startups"].map((slug) => {
  const i = industries.find((x) => x.slug === slug)!;
  return { label: i.name, prompt: i.prompt };
});

export function HeroPrompt({
  initial = "",
  compact = false,
  startMode = "describe",
}: {
  initial?: string;
  compact?: boolean;
  /** "redesign" starts with the "paste your current site" input (used on the redesign landing page). */
  startMode?: "describe" | "redesign";
}) {
  const router = useRouter();
  const signedIn = useSignedIn();
  const [value, setValue] = useState(initial);
  const [placeholder, setPlaceholder] = useState(0);
  const [busy, setBusy] = useState(false);
  const [mode, setMode] = useState<"describe" | "redesign">(startMode);
  const [url, setUrl] = useState("");

  useEffect(() => {
    if (value) return;
    const t = setInterval(() => setPlaceholder((p) => (p + 1) % EXAMPLES.length), 4000);
    return () => clearInterval(t);
  }, [value]);

  async function submit() {
    let start: PendingStart;
    if (mode === "redesign") {
      if (url.trim().length < 4) {
        toast("Paste your website's address first.");
        return;
      }
      start = { importUrl: url.trim() };
    } else {
      if (value.trim().length < 8) {
        toast("Tell us a little about your business first.");
        return;
      }
      start = { prompt: value.trim() };
    }
    if (!signedIn) {
      savePendingStart(start);
      router.push("/signup?next=/dashboard");
      return;
    }
    setBusy(true);
    try {
      const res = await fetch("/api/projects", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(start),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Could not create the project");
      track(start.importUrl ? "redesign_started" : "site_created");
      router.push(`/project/${data.id}`);
    } catch (err) {
      toast.error((err as Error).message);
      setBusy(false);
    }
  }

  return (
    <div className="w-full">
      <form
        onSubmit={(e) => {
          e.preventDefault();
          void submit();
        }}
        className="group relative rounded-[22px] border border-line-2 bg-card p-2 shadow-[0_1px_0_rgba(0,0,0,0.04),0_18px_50px_-20px_rgba(28,25,23,0.25)] transition-shadow focus-within:border-ink/40 focus-within:shadow-[0_1px_0_rgba(0,0,0,0.04),0_24px_60px_-20px_rgba(28,25,23,0.35)]"
      >
        {mode === "describe" ? (
          <>
            <label htmlFor="hero-prompt" className="sr-only">
              Describe the website you want
            </label>
            <textarea
              id="hero-prompt"
              value={value}
              onChange={(e) => setValue(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  void submit();
                }
              }}
              rows={compact ? 2 : 3}
              placeholder={EXAMPLES[placeholder]}
              className="block w-full resize-none bg-transparent px-3 py-2.5 text-[16px] leading-relaxed text-ink placeholder:text-muted/80 focus:outline-none"
            />
          </>
        ) : (
          <div className="flex items-center gap-2 px-3 py-2.5">
            <Globe className="size-4 shrink-0 text-muted" />
            <label htmlFor="hero-url" className="sr-only">
              Your current website address
            </label>
            <input
              id="hero-url"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="Paste your current website, e.g. yourbusiness.com"
              inputMode="url"
              className="w-full bg-transparent text-[16px] text-ink placeholder:text-muted/80 focus:outline-none"
            />
          </div>
        )}
        <div className="flex items-center justify-between gap-2 px-2 pb-1">
          <button
            type="button"
            onClick={() => setMode((m) => (m === "describe" ? "redesign" : "describe"))}
            className="rounded-full px-2 py-1 text-xs font-medium text-ink-2 underline-offset-4 hover:text-ink hover:underline"
          >
            {mode === "describe" ? "Have a site? Redesign it instead" : "Describe a new site instead"}
          </button>
          <button
            type="submit"
            disabled={busy}
            className="ml-auto inline-flex h-10 items-center gap-2 rounded-full bg-accent px-4 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-accent-ink disabled:opacity-60"
          >
            {busy ? <Spinner /> : null}
            {mode === "describe" ? "Build my site" : "Redesign it"}
            <ArrowUp className="size-4" />
          </button>
        </div>
      </form>
      {!compact && (
        <div className="mt-4 flex flex-wrap justify-center gap-2">
          {CHIPS.map((c) => (
            <button
              key={c.label}
              onClick={() => setValue(c.prompt)}
              className={cn("rounded-full border border-line bg-card/70 px-3 py-1.5 text-xs text-ink-2 transition-colors hover:border-line-2 hover:text-ink")}
            >
              {c.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

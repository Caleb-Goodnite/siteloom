"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { ArrowUp, Globe, Sparkles, Wand2 } from "lucide-react";
import { toast } from "sonner";
import { takePendingStart, type PendingStart } from "@/components/marketing/use-session";
import { Spinner } from "@/components/ui/spinner";
import { industries } from "@/content/industries";
import { track } from "@/lib/track";
import { cn } from "@/lib/utils";

type Mode = "describe" | "redesign";

export function NewSite({ atLimit, maxProjects }: { atLimit: boolean; maxProjects: number }) {
  const router = useRouter();
  const [mode, setMode] = useState<Mode>("describe");
  const [value, setValue] = useState("");
  const [url, setUrl] = useState("");
  const [busy, setBusy] = useState(false);
  const [enhancing, setEnhancing] = useState(false);
  const autoStarted = useRef(false);

  async function create(start: PendingStart) {
    setBusy(true);
    try {
      const res = await fetch("/api/projects", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(start),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Could not create the site");
      track(start.importUrl ? "redesign_started" : "site_created");
      router.push(`/project/${data.id}`);
    } catch (err) {
      toast.error((err as Error).message);
      setBusy(false);
    }
  }

  // Continue where the visitor left off: what they typed on the home page before signing up.
  useEffect(() => {
    if (autoStarted.current) return;
    autoStarted.current = true;
    const pending = takePendingStart();
    if (pending && !atLimit) {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- one-time read of what was saved before signup
      setMode(pending.importUrl ? "redesign" : "describe");
      setUrl(pending.importUrl ?? "");
      setValue(pending.prompt ?? "");
      void create(pending);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function enhance() {
    if (value.trim().length < 3) {
      toast("Write a few words about your business first.");
      return;
    }
    setEnhancing(true);
    try {
      const res = await fetch("/api/enhance", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt: value }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Couldn't enhance right now");
      setValue(data.prompt);
    } catch (err) {
      toast.error((err as Error).message);
    } finally {
      setEnhancing(false);
    }
  }

  if (atLimit) {
    return (
      <div className="rounded-2xl border border-line bg-card p-6 text-center text-sm text-ink-2">
        You&apos;ve reached your plan&apos;s {maxProjects} sites. Delete one below or{" "}
        <Link href="/dashboard/billing" className="font-medium text-ink underline underline-offset-4">
          upgrade
        </Link>{" "}
        for more.
      </div>
    );
  }

  return (
    <div>
      <div className="mb-3 flex justify-center">
        <div className="inline-flex rounded-full bg-paper-2 p-0.5 text-xs font-medium" role="tablist" aria-label="How to start">
          {(
            [
              ["describe", Sparkles, "Describe a new site"],
              ["redesign", Globe, "Redesign my current site"],
            ] as const
          ).map(([m, Icon, label]) => (
            <button
              key={m}
              role="tab"
              aria-selected={mode === m}
              onClick={() => setMode(m)}
              className={cn("flex items-center gap-1.5 rounded-full px-3.5 py-1.5", mode === m ? "bg-card text-ink shadow-sm" : "text-ink-2 hover:text-ink")}
            >
              <Icon className="size-3.5" /> {label}
            </button>
          ))}
        </div>
      </div>

      {mode === "describe" ? (
        <form
          onSubmit={(e) => {
            e.preventDefault();
            if (value.trim().length >= 8) void create({ prompt: value.trim() });
            else toast("Tell us a little more about the site.");
          }}
          className="rounded-[22px] border border-line-2 bg-card p-2 shadow-[0_18px_50px_-24px_rgba(28,25,23,0.3)] focus-within:border-ink/40"
        >
          <label htmlFor="new-site" className="sr-only">
            Describe your site
          </label>
          <textarea
            id="new-site"
            value={value}
            onChange={(e) => setValue(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                e.currentTarget.form?.requestSubmit();
              }
            }}
            rows={4}
            placeholder="A website for Bright Smile Dental, a family practice in Columbus, OH: services, insurance we accept, meet the team and an appointment request form. Calm, soft teal."
            className="block w-full resize-none bg-transparent px-3 py-2.5 text-[15px] leading-relaxed text-ink placeholder:text-muted/70 focus:outline-none"
          />
          <div className="flex items-center justify-between gap-2 px-1.5 pb-1">
            <button
              type="button"
              onClick={enhance}
              disabled={enhancing || busy}
              className="inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium text-ink-2 hover:bg-paper-2 hover:text-ink disabled:opacity-50"
              title="Turn a short idea into a detailed brief (free)"
            >
              {enhancing ? <Spinner className="size-3.5" /> : <Wand2 className="size-3.5" />}
              Enhance prompt · free
            </button>
            <button
              type="submit"
              disabled={busy}
              className="inline-flex h-10 items-center gap-2 rounded-full bg-accent px-4 text-sm font-semibold text-white hover:bg-accent-ink disabled:opacity-60"
            >
              {busy ? <Spinner /> : null} Create site <ArrowUp className="size-4" />
            </button>
          </div>
        </form>
      ) : (
        <form
          onSubmit={(e) => {
            e.preventDefault();
            if (url.trim().length >= 4) void create({ importUrl: url.trim(), prompt: value.trim() || undefined });
            else toast("Paste your website's address first.");
          }}
          className="rounded-[22px] border border-line-2 bg-card p-2 shadow-[0_18px_50px_-24px_rgba(28,25,23,0.3)] focus-within:border-ink/40"
        >
          <div className="flex items-center gap-2 px-2 pt-1">
            <Globe className="size-4 shrink-0 text-muted" />
            <label htmlFor="import-url" className="sr-only">
              Your current website
            </label>
            <input
              id="import-url"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="yourbusiness.com"
              inputMode="url"
              autoComplete="url"
              className="h-11 w-full bg-transparent text-[15px] text-ink placeholder:text-muted/70 focus:outline-none"
            />
          </div>
          <textarea
            value={value}
            onChange={(e) => setValue(e.target.value)}
            rows={2}
            placeholder="Optional: what should change? e.g. “more modern, add online booking, darker colors”"
            className="block w-full resize-none border-t border-line bg-transparent px-3 py-2.5 text-sm leading-relaxed text-ink placeholder:text-muted/70 focus:outline-none"
          />
          <div className="flex items-center justify-between gap-2 px-1.5 pb-1">
            <p className="px-2 text-xs text-muted">We keep your real content and details, then rebuild it to look modern and rank better.</p>
            <button
              type="submit"
              disabled={busy}
              className="inline-flex h-10 shrink-0 items-center gap-2 rounded-full bg-accent px-4 text-sm font-semibold text-white hover:bg-accent-ink disabled:opacity-60"
            >
              {busy ? <Spinner /> : null} {busy ? "Reading your site…" : "Redesign it"} <ArrowUp className="size-4" />
            </button>
          </div>
        </form>
      )}

      {mode === "describe" && (
        <div className="mt-4 flex flex-wrap justify-center gap-2">
          {industries.slice(0, 6).map((i) => (
            <button
              key={i.slug}
              onClick={() => setValue(i.prompt)}
              className="rounded-full border border-line bg-card/70 px-3 py-1.5 text-xs text-ink-2 hover:border-line-2 hover:text-ink"
            >
              {i.name}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

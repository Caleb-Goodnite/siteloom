"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { ArrowUp } from "lucide-react";
import { toast } from "sonner";
import { Spinner } from "@/components/ui/spinner";
import { industries } from "@/content/industries";
import { cn } from "@/lib/utils";
import { savePendingPrompt, useSignedIn } from "./use-session";

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

export function HeroPrompt({ initial = "", compact = false }: { initial?: string; compact?: boolean }) {
  const router = useRouter();
  const signedIn = useSignedIn();
  const [value, setValue] = useState(initial);
  const [placeholder, setPlaceholder] = useState(0);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (value) return;
    const t = setInterval(() => setPlaceholder((p) => (p + 1) % EXAMPLES.length), 4000);
    return () => clearInterval(t);
  }, [value]);

  async function submit() {
    const prompt = value.trim();
    if (prompt.length < 8) {
      toast("Tell us a little about your business first.");
      return;
    }
    if (!signedIn) {
      savePendingPrompt(prompt);
      router.push("/signup?next=/dashboard");
      return;
    }
    setBusy(true);
    try {
      const res = await fetch("/api/projects", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Could not create the project");
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
        <div className="flex items-center justify-between gap-2 px-2 pb-1">
          <p className="hidden text-xs text-muted sm:block">Free to start · No credit card</p>
          <button
            type="submit"
            disabled={busy}
            className="ml-auto inline-flex h-10 items-center gap-2 rounded-full bg-accent px-4 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-accent-ink disabled:opacity-60"
          >
            {busy ? <Spinner /> : null}
            Build my site
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

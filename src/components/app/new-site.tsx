"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { ArrowUp, Wand2 } from "lucide-react";
import { toast } from "sonner";
import { takePendingPrompt } from "@/components/marketing/use-session";
import { Spinner } from "@/components/ui/spinner";
import { industries } from "@/content/industries";

export function NewSite({ atLimit, maxProjects }: { atLimit: boolean; maxProjects: number }) {
  const router = useRouter();
  const [value, setValue] = useState("");
  const [busy, setBusy] = useState(false);
  const [enhancing, setEnhancing] = useState(false);
  const autoStarted = useRef(false);

  async function create(prompt: string) {
    setBusy(true);
    try {
      const res = await fetch("/api/projects", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Could not create the site");
      router.push(`/project/${data.id}`);
    } catch (err) {
      toast.error((err as Error).message);
      setBusy(false);
    }
  }

  // Continue where the visitor left off: a prompt typed on the home page before signing up.
  useEffect(() => {
    if (autoStarted.current) return;
    autoStarted.current = true;
    const pending = takePendingPrompt();
    if (pending && !atLimit) {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- one-time read of the prompt saved before signup
      setValue(pending);
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
      <form
        onSubmit={(e) => {
          e.preventDefault();
          if (value.trim().length >= 8) void create(value.trim());
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
    </div>
  );
}

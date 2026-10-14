import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { site } from "@/config/site";
import { competitors } from "@/content/compare";

export const metadata: Metadata = {
  title: `${site.name} vs. other website builders`,
  description: `Honest comparisons of ${site.name} with Lovable, Bolt, v0, Wix, Framer and Durable, including when each one is the better choice.`,
  alternates: { canonical: "/compare" },
};

export default function CompareIndex() {
  return (
    <div className="mx-auto max-w-5xl px-4 pt-16 sm:px-6">
      <h1 className="font-display text-6xl leading-[0.98] text-ink sm:text-7xl">Honest comparisons</h1>
      <p className="mt-5 max-w-2xl text-lg text-ink-2">
        Every tool here is good at something. These pages explain what each is best at, and when {site.name} is the better fit for a
        business website.
      </p>
      <div className="mt-12 grid gap-4 sm:grid-cols-2">
        {competitors.map((c) => (
          <Link key={c.slug} href={`/compare/${c.slug}`} className="group rounded-2xl border border-line bg-card p-6 transition-colors hover:border-ink">
            <p className="text-xs font-medium uppercase tracking-wider text-muted">{c.category}</p>
            <h2 className="mt-2 text-xl font-semibold text-ink">
              {site.name} vs {c.name}
            </h2>
            <p className="mt-2 line-clamp-3 text-sm leading-relaxed text-ink-2">{c.summary}</p>
            <span className="mt-4 inline-flex items-center gap-1 text-sm font-medium text-accent-ink">
              Read comparison <ArrowRight className="size-4 transition-transform group-hover:translate-x-0.5" />
            </span>
          </Link>
        ))}
      </div>
    </div>
  );
}

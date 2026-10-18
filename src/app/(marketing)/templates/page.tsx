import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { industries } from "@/content/industries";

export const metadata: Metadata = {
  title: "Website templates for every kind of business",
  description:
    "Start from a proven brief for restaurants, dentists, plumbers, law firms, photographers, SaaS and more. Curblit tailors the design, copy and SEO to your business.",
  alternates: { canonical: "/templates" },
};

export default function TemplatesPage() {
  return (
    <div className="mx-auto max-w-6xl px-4 pt-16 sm:px-6">
      <div className="max-w-2xl">
        <h1 className="font-display text-6xl leading-[0.98] text-ink sm:text-7xl">Start from a brief that works</h1>
        <p className="mt-5 text-lg text-ink-2">
          These aren&apos;t rigid templates. Each one is a starting brief, with the pages, sections and SEO that business type needs, that
          Curblit tailors to your name, location, services and style.
        </p>
      </div>
      <div className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {industries.map((i) => (
          <Link key={i.slug} href={`/for/${i.slug}`} className="group flex flex-col rounded-2xl border border-line bg-card p-6 transition-colors hover:border-ink">
            <h2 className="text-lg font-semibold text-ink">{i.name}</h2>
            <p className="mt-2 line-clamp-3 text-sm leading-relaxed text-ink-2">{i.intro}</p>
            <div className="mt-4 flex flex-wrap gap-1.5">
              {i.pages.slice(0, 4).map((p) => (
                <span key={p} className="rounded-full bg-paper-2 px-2 py-0.5 text-xs text-ink-2">
                  {p}
                </span>
              ))}
            </div>
            <span className="mt-auto inline-flex items-center gap-1 pt-5 text-sm font-medium text-accent-ink">
              Use this template <ArrowRight className="size-4 transition-transform group-hover:translate-x-0.5" />
            </span>
          </Link>
        ))}
      </div>
    </div>
  );
}

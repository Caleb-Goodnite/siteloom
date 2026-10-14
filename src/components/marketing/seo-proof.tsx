import Link from "next/link";
import { ArrowRight, Check } from "lucide-react";
import { LIVE_STATS_MIN_SITES, SEO_BENCHMARK } from "@/content/proof";
import { getPublicSeoStats } from "@/lib/public-stats";

const APP_HTML = `<!doctype html>
<html lang="en">
  <head>
    <title>Vite + React</title>
    <script type="module" src="/assets/index-4f8a2c.js"></script>
  </head>
  <body>
    <div id="root"></div>
  </body>
</html>`;

const SITELOOM_HTML = `<title>Family Dentist in Columbus, OH | Bright Smile Dental</title>
<meta name="description" content="Gentle, family-friendly dental care
  in Columbus, OH. Cleanings, whitening, implants…">
<link rel="canonical" href="https://brightsmile.example/">
<script type="application/ld+json">{"@type":"Dentist", …}</script>
…
<h1>Gentle dental care for your whole family in Columbus</h1>
<p>Nervous about the dentist? You are not alone. At Bright
Smile Dental, we take our time, explain every step…</p>`;

/** "Built to rank — here's the proof": measured numbers + what crawlers actually see. */
export async function SeoProof({ moreLink = true }: { moreLink?: boolean }) {
  const live = await getPublicSeoStats();
  const useLive = live && live.sites >= LIVE_STATS_MIN_SITES;
  const stats = [
    {
      value: `${useLive ? live.average : SEO_BENCHMARK.average}/100`,
      label: useLive ? `average SEO audit score across ${live.sites.toLocaleString()} published sites` : `average SEO audit score across ${SEO_BENCHMARK.pages} pages of test sites`,
    },
    { value: `${SEO_BENCHMARK.frameworkJsKb} KB`, label: "of framework JavaScript shipped to visitors" },
    { value: "10", label: "SEO guarantees applied automatically on every publish" },
  ];

  return (
    <div>
      <div className="grid gap-4 sm:grid-cols-3">
        {stats.map((s) => (
          <div key={s.label} className="rounded-2xl border border-line bg-card p-6">
            <p className="font-display text-5xl text-ink">{s.value}</p>
            <p className="mt-1 text-sm text-ink-2">{s.label}</p>
          </div>
        ))}
      </div>
      <p className="mt-3 text-xs text-muted">
        {useLive
          ? `Live average of every site's latest publish, graded with our public auditor.`
          : `How we measured (${new Date(SEO_BENCHMARK.measured).toLocaleDateString("en-US", { month: "short", year: "numeric" })}): ${SEO_BENCHMARK.method}`}{" "}
        <Link href="/tools/website-grader" className="underline underline-offset-2">
          Run the same auditor on any site.
        </Link>
      </p>

      <div className="mt-10 grid gap-4 lg:grid-cols-2">
        <figure className="overflow-hidden rounded-2xl border border-line bg-card">
          <figcaption className="flex items-center justify-between gap-3 border-b border-line px-5 py-3 text-sm">
            <span className="font-medium text-ink">What a crawler gets from a typical JavaScript app</span>
            <span className="shrink-0 whitespace-nowrap rounded-full bg-red-100 px-2 py-0.5 text-xs font-medium text-red-800">0 words</span>
          </figcaption>
          <pre className="overflow-x-auto p-5 font-mono text-[12.5px] leading-relaxed text-ink-2">{APP_HTML}</pre>
          <p className="border-t border-line px-5 py-3 text-xs text-muted">A default client-side-rendered React build: the content only appears after JavaScript runs.</p>
        </figure>
        <figure className="overflow-hidden rounded-2xl border border-ink bg-card">
          <figcaption className="flex items-center justify-between gap-3 border-b border-line px-5 py-3 text-sm">
            <span className="font-medium text-ink">What a crawler gets from a Siteloom site</span>
            <span className="shrink-0 whitespace-nowrap rounded-full bg-green-100 px-2 py-0.5 text-xs font-medium text-green-800">every word</span>
          </figcaption>
          <pre className="overflow-x-auto p-5 font-mono text-[12.5px] leading-relaxed text-ink-2">{SITELOOM_HTML}</pre>
          <p className="border-t border-line px-5 py-3 text-xs text-muted">Excerpt from a site Siteloom generated: real title, description, schema and copy in the HTML.</p>
        </figure>
      </div>

      <div className="mt-8 flex flex-wrap items-center gap-x-6 gap-y-2 text-sm text-ink-2">
        <span className="font-medium text-ink">Readable by</span>
        {["Google", "Bing", "ChatGPT search", "Perplexity", "Facebook & LinkedIn previews"].map((x) => (
          <span key={x} className="inline-flex items-center gap-1.5">
            <Check className="size-4 text-ok" /> {x}
          </span>
        ))}
        {moreLink && (
          <Link href="/seo" className="ml-auto inline-flex items-center gap-1 font-medium text-ink hover:underline">
            Everything we do for SEO <ArrowRight className="size-4" />
          </Link>
        )}
      </div>
    </div>
  );
}

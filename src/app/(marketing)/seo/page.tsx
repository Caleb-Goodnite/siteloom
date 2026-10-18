import type { Metadata } from "next";
import Link from "next/link";
import { Check } from "lucide-react";
import { Faq } from "@/components/marketing/faq";
import { HeroPrompt } from "@/components/marketing/hero-prompt";
import { JsonLd } from "@/components/marketing/json-ld";
import { SeoProof } from "@/components/marketing/seo-proof";
import { WebsiteGrader } from "@/components/marketing/website-grader";
import { ButtonLink } from "@/components/ui/button";
import { site } from "@/config/site";
import { SEO_BENCHMARK, SEO_GUARANTEES } from "@/content/proof";

export const metadata: Metadata = {
  title: "SEO Website Builder: AI Sites Built to Rank on Google",
  description: `An AI website builder where every page ships as crawlable HTML with schema, sitemap and fast load times. Our test sites averaged ${SEO_BENCHMARK.average}/100 on SEO audits.`,
  alternates: { canonical: "/seo" },
};

const COMPARE: [string, string, string][] = [
  ["Content in the HTML crawlers download", "Every page, always", "Often only after JavaScript runs"],
  ["Titles & meta descriptions", "Written per page, length-checked", "Usually one generic title"],
  ["Structured data (schema.org)", "Every page, business type detected", "Rarely"],
  ["sitemap.xml & robots.txt", "Generated on every publish", "Manual or missing"],
  ["llms.txt for AI assistants", "Generated on every publish", "Missing"],
  ["SEO score before you go live", "Every page graded on publish", "Not provided"],
  ["JavaScript framework shipped to visitors", `${SEO_BENCHMARK.frameworkJsKb} KB`, "Typically 100+ KB"],
];

const FAQS = [
  {
    q: "Does a Curblit site guarantee I'll rank #1?",
    a: "No one can honestly promise that. Rankings depend on your content, reviews, links and competition. What we guarantee is the technical foundation: every page is crawlable, fast, mobile-friendly and marked up correctly, so nothing on the technical side holds you back.",
  },
  {
    q: "How did you measure the scores?",
    a: `${SEO_BENCHMARK.method} Scores came from the same auditor anyone can use for free at /tools/website-grader. Once enough customer sites are live, the number on this page switches to the real average of every published site.`,
  },
  {
    q: "Why does it matter that the content is in the HTML?",
    a: "Many AI app builders produce single-page JavaScript apps. The HTML they send is an empty shell, and the words only appear after scripts run in a browser. Google renders JavaScript later, in a second pass, and most AI search crawlers (the ones behind ChatGPT search, Perplexity and others) don't run it at all. Curblit sites send every word in the HTML, so everyone reads them instantly.",
  },
  {
    q: "Can I see my site's score?",
    a: "Yes. Every page is graded when you publish, and the score appears in the publish dialog, your dashboard and the SEO tab. You can re-check the live site at any time, which also measures real server speed.",
  },
  {
    q: "Do I need to know anything about SEO?",
    a: "No. Titles, descriptions, headings, schema, sitemaps and alt text are handled for you. The SEO tab explains anything worth improving in plain English, and you can fix most of it by asking in the chat.",
  },
  {
    q: "Can I use my own domain?",
    a: "Yes, on paid plans. Custom domains get free SSL, and canonical URLs and the sitemap update automatically to use your domain.",
  },
];

export default function SeoPage() {
  return (
    <div className="px-4 pt-14 sm:px-6">
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@type": "WebPage",
          name: "SEO website builder",
          url: `${site.url}/seo`,
          about: { "@type": "SoftwareApplication", name: site.name, applicationCategory: "BusinessApplication", operatingSystem: "Web" },
        }}
      />
      <div className="mx-auto max-w-3xl text-center">
        <p className="text-sm font-semibold text-accent-ink">SEO website builder</p>
        <h1 className="mt-3 font-display text-5xl leading-[1] text-ink sm:text-7xl">Built to rank. And we can prove it.</h1>
        <p className="mx-auto mt-5 max-w-xl text-lg text-ink-2">
          Most AI builders make sites that look great to people and blank to search engines. Every Curblit page ships as fast, crawlable
          HTML with the technical SEO done for you, and graded before it goes live.
        </p>
        <div className="mt-8 flex flex-wrap justify-center gap-3">
          <ButtonLink href="/signup" size="lg">
            Build my site free
          </ButtonLink>
          <ButtonLink href="#grade" variant="outline" size="lg">
            Grade my current site
          </ButtonLink>
        </div>
      </div>

      <section className="mx-auto mt-20 max-w-6xl" aria-labelledby="proof">
        <h2 id="proof" className="font-display text-4xl text-ink sm:text-5xl">
          The numbers
        </h2>
        <div className="mt-8">
          <SeoProof moreLink={false} />
        </div>
      </section>

      <section className="mx-auto mt-28 max-w-6xl" aria-labelledby="included">
        <h2 id="included" className="font-display text-4xl text-ink sm:text-5xl">
          Included on every page, every publish
        </h2>
        <p className="mt-3 max-w-2xl text-ink-2">No plugins, no settings to remember. These are applied automatically on every plan, including Free.</p>
        <ul className="mt-10 grid gap-4 sm:grid-cols-2">
          {SEO_GUARANTEES.map(([title, body]) => (
            <li key={title} className="flex gap-3 rounded-2xl border border-line bg-card p-5">
              <Check className="mt-0.5 size-5 shrink-0 text-ok" />
              <span>
                <span className="block font-semibold text-ink">{title}</span>
                <span className="mt-1 block text-[15px] leading-relaxed text-ink-2">{body}</span>
              </span>
            </li>
          ))}
        </ul>
      </section>

      <section className="mx-auto mt-28 max-w-5xl" aria-labelledby="vs">
        <h2 id="vs" className="font-display text-4xl text-ink sm:text-5xl">
          Curblit vs typical AI app builders
        </h2>
        <p className="mt-3 max-w-2xl text-ink-2">
          A general comparison. Individual products differ, so check our{" "}
          <Link href="/compare" className="underline underline-offset-4">
            detailed comparisons
          </Link>
          .
        </p>
        <div className="mt-8 overflow-x-auto rounded-2xl border border-line bg-card">
          <table className="w-full min-w-[560px] text-sm">
            <thead>
              <tr className="border-b border-line text-left">
                <th className="p-4 font-medium text-muted" scope="col">
                  <span className="sr-only">Feature</span>
                </th>
                <th className="p-4 font-semibold text-ink" scope="col">{site.name}</th>
                <th className="p-4 font-medium text-ink-2" scope="col">Typical AI app builders</th>
              </tr>
            </thead>
            <tbody>
              {COMPARE.map(([label, a, b]) => (
                <tr key={label} className="border-b border-line last:border-0">
                  <th scope="row" className="p-4 text-left font-normal text-ink">{label}</th>
                  <td className="p-4 font-medium text-ink">{a}</td>
                  <td className="p-4 text-muted">{b}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section id="grade" className="mx-auto mt-28 max-w-6xl scroll-mt-24" aria-labelledby="grader">
        <div className="mx-auto max-w-2xl text-center">
          <h2 id="grader" className="font-display text-4xl text-ink sm:text-5xl">
            How does your current site score?
          </h2>
          <p className="mt-3 text-ink-2">The same 15-check auditor we run on every Curblit publish. Free, no sign-up.</p>
        </div>
        <div className="mt-8">
          <WebsiteGrader />
        </div>
      </section>

      <section className="mt-28">
        <Faq items={FAQS} title="SEO questions" />
      </section>

      <section className="mx-auto mt-28 max-w-4xl">
        <div className="rounded-[28px] bg-ink px-6 py-14 text-center sm:px-14">
          <h2 className="font-display text-5xl leading-[1.02] text-white sm:text-6xl">
            Get a site that gets <em className="text-accent">found.</em>
          </h2>
          <p className="mx-auto mt-4 max-w-lg text-white/70">Describe your business, or paste your current website to redesign it. Free to start.</p>
          <div className="mx-auto mt-8 max-w-xl text-left">
            <HeroPrompt compact />
          </div>
        </div>
      </section>
    </div>
  );
}

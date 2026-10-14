import type { Metadata } from "next";
import Link from "next/link";
import { Check } from "lucide-react";
import { Faq } from "@/components/marketing/faq";
import { HeroPrompt } from "@/components/marketing/hero-prompt";
import { PLANS } from "@/config/plans";
import { site } from "@/config/site";

export const metadata: Metadata = {
  title: "AI Website Redesign: Paste Your URL, Get a Modern Site",
  description: `Redesign your old website with AI. ${site.name} keeps your real content, rebuilds it fast, modern and SEO-ready in about two minutes. Free to try.`,
  alternates: { canonical: "/redesign" },
};

const STEPS = [
  ["Paste your current address", "We read your existing pages: services, prices, hours, contact details, photos."],
  ["We rebuild it", "A modern design with your real content, written to rank, with nothing invented."],
  ["Publish when you're happy", "Tweak anything by chatting or clicking the text, then point your domain at it."],
];

const FAQS = [
  { q: "Will I lose my content?", a: "No. We import the text, contact details and photos from your current pages and reuse them. Your old site stays untouched until you point your domain at the new one." },
  { q: "Which website builders can I redesign from?", a: "Any public website: Wix, Squarespace, GoDaddy, WordPress, Weebly, a custom site, even an old static page. If you can open it in a browser, we can read it." },
  { q: "How much does it cost?", a: `The redesign uses credits like any new site, and the free plan includes enough to try it. Publishing to your own domain is included in paid plans from $${PLANS.starter.priceMonthly}/month.` },
  { q: "Can I keep my domain?", a: "Yes. Once you're happy, connect your existing domain on a paid plan. We'll show you exactly which DNS records to change." },
  { q: "Will my Google rankings drop?", a: "Rankings usually improve when a slow or JavaScript-heavy site becomes fast static HTML with proper titles, descriptions and structured data. Keeping the same page names (like /services and /contact) as your old site helps carry existing rankings over; just ask for it." },
];

export default function RedesignPage() {
  return (
    <div className="px-4 sm:px-6">
      <section className="mx-auto max-w-3xl pt-14 text-center">
        <p className="text-sm font-semibold text-accent-ink">AI website redesign</p>
        <h1 className="mt-3 font-display text-5xl leading-[1] text-ink sm:text-7xl">Your website, rebuilt in two minutes.</h1>
        <p className="mx-auto mt-5 max-w-xl text-lg text-ink-2">
          Paste your current site. We keep your real content and turn it into a fast, modern website that Google and AI search can read.
        </p>
        <div className="mx-auto mt-9 max-w-2xl text-left">
          <HeroPrompt startMode="redesign" compact />
        </div>
        <p className="mt-4 text-sm text-muted">
          Not sure what&apos;s wrong with your current site? <Link href="/tools/website-grader" className="underline underline-offset-4">Grade it free</Link>.
        </p>
      </section>

      <section className="mx-auto mt-20 grid max-w-5xl gap-4 md:grid-cols-3">
        {STEPS.map(([title, body], i) => (
          <div key={title} className="rounded-2xl border border-line bg-card p-6">
            <span className="font-display text-4xl text-accent/80">{i + 1}</span>
            <h2 className="mt-2 font-semibold text-ink">{title}</h2>
            <p className="mt-1 text-[15px] leading-relaxed text-ink-2">{body}</p>
          </div>
        ))}
      </section>

      <section className="mx-auto mt-16 max-w-3xl rounded-3xl border border-line bg-card p-8">
        <h2 className="font-display text-3xl text-ink">What your new site gets automatically</h2>
        <ul className="mt-5 grid gap-3 sm:grid-cols-2">
          {[
            "Fast static pages, readable by every crawler",
            "Unique titles and descriptions on every page",
            "Structured data for your business type",
            "Sitemap, robots.txt and social share previews",
            "Mobile-first design with tap-to-call",
            "Working forms delivered to your inbox",
            "Built-in, cookie-free analytics",
            "Your own domain, with SSL",
          ].map((x) => (
            <li key={x} className="flex gap-2 text-[15px] text-ink-2">
              <Check className="mt-0.5 size-4 shrink-0 text-ok" /> {x}
            </li>
          ))}
        </ul>
      </section>

      <section className="mt-20">
        <Faq items={FAQS} title="Redesign questions" />
      </section>
    </div>
  );
}

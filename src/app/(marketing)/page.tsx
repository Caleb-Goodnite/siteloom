import Link from "next/link";
import {
  ArrowRight,
  BadgeCheck,
  BarChart3,
  Download,
  ImageIcon,
  Inbox,
  MousePointerClick,
  ReceiptText,
  Search,
  ShieldCheck,
} from "lucide-react";
import { BuilderDemo } from "@/components/marketing/builder-demo";
import { Faq } from "@/components/marketing/faq";
import { HeroPrompt } from "@/components/marketing/hero-prompt";
import { JsonLd } from "@/components/marketing/json-ld";
import { SeoProof } from "@/components/marketing/seo-proof";
import { ButtonLink } from "@/components/ui/button";
import { TIERS } from "@/config/models";
import { PLANS } from "@/config/plans";
import { site } from "@/config/site";
import { industries } from "@/content/industries";

const FEATURES = [
  {
    icon: Search,
    title: "Built to be found",
    body: "Every page ships as plain HTML that Google and AI assistants read instantly, with titles, descriptions, sitemap, structured data and social cards handled on publish.",
    span: "md:col-span-2",
  },
  {
    icon: ReceiptText,
    title: "Know the price before you hit send",
    body: "Each message shows its exact credit cost. If nothing changes or a generation fails, you're refunded automatically.",
  },
  {
    icon: MousePointerClick,
    title: "Click text to edit it. Free.",
    body: "Fix a typo or a price without prompting. Point at any element to tell the AI exactly what to change.",
  },
  {
    icon: Inbox,
    title: "Forms that just work",
    body: "Contact, booking and quote forms deliver to your inbox and dashboard, with spam protection built in. No backend to wire up.",
  },
  {
    icon: BarChart3,
    title: "Analytics included",
    body: "See visits, top pages and where people come from, without cookie banners or a third-party script.",
  },
  {
    icon: BadgeCheck,
    title: "Honest by default",
    body: "No invented reviews, awards or phone numbers. Missing details become highlighted placeholders, so you never publish something false.",
    span: "md:col-span-2",
  },
  {
    icon: ImageIcon,
    title: "Custom photos, not stock",
    body: "Generate on-brand photography for your site, or upload your own; images are compressed automatically.",
  },
  {
    icon: Download,
    title: "No lock-in",
    body: "Download a production-ready static site anytime and host it anywhere.",
  },
  {
    icon: ShieldCheck,
    title: "Safe, fast hosting",
    body: "Free subdomain or your own domain with SSL. Static sites are fast and hard to break.",
  },
];

const COMPARE = [
  ["Pages search engines can read without running JavaScript", true, "varies", true],
  ["Writes your copy for your business and location", true, true, "varies"],
  ["Price shown before every AI message", true, "rarely", "—"],
  ["Automatic refund when nothing changes or a generation fails", true, "rarely", "—"],
  ["Edit text directly, free", true, "varies", true],
  ["Working forms + inbox without setting up a backend", true, "rarely", true],
  ["Built-in analytics", true, "varies", true],
  ["Download your site's code", true, true, "rarely"],
] as const;

const FAQS = [
  { q: "What can I build with Siteloom?", a: "Websites for businesses, creators and products: multi-page business sites, landing pages, portfolios, restaurant and clinic sites, SaaS marketing sites and more. If you need user logins or a database, you're building an app, and an app builder is a better fit." },
  { q: "How much does it cost?", a: `You can start free with ${PLANS.free.dailyCredits} credits every day plus a welcome bonus, and publish one site. Paid plans start at $${PLANS.starter.priceMonthly}/month and add custom domains, more sites and more credits. Every AI message shows its price before you send it.` },
  {
    q: "What's a credit?",
    a: `A small, fixed unit of AI work. A quick edit on the Fast model costs ${TIERS.fast.credits} credit${TIERS.fast.credits > 1 ? "s" : ""}, a change on the Standard model costs ${TIERS.standard.credits}, and building a complete multi-page site costs ${TIERS.standard.buildCredits}. If the AI fails or makes no changes, credits are refunded automatically. Clicking text to edit it never costs credits.`,
  },
  { q: "Will my site show up on Google?", a: "Siteloom publishes static HTML with unique titles and descriptions, canonical URLs, sitemap.xml, robots.txt, structured data and social cards, and the SEO panel flags anything missing. Rankings also depend on your content and reputation, so we'll point out what to improve." },
  { q: "Can I use my own domain?", a: "Yes, on any paid plan. Point your DNS records at us and we handle SSL automatically." },
  { q: "Do I own my website?", a: "Yes. Download a production-ready copy anytime and host it anywhere. The AI-generated content is yours to use." },
];

export default function HomePage() {
  return (
    <>
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@type": "SoftwareApplication",
          name: site.name,
          applicationCategory: "BusinessApplication",
          operatingSystem: "Web",
          url: site.url,
          description: site.description,
          offers: Object.values(PLANS).map((p) => ({ "@type": "Offer", name: p.name, price: p.priceMonthly, priceCurrency: "USD" })),
        }}
      />
      <JsonLd data={{ "@context": "https://schema.org", "@type": "Organization", name: site.name, url: site.url, logo: `${site.url}/icon.svg` }} />

      {/* Hero */}
      <section className="relative overflow-hidden px-4 pb-16 pt-14 sm:px-6 sm:pt-20">
        <div className="mx-auto max-w-3xl text-center">
          <p className="inline-flex items-center gap-2 rounded-full border border-line bg-card/70 px-3 py-1 text-xs font-medium text-ink-2">
            <span className="size-1.5 rounded-full bg-accent" />
            The AI website builder for businesses
          </p>
          <h1 className="mt-6 font-display text-[56px] leading-[0.95] tracking-[-0.02em] text-ink sm:text-[84px]">
            Describe it.
            <br />
            Get a <em className="text-accent">website.</em>
          </h1>
          <p className="mx-auto mt-6 max-w-xl text-lg leading-relaxed text-ink-2">
            Tell Siteloom about your business and get a complete multi-page website in minutes: designed, written and ready to publish,
            with forms, hosting and search-ready SEO built in.
          </p>
          <div className="mx-auto mt-9 max-w-2xl text-left">
            <HeroPrompt />
          </div>
        </div>
      </section>

      <section className="px-4 sm:px-6" aria-label="Product preview">
        <BuilderDemo />
      </section>

      {/* Features */}
      <section className="mx-auto mt-28 max-w-6xl px-4 sm:px-6" aria-labelledby="why">
        <div className="max-w-2xl">
          <p className="text-sm font-semibold text-accent-ink">Why Siteloom</p>
          <h2 id="why" className="mt-2 font-display text-5xl leading-[1.02] text-ink sm:text-6xl">
            Everything AI app builders get wrong about websites, fixed.
          </h2>
          <p className="mt-4 text-lg text-ink-2">
            App builders are great for apps. A business website has different needs: get found, look credible, capture leads and cost
            what you expect.
          </p>
        </div>
        <div className="mt-12 grid gap-4 md:grid-cols-3">
          {FEATURES.map((f) => (
            <div key={f.title} className={`rounded-2xl border border-line bg-card p-6 ${f.span ?? ""}`}>
              <f.icon className="size-5 text-accent" />
              <h3 className="mt-4 text-lg font-semibold text-ink">{f.title}</h3>
              <p className="mt-2 text-[15px] leading-relaxed text-ink-2">{f.body}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Already have a site */}
      <section className="mx-auto mt-28 max-w-6xl px-4 sm:px-6" aria-labelledby="existing">
        <h2 id="existing" className="font-display text-5xl text-ink sm:text-6xl">
          Already have a website?
        </h2>
        <div className="mt-10 grid gap-4 md:grid-cols-2">
          <Link href="/redesign" className="group rounded-3xl border border-line bg-card p-8 transition-colors hover:border-ink">
            <p className="text-sm font-semibold text-accent-ink">Redesign</p>
            <h3 className="mt-2 font-display text-3xl leading-tight text-ink">Paste your URL. Get a modern site in minutes.</h3>
            <p className="mt-3 text-[15px] leading-relaxed text-ink-2">
              We import your real content, photos, hours and contact details, then rebuild it to look current and rank better. Nothing invented.
            </p>
            <span className="mt-6 inline-flex items-center gap-1 text-sm font-medium text-ink">
              Redesign my site <ArrowRight className="size-4 transition-transform group-hover:translate-x-0.5" />
            </span>
          </Link>
          <Link href="/tools/website-grader" className="group rounded-3xl border border-line bg-card p-8 transition-colors hover:border-ink">
            <p className="text-sm font-semibold text-accent-ink">Free tool</p>
            <h3 className="mt-2 font-display text-3xl leading-tight text-ink">See what Google sees on your current site.</h3>
            <p className="mt-3 text-[15px] leading-relaxed text-ink-2">
              An instant score for titles, speed, mobile, structured data and whether crawlers can read your content at all, with plain-English fixes.
            </p>
            <span className="mt-6 inline-flex items-center gap-1 text-sm font-medium text-ink">
              Grade my website free <ArrowRight className="size-4 transition-transform group-hover:translate-x-0.5" />
            </span>
          </Link>
        </div>
      </section>

      {/* How it works */}
      <section className="mx-auto mt-28 max-w-6xl px-4 sm:px-6" aria-labelledby="how">
        <h2 id="how" className="font-display text-5xl text-ink sm:text-6xl">
          From sentence to live site
        </h2>
        <ol className="mt-10 grid gap-6 md:grid-cols-3">
          {[
            ["Describe it", "Tell us your business, location and what visitors should do. Not sure what to say? Enhance turns one line into a full brief, for free."],
            ["Refine it", "Chat to make changes, click text to edit it directly, or select any element and say what to change. Every version is saved."],
            ["Publish it", "One click puts it live on a free subdomain or your own domain, with SSL, a sitemap, social cards and working forms."],
          ].map(([title, body], i) => (
            <li key={title} className="relative rounded-2xl border border-line bg-card p-6">
              <span className="font-display text-5xl text-accent/80">{i + 1}</span>
              <h3 className="mt-2 text-lg font-semibold text-ink">{title}</h3>
              <p className="mt-2 text-[15px] leading-relaxed text-ink-2">{body}</p>
            </li>
          ))}
        </ol>
      </section>

      {/* SEO proof */}
      <section className="mx-auto mt-28 max-w-6xl px-4 sm:px-6" aria-labelledby="seo-proof">
        <div className="max-w-2xl">
          <p className="text-sm font-semibold text-accent-ink">SEO, measured</p>
          <h2 id="seo-proof" className="mt-2 font-display text-5xl leading-[1.02] text-ink sm:text-6xl">
            Built to rank. Here&apos;s the proof.
          </h2>
          <p className="mt-4 text-lg text-ink-2">
            Search engines and AI assistants read your HTML, not your design. We publish every word in it, then grade every page before it
            goes live.
          </p>
        </div>
        <div className="mt-10">
          <SeoProof />
        </div>
      </section>

      {/* Comparison */}
      <section className="mx-auto mt-28 max-w-5xl px-4 sm:px-6" aria-labelledby="compare">
        <h2 id="compare" className="text-center font-display text-5xl text-ink sm:text-6xl">
          How it compares
        </h2>
        <p className="mx-auto mt-4 max-w-2xl text-center text-ink-2">
          A general comparison with typical AI app builders and traditional drag-and-drop builders. Individual products vary, so see our{" "}
          <Link href="/compare" className="underline underline-offset-4">
            detailed comparisons
          </Link>
          .
        </p>
        <div className="mt-10 overflow-x-auto rounded-2xl border border-line bg-card">
          <table className="w-full min-w-[640px] text-sm">
            <thead>
              <tr className="border-b border-line text-left">
                <th className="p-4 font-medium text-muted" scope="col">
                  <span className="sr-only">Feature</span>
                </th>
                <th className="p-4 font-semibold text-ink" scope="col">{site.name}</th>
                <th className="p-4 font-medium text-ink-2" scope="col">Typical AI app builders</th>
                <th className="p-4 font-medium text-ink-2" scope="col">Typical drag-and-drop builders</th>
              </tr>
            </thead>
            <tbody>
              {COMPARE.map(([label, a, b, c]) => (
                <tr key={label} className="border-b border-line last:border-0">
                  <th scope="row" className="p-4 text-left font-normal text-ink">{label}</th>
                  {([a, b, c] as (boolean | string)[]).map((v, i) => (
                    <td key={i} className="p-4">
                      {v === true ? (
                        <span className="inline-flex size-6 items-center justify-center rounded-full bg-green-100 text-green-800" aria-label="Yes">✓</span>
                      ) : v === false ? (
                        <span className="inline-flex size-6 items-center justify-center rounded-full bg-paper-2 text-muted" aria-label="No">–</span>
                      ) : (
                        <span className="text-muted">{v}</span>
                      )}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* Industries */}
      <section className="mx-auto mt-28 max-w-6xl px-4 sm:px-6" aria-labelledby="industries">
        <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
          <h2 id="industries" className="max-w-xl font-display text-5xl leading-[1.02] text-ink sm:text-6xl">
            Made for the way your business wins customers
          </h2>
          <ButtonLink href="/templates" variant="outline">
            All templates <ArrowRight className="size-4" />
          </ButtonLink>
        </div>
        <div className="mt-10 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
          {industries.slice(0, 12).map((i) => (
            <Link
              key={i.slug}
              href={`/for/${i.slug}`}
              className="group rounded-xl border border-line bg-card px-4 py-3.5 text-sm text-ink transition-colors hover:border-ink"
            >
              <span className="font-medium">{i.name}</span>
              <ArrowRight className="float-right mt-0.5 size-4 text-muted transition-transform group-hover:translate-x-0.5 group-hover:text-ink" />
            </Link>
          ))}
        </div>
      </section>

      <section className="mt-28 px-4 sm:px-6">
        <Faq items={FAQS} />
      </section>

      {/* Final CTA */}
      <section className="mx-auto mt-28 max-w-4xl px-4 sm:px-6">
        <div className="rounded-[28px] bg-ink px-6 py-14 text-center sm:px-14">
          <h2 className="font-display text-5xl leading-[1.02] text-white sm:text-6xl">
            Your next customer is <em className="text-accent">searching</em> right now.
          </h2>
          <p className="mx-auto mt-4 max-w-lg text-white/70">Be the site they find. Start free; no credit card needed.</p>
          <div className="mx-auto mt-8 max-w-xl text-left">
            <HeroPrompt compact />
          </div>
        </div>
      </section>
    </>
  );
}

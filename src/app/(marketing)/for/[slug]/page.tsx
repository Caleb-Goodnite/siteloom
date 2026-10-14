import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Check, Lightbulb } from "lucide-react";
import { Faq } from "@/components/marketing/faq";
import { HeroPrompt } from "@/components/marketing/hero-prompt";
import { JsonLd } from "@/components/marketing/json-ld";
import { site } from "@/config/site";
import { getIndustry, industries } from "@/content/industries";

type Props = { params: Promise<{ slug: string }> };

export const dynamicParams = false;

export function generateStaticParams() {
  return industries.map((i) => ({ slug: i.slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const i = getIndustry(slug);
  if (!i) return {};
  return {
    title: `AI Website Builder for ${i.name}`,
    description: `${i.intro.slice(0, 150).replace(/\s+\S*$/, "")}…`,
    alternates: { canonical: `/for/${i.slug}` },
    openGraph: { title: `AI Website Builder for ${i.name} | ${site.name}`, url: `/for/${i.slug}` },
  };
}

export default async function IndustryPage({ params }: Props) {
  const { slug } = await params;
  const i = getIndustry(slug);
  if (!i) notFound();
  const related = industries.filter((x) => x.slug !== i.slug).slice(0, 6);

  return (
    <div className="px-4 sm:px-6">
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@type": "BreadcrumbList",
          itemListElement: [
            { "@type": "ListItem", position: 1, name: "Templates", item: `${site.url}/templates` },
            { "@type": "ListItem", position: 2, name: i.name, item: `${site.url}/for/${i.slug}` },
          ],
        }}
      />
      <section className="mx-auto max-w-3xl pt-14 text-center">
        <nav className="text-xs text-muted" aria-label="Breadcrumb">
          <Link href="/templates" className="hover:text-ink">Templates</Link> / <span>{i.name}</span>
        </nav>
        <p className="mt-6 text-sm font-semibold text-accent-ink">AI website builder for {i.name.toLowerCase()}</p>
        <h1 className="mt-3 font-display text-5xl leading-[1] text-ink sm:text-7xl">{i.headline}</h1>
        <p className="mx-auto mt-6 max-w-2xl text-lg leading-relaxed text-ink-2">{i.intro}</p>
        <div className="mx-auto mt-9 max-w-2xl text-left">
          <HeroPrompt initial={i.prompt} compact />
          <p className="mt-2 text-center text-xs text-muted">This example brief is editable. Swap in your own details.</p>
        </div>
      </section>

      <section className="mx-auto mt-24 max-w-6xl">
        <h2 className="font-display text-4xl text-ink sm:text-5xl">What every {i.singular} website needs</h2>
        <div className="mt-8 grid gap-4 md:grid-cols-2">
          {i.mustHaves.map((m) => (
            <div key={m.title} className="rounded-2xl border border-line bg-card p-6">
              <h3 className="flex items-center gap-2 font-semibold text-ink">
                <Check className="size-4 text-ok" /> {m.title}
              </h3>
              <p className="mt-2 text-[15px] leading-relaxed text-ink-2">{m.body}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="mx-auto mt-16 grid max-w-6xl gap-6 md:grid-cols-2">
        <div className="rounded-2xl border border-line bg-card p-6">
          <h2 className="text-lg font-semibold text-ink">Pages we&apos;ll build</h2>
          <ol className="mt-4 space-y-2">
            {i.pages.map((p, n) => (
              <li key={p} className="flex items-center gap-3 text-ink-2">
                <span className="flex size-6 items-center justify-center rounded-full bg-paper-2 text-xs font-medium text-ink">{n + 1}</span>
                {p}
              </li>
            ))}
          </ol>
          <p className="mt-4 text-sm text-muted">
            Plus a mobile menu, contact form, {i.schemaType} structured data, sitemap and social cards, all automatic.
          </p>
        </div>
        <div className="rounded-2xl border border-line bg-accent-soft/50 p-6">
          <h2 className="flex items-center gap-2 text-lg font-semibold text-ink">
            <Lightbulb className="size-5 text-accent-ink" /> SEO tips for {i.name.toLowerCase()}
          </h2>
          <ul className="mt-4 space-y-3 text-[15px] leading-relaxed text-ink-2">
            {i.seoTips.map((t) => (
              <li key={t} className="flex gap-2">
                <span className="mt-2 size-1.5 shrink-0 rounded-full bg-accent" />
                {t}
              </li>
            ))}
          </ul>
        </div>
      </section>

      <section className="mt-24">
        <Faq items={i.faqs} title={`Questions from ${i.name.toLowerCase()}`} />
      </section>

      <section className="mx-auto mt-20 max-w-6xl">
        <h2 className="text-lg font-semibold text-ink">More website templates</h2>
        <div className="mt-4 flex flex-wrap gap-2">
          {related.map((r) => (
            <Link key={r.slug} href={`/for/${r.slug}`} className="rounded-full border border-line bg-card px-4 py-2 text-sm text-ink-2 hover:border-ink hover:text-ink">
              Website builder for {r.name.toLowerCase()}
            </Link>
          ))}
        </div>
      </section>
    </div>
  );
}

import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Check } from "lucide-react";
import { Faq } from "@/components/marketing/faq";
import { HeroPrompt } from "@/components/marketing/hero-prompt";
import { site } from "@/config/site";
import { competitors, getCompetitor } from "@/content/compare";

type Props = { params: Promise<{ slug: string }> };

export const dynamicParams = false;

export function generateStaticParams() {
  return competitors.map((c) => ({ slug: c.slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const c = getCompetitor(slug);
  if (!c) return {};
  return {
    title: { absolute: `${site.name} vs ${c.name}: an honest comparison` },
    description: `Looking for a ${c.name} alternative? ${site.name} vs ${c.name} compared: output, SEO, pricing, forms and when to choose each.`,
    alternates: { canonical: `/compare/${c.slug}` },
  };
}

export default async function ComparePage({ params }: Props) {
  const { slug } = await params;
  const c = getCompetitor(slug);
  if (!c) notFound();
  const reviewed = new Date(site.comparisonsReviewed).toLocaleDateString("en-US", { month: "long", year: "numeric" });

  return (
    <div className="px-4 sm:px-6">
      <section className="mx-auto max-w-3xl pt-14">
        <nav className="text-xs text-muted" aria-label="Breadcrumb">
          <Link href="/compare" className="hover:text-ink">Comparisons</Link> / <span>{c.name}</span>
        </nav>
        <h1 className="mt-5 font-display text-5xl leading-[1] text-ink sm:text-7xl">
          {site.name} vs {c.name}
        </h1>
        <p className="mt-6 text-lg leading-relaxed text-ink-2">{c.summary}</p>
        <p className="mt-3 text-xs text-muted">
          Reviewed {reviewed}. Products change quickly, so check{" "}
          <a href={c.url} rel="nofollow noopener" target="_blank" className="underline underline-offset-2">
            {c.name}&apos;s site
          </a>{" "}
          for their current features and pricing.
        </p>
      </section>

      <section className="mx-auto mt-14 grid max-w-5xl gap-4 md:grid-cols-2">
        <div className="rounded-2xl border border-line bg-card p-6">
          <h2 className="text-lg font-semibold text-ink">Choose {c.name} if you want…</h2>
          <ul className="mt-4 space-y-2.5 text-[15px] text-ink-2">
            {c.theyreGreatFor.map((x) => (
              <li key={x} className="flex gap-2">
                <Check className="mt-1 size-4 shrink-0 text-muted" />
                {x}
              </li>
            ))}
          </ul>
        </div>
        <div className="rounded-2xl border border-ink bg-card p-6">
          <h2 className="text-lg font-semibold text-ink">Choose {site.name} if…</h2>
          <ul className="mt-4 space-y-2.5 text-[15px] text-ink-2">
            {c.chooseCurblitIf.map((x) => (
              <li key={x} className="flex gap-2">
                <Check className="mt-1 size-4 shrink-0 text-ok" />
                {x}
              </li>
            ))}
          </ul>
        </div>
      </section>

      <section className="mx-auto mt-14 max-w-5xl">
        <h2 className="font-display text-4xl text-ink">Side by side</h2>
        <div className="mt-6 overflow-x-auto rounded-2xl border border-line bg-card">
          <table className="w-full min-w-[600px] text-sm">
            <thead>
              <tr className="border-b border-line text-left">
                <th className="w-1/4 p-4 font-medium text-muted" scope="col"><span className="sr-only">Aspect</span></th>
                <th className="p-4 font-semibold text-ink" scope="col">{site.name}</th>
                <th className="p-4 font-medium text-ink-2" scope="col">{c.name}</th>
              </tr>
            </thead>
            <tbody>
              {c.rows.map((r) => (
                <tr key={r.label} className="border-b border-line align-top last:border-0">
                  <th scope="row" className="p-4 text-left font-medium text-ink">{r.label}</th>
                  <td className="p-4 text-ink-2">{r.curblit}</td>
                  <td className="p-4 text-ink-2">{r.them}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section className="mt-20">
        <Faq items={c.faqs} />
      </section>

      <section className="mx-auto mt-20 max-w-2xl text-center">
        <h2 className="font-display text-4xl text-ink">Try {site.name} free</h2>
        <p className="mt-2 text-ink-2">Describe your business and see your site in about a minute.</p>
        <div className="mt-6 text-left">
          <HeroPrompt compact />
        </div>
      </section>
    </div>
  );
}

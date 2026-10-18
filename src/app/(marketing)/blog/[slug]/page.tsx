import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { HeroPrompt } from "@/components/marketing/hero-prompt";
import { JsonLd } from "@/components/marketing/json-ld";
import { site } from "@/config/site";
import { getPost, posts } from "@/content/blog";

type Props = { params: Promise<{ slug: string }> };

export const dynamicParams = false;

export function generateStaticParams() {
  return posts.map((p) => ({ slug: p.slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const p = getPost(slug);
  if (!p) return {};
  return {
    // Long headlines skip the " | Curblit" suffix so search results don't cut them off.
    title: p.title.length > 50 ? { absolute: p.title } : p.title,
    description: p.description,
    alternates: { canonical: `/blog/${p.slug}` },
    openGraph: { type: "article", title: p.title, description: p.description, publishedTime: p.date, url: `/blog/${p.slug}` },
  };
}

export default async function PostPage({ params }: Props) {
  const { slug } = await params;
  const p = getPost(slug);
  if (!p) notFound();

  return (
    <article className="mx-auto max-w-2xl px-4 pt-14 sm:px-6">
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@type": "Article",
          headline: p.title,
          description: p.description,
          datePublished: p.date,
          author: { "@type": "Organization", name: site.name },
          publisher: { "@type": "Organization", name: site.name, logo: { "@type": "ImageObject", url: `${site.url}/icon.svg` } },
          mainEntityOfPage: `${site.url}/blog/${p.slug}`,
        }}
      />
      <Link href="/blog" className="text-sm text-muted hover:text-ink">
        ← All guides
      </Link>
      <h1 className="mt-6 font-display text-5xl leading-[1.02] text-ink sm:text-6xl">{p.title}</h1>
      <p className="mt-4 text-sm text-muted">
        {p.author} · {new Date(p.date).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })} · {p.readingMinutes} min read
      </p>
      <div className="prose-sl mt-10">
        <ReactMarkdown remarkPlugins={[remarkGfm]}>{p.body}</ReactMarkdown>
      </div>
      <aside className="mt-16 rounded-2xl border border-line bg-card p-6">
        <h2 className="font-display text-3xl text-ink">Build a site that gets found</h2>
        <p className="mt-1 text-sm text-ink-2">Describe your business. {site.name} handles the rest, SEO included.</p>
        <div className="mt-5">
          <HeroPrompt compact />
        </div>
      </aside>
    </article>
  );
}

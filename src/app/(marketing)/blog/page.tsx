import type { Metadata } from "next";
import Link from "next/link";
import { posts } from "@/content/blog";

export const metadata: Metadata = {
  title: "Guides: building websites that get found",
  description: "Practical guides on SEO, AI website builders and turning visitors into customers.",
  alternates: { canonical: "/blog" },
};

export default function BlogIndex() {
  const sorted = [...posts].sort((a, b) => b.date.localeCompare(a.date));
  return (
    <div className="mx-auto max-w-3xl px-4 pt-16 sm:px-6">
      <h1 className="font-display text-6xl leading-[0.98] text-ink sm:text-7xl">Guides</h1>
      <p className="mt-4 text-lg text-ink-2">Practical advice for websites that get found and win customers.</p>
      <div className="mt-12 divide-y divide-line">
        {sorted.map((p) => (
          <article key={p.slug} className="py-8">
            <p className="text-xs text-muted">
              {new Date(p.date).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })} · {p.readingMinutes} min read
            </p>
            <h2 className="mt-2 text-2xl font-semibold leading-snug text-ink">
              <Link href={`/blog/${p.slug}`} className="hover:text-accent-ink">
                {p.title}
              </Link>
            </h2>
            <p className="mt-2 text-ink-2">{p.description}</p>
          </article>
        ))}
      </div>
    </div>
  );
}

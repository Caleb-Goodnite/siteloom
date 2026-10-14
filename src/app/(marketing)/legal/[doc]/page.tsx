import type { Metadata } from "next";
import { notFound } from "next/navigation";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { site } from "@/config/site";
import { legalDocs } from "@/content/legal";

type Props = { params: Promise<{ doc: string }> };

export const dynamicParams = false;

export function generateStaticParams() {
  return Object.keys(legalDocs).map((doc) => ({ doc }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { doc } = await params;
  const d = legalDocs[doc];
  if (!d) return {};
  return { title: d.title, description: d.description, alternates: { canonical: `/legal/${doc}` } };
}

export default async function LegalPage({ params }: Props) {
  const { doc } = await params;
  const d = legalDocs[doc];
  if (!d) notFound();
  return (
    <article className="mx-auto max-w-2xl px-4 pt-14 sm:px-6">
      <h1 className="font-display text-5xl text-ink sm:text-6xl">{d.title}</h1>
      <p className="mt-3 text-sm text-muted">
        Effective {new Date(site.legal.effectiveDate).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })}
      </p>
      <div className="prose-sl mt-10">
        <ReactMarkdown remarkPlugins={[remarkGfm]}>{d.body}</ReactMarkdown>
      </div>
    </article>
  );
}

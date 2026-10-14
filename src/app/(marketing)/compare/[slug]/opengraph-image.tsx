import { site } from "@/config/site";
import { competitors, getCompetitor } from "@/content/compare";
import { ogCard, OG_SIZE } from "@/lib/og-card";

export const size = OG_SIZE;
export const contentType = "image/png";
export const alt = "Comparison";

export function generateStaticParams() {
  return competitors.map((c) => ({ slug: c.slug }));
}

export default async function Image({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const c = getCompetitor(slug);
  return ogCard({ title: `${site.name} vs ${c?.name ?? ""}`, eyebrow: "An honest comparison" });
}

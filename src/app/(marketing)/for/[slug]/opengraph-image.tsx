import { getIndustry, industries } from "@/content/industries";
import { ogCard, OG_SIZE } from "@/lib/og-card";

export const size = OG_SIZE;
export const contentType = "image/png";
export const alt = "AI website builder";

export function generateStaticParams() {
  return industries.map((i) => ({ slug: i.slug }));
}

export default async function Image({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const i = getIndustry(slug);
  return ogCard({ title: i?.headline ?? "AI website builder", eyebrow: `AI website builder for ${i?.name.toLowerCase() ?? "business"}` });
}

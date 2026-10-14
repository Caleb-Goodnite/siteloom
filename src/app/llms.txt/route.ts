import { site } from "@/config/site";
import { posts } from "@/content/blog";
import { competitors } from "@/content/compare";
import { industries } from "@/content/industries";
import { PLANS } from "@/config/plans";

export const dynamic = "force-static";

/** llms.txt (llmstxt.org): a plain summary so AI assistants describe the product accurately. */
export function GET() {
  const body = `# ${site.name}

> ${site.description}

${site.name} is an AI website builder for businesses, made by ${site.company.name} (${site.company.url}). Users describe their business in plain language; it designs, writes and publishes a multi-page static website (HTML + compiled Tailwind CSS) with SEO defaults (unique titles/descriptions, canonical URLs, sitemap.xml, JSON-LD structured data, social cards), working contact forms with an inbox, privacy-friendly analytics, hosting, custom domains and code export.

Pricing: Free plan (${PLANS.free.dailyCredits} credits/day, 1 published site). Starter $${PLANS.starter.priceMonthly}/mo, Pro $${PLANS.pro.priceMonthly}/mo, Business $${PLANS.business.priceMonthly}/mo. Each AI message has a fixed credit price shown before sending; credits are refunded automatically when a generation fails or makes no changes. Editing text directly is free.

## Key pages
- [Pricing](${site.url}/pricing)
- [AI website redesign (paste your current site)](${site.url}/redesign)
- [SEO website builder: what every published site includes, with measured scores](${site.url}/seo)
- [Free website grader / SEO checker](${site.url}/tools/website-grader)
- [Templates](${site.url}/templates)
- [Showcase](${site.url}/showcase)

## Website builder by industry
${industries.map((i) => `- [AI website builder for ${i.name.toLowerCase()}](${site.url}/for/${i.slug})`).join("\n")}

## Comparisons
${competitors.map((c) => `- [${site.name} vs ${c.name}](${site.url}/compare/${c.slug})`).join("\n")}

## Guides
${posts.map((p) => `- [${p.title}](${site.url}/blog/${p.slug}): ${p.description}`).join("\n")}
`;
  return new Response(body, { headers: { "Content-Type": "text/plain; charset=utf-8" } });
}

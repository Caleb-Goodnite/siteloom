import type { MetadataRoute } from "next";
import { site } from "@/config/site";
import { posts } from "@/content/blog";
import { competitors } from "@/content/compare";
import { industries } from "@/content/industries";
import { legalDocs } from "@/content/legal";

export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date();
  const url = (path: string) => `${site.url}${path}`;
  return [
    { url: url("/"), lastModified: now, changeFrequency: "weekly", priority: 1 },
    { url: url("/pricing"), lastModified: now, changeFrequency: "monthly", priority: 0.9 },
    { url: url("/templates"), lastModified: now, changeFrequency: "monthly", priority: 0.8 },
    ...industries.map((i) => ({ url: url(`/for/${i.slug}`), lastModified: now, changeFrequency: "monthly" as const, priority: 0.8 })),
    { url: url("/compare"), lastModified: now, changeFrequency: "monthly", priority: 0.6 },
    ...competitors.map((c) => ({ url: url(`/compare/${c.slug}`), lastModified: new Date(site.comparisonsReviewed), changeFrequency: "monthly" as const, priority: 0.7 })),
    { url: url("/blog"), lastModified: now, changeFrequency: "weekly", priority: 0.6 },
    ...posts.map((p) => ({ url: url(`/blog/${p.slug}`), lastModified: new Date(p.date), changeFrequency: "yearly" as const, priority: 0.6 })),
    { url: url("/showcase"), lastModified: now, changeFrequency: "daily", priority: 0.5 },
    ...Object.keys(legalDocs).map((d) => ({ url: url(`/legal/${d}`), lastModified: new Date(site.legal.effectiveDate), changeFrequency: "yearly" as const, priority: 0.2 })),
  ];
}

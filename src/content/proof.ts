/**
 * SEO claims shown on the marketing site, with how they were measured. Keep these honest:
 * update them only with numbers you re-measure (scripts/eval-generate.ts + the auditor).
 */
export const SEO_BENCHMARK = {
  measured: "2026-10-14",
  sites: 3,
  pages: 16,
  average: 99,
  lowest: 97,
  cssKb: "28–37",
  frameworkJsKb: 0,
  method:
    "Three sites generated from ordinary prompts (a dental practice, a restaurant, and a redesign of a real restaurant's website), published with no manual edits, then every page graded with our public website auditor.",
};

/** Minimum published sites before the live average replaces the benchmark. */
export const LIVE_STATS_MIN_SITES = 10;

/** What each publish adds automatically. Every item here is implemented in src/lib/site/publish.ts. */
export const SEO_GUARANTEES = [
  ["Static HTML", "Every word is in the page source, so Google, Bing and AI crawlers that don't run JavaScript can read it."],
  ["Unique titles & descriptions", "Written per page with your service and location, and checked for length and duplicates."],
  ["Structured data on every page", "Business schema (Dentist, Restaurant, Plumber…) on the home page, plus WebPage and breadcrumbs everywhere."],
  ["sitemap.xml & robots.txt", "Generated on every publish, listing every page with clean URLs."],
  ["llms.txt", "A plain-language summary for AI assistants like ChatGPT and Perplexity."],
  ["Canonical URLs & clean links", "/about instead of /about.html, with old-style links redirected, so rankings never split."],
  ["Social share cards", "Open Graph and Twitter tags plus an auto-generated preview image for every page."],
  ["Fast by default", "Compiled CSS (about 30 KB), inline SVG icons, no framework JavaScript, served from a global CDN."],
  ["Mobile-first & accessible", "Viewport, semantic landmarks, one H1 per page, alt text, focus states, tap-to-call."],
  ["Graded on every publish", "Each page is scored by the same auditor as our free website grader, and you can re-check the live site anytime."],
] as const;

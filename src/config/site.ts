/**
 * Brand + domain configuration. Rename the company here and everything follows.
 *
 * Two domains are required in production:
 *  - NEXT_PUBLIC_APP_URL       the product + marketing site (e.g. https://curblit.com)
 *  - NEXT_PUBLIC_SITES_DOMAIN  where customer sites are hosted (e.g. curblit.site → acme.curblit.site)
 *
 * They MUST be different registrable domains. Customer sites run arbitrary JavaScript, so
 * hosting them on the app's domain would let a published site read the app's auth cookies.
 */
/**
 * Accepts the sites domain however it was typed in the environment ("curblit.site",
 * "*.curblit.site", "https://curblit.site/") and returns the bare host.
 */
export function normalizeSitesDomain(value: string | undefined) {
  const v = (value || "localhost:3000").trim().toLowerCase();
  return v.replace(/^https?:\/\//, "").replace(/^\*\./, "").replace(/^www\./, "").replace(/\/.*$/, "").replace(/\.$/, "") || "localhost:3000";
}

export const site = {
  name: "Curblit",
  tagline: "Websites that get found.",
  description:
    "Describe your business and Curblit builds a fast, multi-page website Google and AI search can read, with hosting, forms, analytics and SEO built in.",
  url: (process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000").replace(/\/$/, ""),
  sitesDomain: normalizeSitesDomain(process.env.NEXT_PUBLIC_SITES_DOMAIN),
  supportEmail: process.env.NEXT_PUBLIC_SUPPORT_EMAIL || "support@curblit.com",
  /** The parent company that owns and runs Curblit. */
  company: { name: "Anchorforge Digital", url: "https://anchorforgedigital.com" },
  /** Official social profiles (comma-separated URLs), shown in the footer and as schema.org sameAs. */
  social: (process.env.NEXT_PUBLIC_SOCIAL_LINKS || "")
    .split(",")
    .map((u) => u.trim())
    .filter((u) => /^https:\/\/[^\s]+$/.test(u)),
  /** Only set this once you own the X/Twitter handle (e.g. "@curblit"). */
  twitter: process.env.NEXT_PUBLIC_TWITTER_HANDLE || "",
  /** Date the comparison pages were last fact-checked. Update when you re-review them. */
  comparisonsReviewed: "2026-10-14",
  /** Used in the legal pages. Have a lawyer review /legal/* before launch. */
  legal: {
    entity: process.env.NEXT_PUBLIC_LEGAL_ENTITY || "Anchorforge Digital",
    governingLaw: process.env.NEXT_PUBLIC_GOVERNING_LAW || "the State of Delaware, United States",
    effectiveDate: "2026-10-18",
  },
} as const;

export function isLocalSitesDomain() {
  return site.sitesDomain.startsWith("localhost") || site.sitesDomain.endsWith(".localhost");
}

/** Public URL for a published project. Local dev uses `slug.localhost:3000`, which browsers resolve. */
export function publishedUrl(slug: string, customDomain?: string | null) {
  if (customDomain) return `https://${customDomain}`;
  const protocol = isLocalSitesDomain() ? "http" : "https";
  return `${protocol}://${slug}.${site.sitesDomain}`;
}

export function appHost() {
  return new URL(site.url).host;
}

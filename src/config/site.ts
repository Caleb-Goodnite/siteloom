/**
 * Brand + domain configuration. Rename the company here and everything follows.
 *
 * Two domains are required in production:
 *  - NEXT_PUBLIC_APP_URL       the product + marketing site (e.g. https://siteloom.com)
 *  - NEXT_PUBLIC_SITES_DOMAIN  where customer sites are hosted (e.g. siteloom.site → acme.siteloom.site)
 *
 * They MUST be different registrable domains. Customer sites run arbitrary JavaScript, so
 * hosting them on the app's domain would let a published site read the app's auth cookies.
 */
export const site = {
  name: "Siteloom",
  tagline: "Websites that get found.",
  description:
    "Describe your business and Siteloom builds a fast, multi-page website that Google and AI search can actually read — with hosting, working forms, analytics and SEO built in.",
  url: (process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000").replace(/\/$/, ""),
  sitesDomain: process.env.NEXT_PUBLIC_SITES_DOMAIN || "localhost:3000",
  supportEmail: process.env.NEXT_PUBLIC_SUPPORT_EMAIL || "support@siteloom.com",
  twitter: "@siteloom",
  /** Date the comparison pages were last fact-checked. Update when you re-review them. */
  comparisonsReviewed: "2026-10-14",
  /** Used in the legal pages. Have a lawyer review /legal/* before launch. */
  legal: {
    entity: process.env.NEXT_PUBLIC_LEGAL_ENTITY || "Siteloom",
    governingLaw: process.env.NEXT_PUBLIC_GOVERNING_LAW || "the State of Delaware, United States",
    effectiveDate: "2026-10-14",
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

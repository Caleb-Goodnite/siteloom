import type { MetadataRoute } from "next";
import { site } from "@/config/site";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [{ userAgent: "*", allow: "/", disallow: ["/dashboard", "/project", "/admin", "/api", "/auth", "/login", "/signup", "/hosted"] }],
    sitemap: `${site.url}/sitemap.xml`,
    host: site.url,
  };
}

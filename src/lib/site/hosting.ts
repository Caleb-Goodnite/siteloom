import "server-only";
import { revalidateTag, unstable_cache } from "next/cache";
import { site } from "@/config/site";
import { supabaseAdmin } from "@/lib/supabase/admin";
import type { FileMap, ProjectSettings } from "@/lib/types";

export type HostedSite = {
  id: string;
  user_id: string;
  name: string;
  slug: string;
  published: boolean;
  blocked: boolean;
  custom_domain: string | null;
  domain_verified: boolean;
  settings: ProjectSettings & { brand?: string | null };
  published_files: FileMap | null;
};

export function normalizeHost(host: string) {
  return host.trim().toLowerCase().replace(/\.$/, "");
}

/** Resolves a request host to a project: `slug.<sites domain>` or a custom domain. */
async function lookup(host: string): Promise<HostedSite | null> {
  const sitesDomain = site.sitesDomain.toLowerCase();
  const query = supabaseAdmin()
    .from("projects")
    .select("id, user_id, name, slug, published, blocked, custom_domain, domain_verified, settings, published_files");

  if (host.endsWith(`.${sitesDomain}`)) {
    const slug = host.slice(0, -(sitesDomain.length + 1));
    if (!/^[a-z0-9][a-z0-9-]{1,46}[a-z0-9]$/.test(slug)) return null;
    const { data } = await query.eq("slug", slug).maybeSingle();
    return (data as HostedSite) ?? null;
  }

  const bare = host.replace(/:\d+$/, "");
  const variants = bare.startsWith("www.") ? [bare, bare.slice(4)] : [bare, `www.${bare}`];
  const { data } = await query.in("custom_domain", variants).eq("domain_verified", true).limit(1).maybeSingle();
  return (data as HostedSite) ?? null;
}

const NOT_FOUND = "hosted-site-not-found";

/**
 * Cached lookup. Only found sites are cached: a miss throws inside the cache (errors are never
 * stored), so a host visited before its site was published doesn't stay "not found" for an hour.
 */
export async function getHostedSite(host: string) {
  const h = normalizeHost(host);
  try {
    return await unstable_cache(
      async () => {
        const found = await lookup(h);
        if (!found) throw new Error(NOT_FOUND);
        return found;
      },
      ["hosted-site-v4", h],
      { tags: [`site:${h}`], revalidate: 3600 },
    )();
  } catch (err) {
    if (err instanceof Error && err.message === NOT_FOUND) return null;
    throw err;
  }
}

/** Clears cached copies of a site after publish / unpublish / domain changes. */
export function invalidateSite(project: { slug: string; custom_domain?: string | null }) {
  const hosts = [`${project.slug}.${site.sitesDomain}`.toLowerCase()];
  if (project.custom_domain) {
    const d = project.custom_domain.toLowerCase();
    hosts.push(d, d.startsWith("www.") ? d.slice(4) : `www.${d}`);
  }
  for (const h of hosts) revalidateTag(`site:${h}`, { expire: 0 });
}

export const CONTENT_TYPES: Record<string, string> = {
  html: "text/html; charset=utf-8",
  css: "text/css; charset=utf-8",
  js: "text/javascript; charset=utf-8",
  json: "application/json; charset=utf-8",
  xml: "application/xml; charset=utf-8",
  txt: "text/plain; charset=utf-8",
  md: "text/markdown; charset=utf-8",
  svg: "image/svg+xml",
  webmanifest: "application/manifest+json",
};

export function contentTypeFor(path: string) {
  const ext = path.split(".").pop()?.toLowerCase() ?? "";
  return CONTENT_TYPES[ext] ?? "application/octet-stream";
}

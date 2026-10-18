import JSZip from "jszip";
import { getPlan } from "@/config/plans";
import { publishedUrl } from "@/config/site";
import { getProfile } from "@/lib/auth";
import { api, getOwnedProject, requireApiUser } from "@/lib/http";
import { buildPublishedSite } from "@/lib/site/publish";
import type { Project } from "@/lib/types";
import { slugify } from "@/lib/utils";

export const maxDuration = 60;

type Ctx = { params: Promise<{ id: string }> };

/**
 * No lock-in: download a production-ready static site (compiled CSS, inline icons,
 * sitemap) that runs on any host, plus the editable source.
 */
export const GET = api<Ctx>(async (_req, ctx) => {
  const user = await requireApiUser();
  const { id } = await ctx.params;
  const [project, profile] = await Promise.all([getOwnedProject<Project>(id, user.id), getProfile(user.id)]);
  const build = await buildPublishedSite({
    files: project.files,
    siteUrl: publishedUrl(project.slug, project.domain_verified ? project.custom_domain : null),
    siteName: project.settings?.siteName ?? project.name,
    settings: project.settings ?? {},
    badge: getPlan(profile.plan).badge,
    runtime: false,
  });

  const zip = new JSZip();
  const site = zip.folder("site")!;
  for (const [path, content] of Object.entries(build.files)) site.file(path, content);
  const source = zip.folder("source")!;
  for (const [path, content] of Object.entries(project.files)) source.file(path, content);
  zip.file(
    "README.txt",
    `${project.name}\n\nsite/    Upload this folder to any static host (Netlify, Cloudflare Pages, GitHub Pages, S3, cPanel…).\n         Pages link with clean URLs (/about), so enable "pretty URLs"/".html extension fallback" on your host,\n         or keep the .html files as-is.\n         Note: built-in forms and analytics only work while hosted on Curblit — point forms at your
         own form service (e.g. Formspree) if you host elsewhere.\nsource/  The editable source files (partials are combined at build time).\n`,
  );
  const blob = await zip.generateAsync({ type: "uint8array", compression: "DEFLATE" });
  return new Response(blob as unknown as BodyInit, {
    headers: {
      "Content-Type": "application/zip",
      "Content-Disposition": `attachment; filename="${slugify(project.name) || "site"}.zip"`,
      "Cache-Control": "no-store",
    },
  });
});

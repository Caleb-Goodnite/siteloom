import "server-only";
import { parse } from "node-html-parser";
import { site } from "@/config/site";
import { listPages } from "@/lib/ai/protocol";
import { inlineIcons } from "@/lib/site/icons";
import {
  CDN,
  cleanUrlFor,
  fillImagePlaceholders,
  insertBeforeBodyEnd,
  insertBeforeHeadEnd,
  insertInHead,
  markCurrentNav,
  pendingImages,
  resolveIncludes,
  rewriteLinksForPublish,
  stripManagedScripts,
  usesAlpine,
} from "@/lib/site/render";
import { countPlaceholders } from "@/lib/site/seo";
import { brandColor, compileTailwind, extractTailwindStyles, removeTailwindStyles } from "@/lib/site/tailwind";
import type { FileMap, ProjectSettings } from "@/lib/types";

export type BuildResult = { files: FileMap; warnings: string[]; brand: string | null };

function escapeAttr(s: string) {
  return s.replace(/&/g, "&amp;").replace(/"/g, "&quot;").replace(/</g, "&lt;");
}

function escapeXml(s: string) {
  return s.replace(/[<>&'"]/g, (c) => ({ "<": "&lt;", ">": "&gt;", "&": "&amp;", "'": "&apos;", '"': "&quot;" })[c]!);
}

function hasTag(html: string, re: RegExp) {
  return re.test(html.slice(0, html.search(/<\/head>/i) + 1 || undefined));
}

function shortHash(s: string) {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) h = Math.imul(h ^ s.charCodeAt(i), 16777619);
  return (h >>> 0).toString(36);
}

/**
 * Builds the production version of a site: compiled + minified Tailwind CSS, inline SVG
 * icons, clean URLs, canonical/Open Graph/Twitter tags, sitemap.xml, robots.txt, llms.txt,
 * favicon, and the tiny runtime that powers forms + analytics. No framework JS ships.
 */
export async function buildPublishedSite(opts: {
  files: FileMap;
  siteUrl: string;
  siteName: string;
  settings: ProjectSettings;
  badge: boolean;
  /** Include /__sl/sl.js (forms + analytics). Off for ZIP exports hosted elsewhere. */
  runtime?: boolean;
}): Promise<BuildResult> {
  const { files, siteUrl } = opts;
  const pages = listPages(files);
  const warnings: string[] = [];
  const out: FileMap = {};

  const htmlFiles = Object.keys(files).filter((p) => p.endsWith(".html"));
  const themeBlocks = [...new Set(htmlFiles.flatMap((p) => extractTailwindStyles(files[p])))];
  const scanned = Object.entries(files)
    .filter(([p]) => /\.(html|js)$/.test(p))
    .map(([, c]) => c);
  const css = await compileTailwind(themeBlocks, scanned);
  if (!css) warnings.push("Styles could not be pre-compiled, so the site uses the slower Tailwind runtime.");
  const cssHref = css ? `/assets/site.css?v=${shortHash(css)}` : null;
  const brand = brandColor(themeBlocks);

  const lang = opts.settings.lang ?? "en";
  const sitemapEntries: string[] = [];
  const llmsLines: string[] = [];

  for (const page of pages) {
    let html = resolveIncludes(files[page], files);
    html = stripManagedScripts(html);
    if (cssHref) {
      html = removeTailwindStyles(html);
      html = insertInHead(html, `<link rel="stylesheet" href="${cssHref}">`);
    } else {
      html = insertInHead(html, `<script src="${CDN.tailwind}"></script>`);
    }
    html = inlineIcons(html);
    html = markCurrentNav(html, page);
    html = fillImagePlaceholders(html);
    html = rewriteLinksForPublish(html);

    const doc = parse(html);
    const title = doc.querySelector("title")?.text.trim() || opts.siteName;
    const description = doc.querySelector('meta[name="description"]')?.getAttribute("content")?.trim() ?? "";
    const url = `${siteUrl}${cleanUrlFor(page)}`;
    const is404 = page === "404.html";

    if (!/<html\b[^>]*\blang=/i.test(html)) html = html.replace(/<html\b/i, `<html lang="${escapeAttr(lang)}"`);

    const head: string[] = [];
    if (!hasTag(html, /rel\s*=\s*["']canonical["']/i) && !is404) head.push(`<link rel="canonical" href="${url}">`);
    if (!hasTag(html, /property\s*=\s*["']og:title["']/i)) {
      head.push(
        `<meta property="og:type" content="website">`,
        `<meta property="og:site_name" content="${escapeAttr(opts.siteName)}">`,
        `<meta property="og:title" content="${escapeAttr(title)}">`,
        `<meta property="og:url" content="${url}">`,
      );
      if (description) head.push(`<meta property="og:description" content="${escapeAttr(description)}">`);
    }
    if (!hasTag(html, /property\s*=\s*["']og:image["']/i)) {
      head.push(`<meta property="og:image" content="${siteUrl}/__sl/og.png?t=${encodeURIComponent(title.slice(0, 90))}">`);
      head.push(`<meta property="og:image:width" content="1200">`, `<meta property="og:image:height" content="630">`);
    }
    if (!hasTag(html, /name\s*=\s*["']twitter:card["']/i)) head.push(`<meta name="twitter:card" content="summary_large_image">`);
    if (!hasTag(html, /rel\s*=\s*["'](?:shortcut )?icon["']/i)) head.push(`<link rel="icon" href="/favicon.svg" type="image/svg+xml">`);
    if (brand && !hasTag(html, /name\s*=\s*["']theme-color["']/i)) head.push(`<meta name="theme-color" content="${brand}">`);
    if (opts.settings.googleVerification) {
      head.push(`<meta name="google-site-verification" content="${escapeAttr(opts.settings.googleVerification)}">`);
    }
    if (is404) head.push(`<meta name="robots" content="noindex">`);
    head.push(`<meta name="generator" content="${site.name}">`);
    if (usesAlpine(html)) head.push(`<script defer src="${CDN.alpine}"></script>`);
    html = insertBeforeHeadEnd(html, head.join("\n"));
    if (opts.runtime !== false) {
      html = insertBeforeBodyEnd(html, `<script defer src="/__sl/sl.js"${opts.badge ? ' data-badge="1"' : ""}></script>`);
    }
    if (!/^\s*<!doctype/i.test(html)) html = `<!doctype html>\n${html}`;
    out[page] = html;

    if (!is404) {
      sitemapEntries.push(`<url><loc>${escapeXml(url)}</loc><lastmod>${new Date().toISOString().slice(0, 10)}</lastmod></url>`);
      llmsLines.push(`- [${title}](${url})${description ? `: ${description}` : ""}`);
    }
  }

  for (const [path, content] of Object.entries(files)) {
    if (path.endsWith(".html")) continue; // pages handled above; partials are inlined
    out[path] = content;
  }
  if (css) out["assets/site.css"] = css;

  if (!files["sitemap.xml"]) {
    out["sitemap.xml"] = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${sitemapEntries.join("\n")}\n</urlset>\n`;
  }
  if (!files["robots.txt"]) {
    out["robots.txt"] = `User-agent: *\nAllow: /\n\nSitemap: ${siteUrl}/sitemap.xml\n`;
  }
  if (!files["llms.txt"]) {
    const desc = opts.settings.description ?? parse(out["index.html"] ?? "").querySelector('meta[name="description"]')?.getAttribute("content") ?? "";
    out["llms.txt"] = `# ${opts.siteName}\n\n${desc ? `> ${desc}\n\n` : ""}## Pages\n\n${llmsLines.join("\n")}\n`;
  }
  if (!files["favicon.svg"]) {
    const letter = escapeXml((opts.siteName.trim()[0] ?? "S").toUpperCase());
    out["favicon.svg"] = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64"><rect width="64" height="64" rx="14" fill="${brand ?? "#1c1917"}"/><text x="50%" y="54%" text-anchor="middle" dominant-baseline="middle" font-family="system-ui,sans-serif" font-size="36" font-weight="700" fill="#fff">${letter}</text></svg>`;
  }

  const placeholders = countPlaceholders(files);
  if (placeholders) warnings.push(`${placeholders} placeholder${placeholders > 1 ? "s" : ""} like [[Phone number]] still need real details.`);
  const missing = pendingImages(files).length;
  if (missing) warnings.push(`${missing} image${missing > 1 ? "s are" : " is"} still placeholders — generate them from the builder.`);

  return { files: out, warnings, brand };
}

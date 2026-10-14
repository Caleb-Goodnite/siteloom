/**
 * Static SEO audit (runs in the browser for the SEO panel and on the server before publish).
 * Checks the things that actually decide whether a small-business site gets indexed and
 * clicked: titles, descriptions, headings, alt text, crawlable copy, links, structured data.
 */
import { parse } from "node-html-parser";
import { listPages } from "@/lib/ai/protocol";
import { listPlaceholders } from "@/lib/site/placeholders";
import { hrefToPage, resolveIncludes } from "@/lib/site/render";
import type { FileMap } from "@/lib/types";

export type Severity = "error" | "warning" | "info";
export type SeoIssue = { page: string; severity: Severity; message: string };
export type PageSummary = { page: string; title: string; description: string; words: number; h1: number };
export type SeoReport = { score: number; issues: SeoIssue[]; pages: PageSummary[]; placeholders: number };

const PENALTY: Record<Severity, number> = { error: 12, warning: 5, info: 1 };

/** Number of distinct [[placeholders]] (each is filled once, everywhere). */
export function countPlaceholders(files: FileMap) {
  return listPlaceholders(files).length;
}

export function auditSite(files: FileMap): SeoReport {
  const pages = listPages(files);
  const issues: SeoIssue[] = [];
  const summaries: PageSummary[] = [];
  const titles = new Map<string, string[]>();
  const descriptions = new Map<string, string[]>();
  const inbound = new Map<string, number>(pages.map((p) => [p, 0]));

  if (!files["index.html"]) issues.push({ page: "index.html", severity: "error", message: "There is no home page (index.html)." });

  for (const page of pages) {
    const html = resolveIncludes(files[page], files);
    const root = parse(html, { blockTextElements: { script: true, style: true, noscript: true } });
    const add = (severity: Severity, message: string) => issues.push({ page, severity, message });

    const title = root.querySelector("title")?.text.trim() ?? "";
    const description = root.querySelector('meta[name="description"]')?.getAttribute("content")?.trim() ?? "";
    if (!title) add("error", "Missing <title>.");
    else if (title.length < 25) add("warning", `Title is short (${title.length} chars) — aim for 50–60 with your main keyword.`);
    else if (title.length > 65) add("warning", `Title is long (${title.length} chars) — Google truncates after ~60.`);
    if (!description) add("error", "Missing meta description.");
    else if (description.length < 70) add("warning", `Meta description is short (${description.length} chars) — aim for 120–160.`);
    else if (description.length > 170) add("warning", `Meta description is long (${description.length} chars) — it will be cut off.`);
    if (title) titles.set(title, [...(titles.get(title) ?? []), page]);
    if (description) descriptions.set(description, [...(descriptions.get(description) ?? []), page]);

    if (!root.querySelector("html")?.getAttribute("lang")) add("warning", 'Missing <html lang="…">.');
    if (!root.querySelector('meta[name="viewport"]')) add("error", "Missing viewport meta tag (bad on mobile).");

    const h1 = root.querySelectorAll("h1").length;
    if (h1 === 0) add("error", "No <h1> heading.");
    if (h1 > 1) add("warning", `${h1} <h1> headings — use exactly one per page.`);

    let lastLevel = 1;
    for (const h of root.querySelectorAll("h1,h2,h3,h4,h5,h6")) {
      const level = Number(h.tagName[1]);
      if (level > lastLevel + 1) {
        add("info", `Heading jumps from h${lastLevel} to h${level} ("${h.text.trim().slice(0, 40)}").`);
        break;
      }
      lastLevel = level;
    }

    const imgs = root.querySelectorAll("img");
    const noAlt = imgs.filter((i) => i.getAttribute("alt") === undefined).length;
    if (noAlt) add("error", `${noAlt} image${noAlt > 1 ? "s" : ""} without alt text.`);
    const noSize = imgs.filter((i) => !i.getAttribute("width") || !i.getAttribute("height")).length;
    if (noSize) add("info", `${noSize} image${noSize > 1 ? "s" : ""} without width/height (causes layout shift).`);

    const main = root.querySelector("main") ?? root.querySelector("body");
    main?.querySelectorAll("script,style,noscript,template").forEach((n) => n.remove());
    const words = (main?.text ?? "").split(/\s+/).filter((w) => /[a-z0-9]/i.test(w)).length;
    const minWords = page === "index.html" ? 300 : 150;
    if (words < minWords) add("warning", `Only ${words} words of content — pages with under ~${minWords} words rarely rank.`);

    for (const a of root.querySelectorAll("a[href]")) {
      const href = a.getAttribute("href") ?? "";
      const target = hrefToPage(href);
      if (!target) continue;
      if (files[target.page] === undefined) add("error", `Broken link to "${href}".`);
      else if (target.page !== page) inbound.set(target.page, (inbound.get(target.page) ?? 0) + 1);
      const text = (a.text || a.getAttribute("aria-label") || "").trim().toLowerCase();
      if (["click here", "here", "read more", "learn more"].includes(text)) {
        add("info", `Vague link text "${text}" — describe where the link goes.`);
      }
    }

    if (page === "index.html" && !/application\/ld\+json/i.test(html)) {
      add("warning", "No structured data (JSON-LD) — add it so Google understands your business.");
    }

    summaries.push({ page, title, description, words, h1 });
  }

  for (const [title, ps] of titles) if (ps.length > 1) issues.push({ page: ps[0], severity: "warning", message: `Duplicate title "${title.slice(0, 50)}" on ${ps.join(", ")}.` });
  for (const [, ps] of descriptions) if (ps.length > 1) issues.push({ page: ps[0], severity: "warning", message: `Duplicate meta description on ${ps.join(", ")}.` });
  for (const [page, n] of inbound) if (page !== "index.html" && n === 0 && pages.length > 1) issues.push({ page, severity: "warning", message: "No other page links here — add it to the navigation." });

  const placeholders = countPlaceholders(files);
  if (placeholders) issues.push({ page: "*", severity: "warning", message: `${placeholders} detail${placeholders > 1 ? "s" : ""} like [[Phone number]] still need filling in.` });

  const score = Math.max(0, Math.min(100, 100 - issues.reduce((n, i) => n + PENALTY[i.severity], 0)));
  const order: Record<Severity, number> = { error: 0, warning: 1, info: 2 };
  issues.sort((a, b) => order[a.severity] - order[b.severity]);
  return { score, issues, pages: summaries, placeholders };
}

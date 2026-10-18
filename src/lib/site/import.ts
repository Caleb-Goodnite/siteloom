import "server-only";
import dns from "node:dns/promises";
import net from "node:net";
import { parse, type HTMLElement } from "node-html-parser";

/**
 * "Redesign my existing site": fetch a public website and distill its real content
 * (copy, services, contact details, images) into a compact dossier the AI rebuilds from.
 *
 * Server-side fetching of user-supplied URLs is an SSRF risk, so every hop is checked:
 * http(s) only, standard ports, no private/loopback/link-local/CGNAT addresses, manual
 * redirects (re-validated), a size cap and a timeout.
 */

const MAX_BYTES = 2_000_000;
const MAX_PAGES = 5;
const MAX_DOSSIER = 14_000;
const UA = "Mozilla/5.0 (compatible; CurblitImporter/1.0; +https://curblit.com)";

export class ImportError extends Error {}

function isPrivateIp(ip: string): boolean {
  if (net.isIPv4(ip)) {
    const [a, b] = ip.split(".").map(Number);
    return (
      a === 0 || a === 10 || a === 127 || (a === 169 && b === 254) || (a === 172 && b >= 16 && b <= 31) ||
      (a === 192 && b === 168) || (a === 100 && b >= 64 && b <= 127) || a >= 224
    );
  }
  const v = ip.toLowerCase();
  if (v === "::" || v === "::1") return true;
  if (v.startsWith("fc") || v.startsWith("fd") || v.startsWith("fe8") || v.startsWith("fe9") || v.startsWith("fea") || v.startsWith("feb")) return true;
  const mapped = v.match(/^::ffff:(\d+\.\d+\.\d+\.\d+)$/);
  return mapped ? isPrivateIp(mapped[1]) : false;
}

/** Throws unless the URL is a public http(s) address. */
export async function assertPublicUrl(raw: string) {
  let url: URL;
  try {
    url = new URL(raw);
  } catch {
    throw new ImportError("That doesn't look like a web address.");
  }
  if (url.protocol !== "http:" && url.protocol !== "https:") throw new ImportError("Only http and https addresses can be imported.");
  if (url.username || url.password) throw new ImportError("Addresses with logins can't be imported.");
  if (url.port && !["80", "443"].includes(url.port)) throw new ImportError("Only standard web ports can be imported.");
  const host = url.hostname.replace(/^\[|\]$/g, "");
  if (host === "localhost" || host.endsWith(".localhost") || host.endsWith(".local") || host.endsWith(".internal")) {
    throw new ImportError("That address isn't public.");
  }
  const addrs = net.isIP(host) ? [{ address: host }] : await dns.lookup(host, { all: true }).catch(() => []);
  if (!addrs.length) throw new ImportError("We couldn't find that website. Check the address.");
  if (addrs.some((a) => isPrivateIp(a.address))) throw new ImportError("That address isn't public.");
  return url;
}

export async function fetchHtml(start: string): Promise<{ url: URL; html: string } | null> {
  let current = start;
  for (let hop = 0; hop < 4; hop++) {
    const url = await assertPublicUrl(current);
    const res = await fetch(url, {
      redirect: "manual",
      headers: { "User-Agent": UA, Accept: "text/html,application/xhtml+xml" },
      signal: AbortSignal.timeout(10_000),
    });
    if (res.status >= 300 && res.status < 400 && res.headers.get("location")) {
      current = new URL(res.headers.get("location")!, url).toString();
      continue;
    }
    if (!res.ok) return null;
    if (!(res.headers.get("content-type") ?? "").includes("html")) return null;
    const reader = res.body?.getReader();
    if (!reader) return null;
    const chunks: Uint8Array[] = [];
    let size = 0;
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      size += value.length;
      if (size > MAX_BYTES) {
        await reader.cancel();
        break;
      }
      chunks.push(value);
    }
    return { url, html: new TextDecoder().decode(Buffer.concat(chunks)) };
  }
  return null;
}

const clean = (s: string) => s.replace(/\s+/g, " ").trim();

type PageDigest = { url: string; title: string; description: string; text: string[]; images: { src: string; alt: string }[]; links: URL[] };

function digest(url: URL, html: string): PageDigest {
  const root = parse(html, { blockTextElements: { script: false, style: false, noscript: false } });
  const title = clean(root.querySelector("title")?.text ?? "");
  const description = clean(root.querySelector('meta[name="description"]')?.getAttribute("content") ?? "");
  const links: URL[] = [];
  for (const a of root.querySelectorAll("a[href]")) {
    try {
      const href = a.getAttribute("href")!;
      if (/^(tel:|mailto:)/i.test(href)) continue;
      const u = new URL(href, url);
      u.hash = "";
      if (u.hostname === url.hostname && /^https?:$/.test(u.protocol) && !/\.(pdf|jpe?g|png|gif|webp|zip|docx?)$/i.test(u.pathname)) links.push(u);
    } catch {}
  }

  const text: string[] = [];
  const seen = new Set<string>();
  const push = (s: string) => {
    const t = clean(s);
    if (t.length < 3 || t.length > 600 || seen.has(t)) return;
    seen.add(t);
    text.push(t);
  };
  for (const a of root.querySelectorAll("a[href^='tel:'], a[href^='mailto:']")) push(`${a.getAttribute("href")} (${clean(a.text)})`);
  root.querySelectorAll("script,style,noscript,svg,iframe,form,button,nav,[role=navigation],[aria-hidden=true]").forEach((n) => n.remove());
  const walk = (el: HTMLElement) => {
    for (const node of el.childNodes) {
      if (node.nodeType !== 1) continue;
      const child = node as HTMLElement;
      const tag = child.tagName?.toLowerCase();
      if (/^h[1-6]$/.test(tag)) push(`${"#".repeat(Number(tag[1]))} ${child.text}`);
      else if (["p", "li", "address", "blockquote", "dt", "dd", "td", "figcaption"].includes(tag)) push(child.text);
      else walk(child);
    }
  };
  walk(root);

  const images: { src: string; alt: string }[] = [];
  for (const img of root.querySelectorAll("img")) {
    const src = img.getAttribute("src") || img.getAttribute("data-src") || "";
    if (!src || src.startsWith("data:") || /\.svg(\?|$)/i.test(src) || /(logo|icon|sprite|pixel|spacer|badge)/i.test(src)) continue;
    const w = Number(img.getAttribute("width") ?? 0);
    if (w && w < 200) continue;
    try {
      const abs = new URL(src, url);
      if (abs.protocol === "https:") images.push({ src: abs.toString(), alt: clean(img.getAttribute("alt") ?? "") });
    } catch {}
    if (images.length >= 8) break;
  }
  return { url: url.toString(), title, description, text, images, links };
}

const PAGE_PRIORITY = /(about|service|menu|pricing|price|team|contact|location|hours|treatment|product|work|portfolio|faq)/i;

/** Fetches the home page plus a few key internal pages and returns a text dossier. */
export async function importWebsite(input: string): Promise<{ url: string; dossier: string; pages: number; title: string }> {
  const start = /^https?:\/\//i.test(input.trim()) ? input.trim() : `https://${input.trim()}`;
  const home = await fetchHtml(start);
  if (!home) throw new ImportError("We couldn't load that website. Make sure it's online and public.");
  const first = digest(home.url, home.html);
  if (/(sign ?in|log ?in|password)/i.test(first.title) && first.text.length < 15) {
    throw new ImportError("That looks like a login page. Import your public website instead.");
  }

  const candidates = [...new Map(first.links.map((u) => [u.pathname.replace(/\/$/, "") || "/", u])).values()]
    .filter((u) => (u.pathname.replace(/\/$/, "") || "/") !== (home.url.pathname.replace(/\/$/, "") || "/"))
    .sort((a, b) => Number(PAGE_PRIORITY.test(b.pathname)) - Number(PAGE_PRIORITY.test(a.pathname)))
    .slice(0, MAX_PAGES - 1);

  const pages: PageDigest[] = [first];
  const results = await Promise.allSettled(candidates.map((u) => fetchHtml(u.toString())));
  for (const r of results) if (r.status === "fulfilled" && r.value) pages.push(digest(r.value.url, r.value.html));

  const perPage = Math.floor(MAX_DOSSIER / pages.length);
  const sections = pages.map((p) => {
    const lines = [`## ${p.url}`, p.title && `Title: ${p.title}`, p.description && `Description: ${p.description}`, ...p.text];
    if (p.images.length) lines.push(`Images: ${p.images.map((i) => `${i.src}${i.alt ? ` (${i.alt})` : ""}`).join(" | ")}`);
    return lines.filter(Boolean).join("\n").slice(0, perPage);
  });
  return { url: home.url.toString(), dossier: sections.join("\n\n"), pages: pages.length, title: first.title };
}

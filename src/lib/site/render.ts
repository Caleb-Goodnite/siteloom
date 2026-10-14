/**
 * Turns a project's source files into renderable HTML. Shared by the in-browser
 * preview and the server-side publish pipeline, so what you see is what ships.
 */
import { parse, type HTMLElement } from "node-html-parser";
import type { FileMap } from "@/lib/types";

export const CDN = {
  tailwind: "https://cdn.jsdelivr.net/npm/@tailwindcss/browser@4.3.3",
  alpine: "https://cdn.jsdelivr.net/npm/alpinejs@3.17.4/dist/cdn.min.js",
  lucide: "https://cdn.jsdelivr.net/npm/lucide@1.57.0/dist/umd/lucide.min.js",
};

const INCLUDE_RE = /<!--\s*@include\s+([^\s]+?)\s*-->/g;

export function resolveIncludes(html: string, files: FileMap, depth = 0): string {
  if (depth > 3) return html;
  return html.replace(INCLUDE_RE, (_m, raw: string) => {
    const path = raw.replace(/^\.?\//, "");
    const part = files[path];
    if (part === undefined) return `<!-- missing include: ${path} -->`;
    return resolveIncludes(part, files, depth + 1);
  });
}

/** Removes library tags the platform manages itself, so they're never loaded twice. */
export function stripManagedScripts(html: string) {
  return html
    .replace(
      /<script\b[^>]*\bsrc\s*=\s*["'][^"']*(?:tailwindcss|@tailwindcss\/browser|alpinejs|lucide)[^"']*["'][^>]*>\s*<\/script>/gi,
      "",
    )
    .replace(/<script\b[^>]*>\s*(?:window\.)?lucide\.createIcons\(\s*\)\s*;?\s*<\/script>/gi, "")
    .replace(/<script>\s*tailwind\.config\s*=[\s\S]*?<\/script>/gi, "");
}

export function usesAlpine(html: string) {
  return /\sx-data\b/.test(html);
}

export function usesLucide(html: string) {
  return /data-lucide\s*=/.test(html);
}

// ─────────────────────────── pages & URLs ───────────────────────────

/** Maps a URL path ("/", "/about", "/about.html") to a page file, or null. */
export function pageForPath(urlPath: string, files: FileMap): string | null {
  let p = decodeURIComponent(urlPath.split(/[?#]/)[0]).replace(/^\/+|\/+$/g, "");
  if (!p) return files["index.html"] !== undefined ? "index.html" : null;
  if (p.includes("/")) return null;
  if (!p.endsWith(".html")) p += ".html";
  return files[p] !== undefined ? p : null;
}

export function cleanUrlFor(page: string) {
  return page === "index.html" ? "/" : `/${page.replace(/\.html$/, "")}`;
}

/** Normalizes an href to the page it points at (if it is an internal page link). */
export function hrefToPage(href: string): { page: string; hash: string } | null {
  const h = href.trim();
  if (!h || /^(?:[a-z][a-z0-9+.-]*:|\/\/|#)/i.test(h)) return null;
  const [pathPart, hash = ""] = h.split("#");
  let p = pathPart.split("?")[0].replace(/^\.?\//, "").replace(/^\/+/, "").replace(/\/+$/, "");
  if (p.includes("/")) return null;
  if (!p) p = "index.html";
  if (!p.endsWith(".html")) {
    if (p.includes(".")) return null; // a file like logo.png
    p += ".html";
  }
  return { page: p, hash };
}

/** Adds aria-current="page" to links pointing at the current page. */
export function markCurrentNav(html: string, page: string) {
  return html.replace(/<a\b([^>]*?)\bhref\s*=\s*(["'])(.*?)\2([^>]*)>/gi, (tag, pre, q, href, post) => {
    if (/aria-current/i.test(tag)) return tag;
    const target = hrefToPage(href);
    if (!target || target.page !== page || target.hash) return tag;
    return `<a${pre}href=${q}${href}${q}${post} aria-current="page">`;
  });
}

/** Rewrites page links to clean URLs and asset paths to absolute ones (publish only). */
export function rewriteLinksForPublish(html: string) {
  return html
    .replace(/(\shref\s*=\s*)(["'])(.*?)\2/gi, (m, attr, q, href: string) => {
      const t = hrefToPage(href);
      if (!t) {
        if (/^(?:\.\/)?assets\//.test(href)) return `${attr}${q}/${href.replace(/^\.\//, "")}${q}`;
        return m;
      }
      return `${attr}${q}${cleanUrlFor(t.page)}${t.hash ? `#${t.hash}` : ""}${q}`;
    })
    .replace(/(\ssrc\s*=\s*)(["'])(?:\.\/)?(assets\/[^"']+)\2/gi, (_m, attr, q, p) => `${attr}${q}/${p}${q}`);
}

// ─────────────────────────── images ───────────────────────────

function hashHue(s: string) {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) >>> 0;
  return h % 360;
}

export function aspectToSize(aspect: string | undefined) {
  const [w, h] = (aspect ?? "16:9").split(":").map(Number);
  if (!w || !h) return { w: 1600, h: 900 };
  return w >= h ? { w: 1600, h: Math.round((1600 * h) / w) } : { w: Math.round((1600 * w) / h), h: 1600 };
}

/** A soft gradient SVG used until a real photo is generated. */
export function placeholderSrc(prompt: string, aspect?: string) {
  const { w, h } = aspectToSize(aspect);
  const hue = hashHue(prompt);
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}"><defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="hsl(${hue} 35% 88%)"/><stop offset="1" stop-color="hsl(${(hue + 40) % 360} 30% 76%)"/></linearGradient></defs><rect width="100%" height="100%" fill="url(#g)"/><g transform="translate(${w / 2 - 36} ${h / 2 - 28})" fill="none" stroke="hsl(${hue} 20% 45%)" stroke-width="4" opacity=".55"><rect x="2" y="2" width="68" height="52" rx="8"/><circle cx="22" cy="20" r="6"/><path d="M6 50l20-20 14 14 10-10 20 16"/></g></svg>`;
  return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
}

/** Gives every <img data-ai-image> without a real src a placeholder. */
export function fillImagePlaceholders(html: string) {
  return html.replace(/<img\b[^>]*\bdata-ai-image\s*=\s*(["'])([\s\S]*?)\1[^>]*>/gi, (tag, _q, prompt: string) => {
    const hasSrc = /\ssrc\s*=\s*["'][^"']+["']/i.test(tag);
    if (hasSrc) return tag;
    const aspect = tag.match(/data-aspect\s*=\s*["']([\d:]+)["']/i)?.[1];
    const cleaned = tag.replace(/\ssrc\s*=\s*["']\s*["']/i, "");
    return cleaned.replace(/^<img\b/i, `<img src="${placeholderSrc(prompt, aspect)}"`);
  });
}

export type ImageRequest = { prompt: string; aspect: string };

/** Lists unique image prompts that still need a generated photo. */
export function pendingImages(files: FileMap): ImageRequest[] {
  const seen = new Map<string, ImageRequest>();
  for (const [path, content] of Object.entries(files)) {
    if (!path.endsWith(".html")) continue;
    for (const m of content.matchAll(/<img\b[^>]*\bdata-ai-image\s*=\s*(["'])([\s\S]*?)\1[^>]*>/gi)) {
      const tag = m[0];
      if (/\ssrc\s*=\s*["'](?:https?:)?\/\/[^"']+["']/i.test(tag)) continue;
      const prompt = m[2].trim();
      if (!prompt || seen.has(prompt)) continue;
      const aspect = tag.match(/data-aspect\s*=\s*["']([\d:]+)["']/i)?.[1] ?? "16:9";
      seen.set(prompt, { prompt, aspect });
    }
  }
  return [...seen.values()];
}

/** Sets src for every <img> whose data-ai-image matches a generated prompt. */
export function applyImageUrls(files: FileMap, urls: Map<string, string>): FileMap {
  const out: FileMap = {};
  for (const [path, content] of Object.entries(files)) {
    if (!path.endsWith(".html")) {
      out[path] = content;
      continue;
    }
    out[path] = content.replace(/<img\b[^>]*\bdata-ai-image\s*=\s*(["'])([\s\S]*?)\1[^>]*>/gi, (tag, _q, prompt: string) => {
      const url = urls.get(prompt.trim());
      if (!url) return tag;
      const withoutSrc = tag.replace(/\ssrc\s*=\s*(["'])[^"']*\1/i, "");
      return withoutSrc.replace(/^<img\b/i, `<img src="${url}"`);
    });
  }
  return out;
}

// ─────────────────────────── element ids (click-to-edit) ───────────────────────────

/** Elements that never get an id (structural, invisible or void). */
const SKIP_TAGS = new Set(["html", "head", "body", "meta", "link", "title", "script", "style", "noscript", "template", "base", "br", "wbr"]);
/** Elements whose children are never annotated. */
const NO_DESCEND = new Set(["head", "svg", "template", "script", "style", "noscript", "textarea"]);

export type ElementRef = { tag: string; start: number; end: number };

/**
 * Enumerates editable elements of a source file in document order. The index of an
 * element in this list is its stable id within the file (used by the preview to map
 * a click back to the exact source location).
 */
export function enumerateElements(source: string): ElementRef[] {
  const root = parse(source, {
    comment: true,
    blockTextElements: { script: true, style: true, noscript: true, pre: true, textarea: true },
  });
  const out: ElementRef[] = [];
  const walk = (node: HTMLElement, skipChildren: boolean) => {
    for (const child of node.childNodes) {
      if (child.nodeType !== 1) continue;
      const el = child as HTMLElement;
      const tag = (el.rawTagName ?? "").toLowerCase();
      if (!tag) continue;
      if (!skipChildren && !SKIP_TAGS.has(tag)) out.push({ tag, start: el.range[0], end: el.range[1] });
      walk(el, skipChildren || NO_DESCEND.has(tag));
    }
  };
  walk(root, false);
  return out;
}

/** End index of an element's opening tag (position after ">"), quote-aware. */
function openTagEnd(source: string, start: number) {
  let quote: string | null = null;
  for (let i = start; i < source.length; i++) {
    const c = source[i];
    if (quote) {
      if (c === quote) quote = null;
    } else if (c === '"' || c === "'") quote = c;
    else if (c === ">") return i + 1;
  }
  return -1;
}

/** Inserts data-sl="file#n" on every editable element (preview only). */
export function annotate(source: string, file: string) {
  let els: ElementRef[];
  try {
    els = enumerateElements(source);
  } catch {
    return source;
  }
  let out = source;
  for (let i = els.length - 1; i >= 0; i--) {
    const { tag, start } = els[i];
    const at = start + 1 + tag.length;
    if (out.slice(start + 1, at).toLowerCase() !== tag) continue;
    out = out.slice(0, at) + ` data-sl="${file}#${i}"` + out.slice(at);
  }
  return out;
}

export function parseElementId(id: string) {
  const hash = id.lastIndexOf("#");
  if (hash === -1) return null;
  const index = Number(id.slice(hash + 1));
  return Number.isInteger(index) ? { file: id.slice(0, hash), index } : null;
}

/** The original source of an element, for sending to the AI as context. */
export function elementSource(files: FileMap, id: string) {
  const ref = parseElementId(id);
  if (!ref || files[ref.file] === undefined) return null;
  const el = enumerateElements(files[ref.file])[ref.index];
  return el ? files[ref.file].slice(el.start, el.end) : null;
}

/** Replaces an element's inner HTML in its source file (free inline text editing). */
export function applyTextEdit(files: FileMap, id: string, innerHtml: string): FileMap | null {
  const ref = parseElementId(id);
  if (!ref) return null;
  const source = files[ref.file];
  if (source === undefined) return null;
  const el = enumerateElements(source)[ref.index];
  if (!el) return null;
  const innerStart = openTagEnd(source, el.start);
  const closing = `</${el.tag}>`;
  const innerEnd = el.end - closing.length;
  if (innerStart === -1 || source.slice(innerEnd, el.end).toLowerCase() !== closing || innerEnd < innerStart) return null;
  const safe = innerHtml.replace(/<script\b[\s\S]*?<\/script>/gi, "").replace(/\son\w+\s*=\s*(["']).*?\1/gi, "");
  return { ...files, [ref.file]: source.slice(0, innerStart) + safe + source.slice(innerEnd) };
}

// ─────────────────────────── preview ───────────────────────────

function inlineLocalAssets(html: string, files: FileMap) {
  const deferred: string[] = [];
  let out = html.replace(
    /<link\b[^>]*\brel\s*=\s*["']stylesheet["'][^>]*>/gi,
    (tag) => {
      const href = tag.match(/href\s*=\s*["']([^"']+)["']/i)?.[1];
      const path = href?.replace(/^\.?\//, "");
      if (!path || files[path] === undefined) return tag;
      return `<style data-sl-src="${path}">\n${files[path]}\n</style>`;
    },
  );
  out = out.replace(/<script\b([^>]*)\bsrc\s*=\s*["']([^"']+)["']([^>]*)>\s*<\/script>/gi, (tag, a, src: string, b) => {
    const path = src.replace(/^\.?\//, "");
    if (files[path] === undefined) return tag;
    const attrs = `${a} ${b}`;
    const isModule = /type\s*=\s*["']module["']/i.test(attrs);
    const code = files[path].replace(/<\/script/gi, "<\\/script");
    const inline = `<script${isModule ? ' type="module"' : ""} data-sl-src="${path}">\n${code}\n</script>`;
    if (/\bdefer\b/i.test(attrs) || isModule) {
      deferred.push(inline);
      return "";
    }
    return inline;
  });
  if (deferred.length) out = insertBeforeBodyEnd(out, deferred.join("\n"));
  return out;
}

export function insertInHead(html: string, snippet: string) {
  if (/<head\b[^>]*>/i.test(html)) return html.replace(/<head\b[^>]*>/i, (m) => `${m}\n${snippet}`);
  return `${snippet}\n${html}`;
}

export function insertBeforeHeadEnd(html: string, snippet: string) {
  if (/<\/head>/i.test(html)) return html.replace(/<\/head>/i, `${snippet}\n</head>`);
  return insertInHead(html, snippet);
}

export function insertBeforeBodyEnd(html: string, snippet: string) {
  const idx = html.search(/<\/body>(?![\s\S]*<\/body>)/i);
  if (idx === -1) return `${html}\n${snippet}`;
  return html.slice(0, idx) + snippet + "\n" + html.slice(idx);
}

/**
 * Builds the srcdoc for the preview iframe. The iframe is sandboxed without
 * allow-same-origin, so generated code can never touch the app's cookies or storage.
 */
export function buildPreviewDocument(files: FileMap, page: string, opts: { annotate?: boolean } = {}) {
  const source = files[page];
  if (source === undefined) {
    return `<!doctype html><html><body style="font-family:system-ui;display:grid;place-items:center;height:100vh;color:#78716c">Page not found: ${page}</body></html>`;
  }
  const working: FileMap = opts.annotate
    ? Object.fromEntries(
        Object.entries(files).map(([p, c]) => [p, p.endsWith(".html") ? annotate(c, p) : c]),
      )
    : files;

  let html = resolveIncludes(working[page], working);
  html = stripManagedScripts(html);
  html = inlineLocalAssets(html, files);
  html = markCurrentNav(html, page);
  html = fillImagePlaceholders(html);

  const head = [
    `<script src="${CDN.tailwind}"></script>`,
    `<style>mark.sl-ph{background:#fde68a;color:#78350f;border-radius:4px;padding:0 3px;box-shadow:0 0 0 1px #f59e0b55}[data-sl-hover]{outline:2px solid #f97316!important;outline-offset:2px;cursor:pointer}[data-sl-selected]{outline:2px solid #ea580c!important;outline-offset:2px}[contenteditable=true]{outline:2px dashed #2563eb!important;outline-offset:3px;cursor:text}</style>`,
  ];
  html = insertInHead(html, head.join("\n"));

  const tail: string[] = [];
  if (usesLucide(html)) {
    tail.push(`<script src="${CDN.lucide}"></script>`);
  }
  if (usesAlpine(html)) tail.push(`<script defer src="${CDN.alpine}"></script>`);
  tail.push(`<script>${PREVIEW_BRIDGE.replace("__PAGE__", JSON.stringify(page))}</script>`);
  html = insertBeforeBodyEnd(html, tail.join("\n"));
  if (!/^\s*<!doctype/i.test(html)) html = `<!doctype html>\n${html}`;
  return html;
}

/**
 * Runs inside the preview iframe: link navigation, forms, placeholder highlighting,
 * element selection, inline text editing and error reporting via postMessage.
 */
const PREVIEW_BRIDGE = `(() => {
  const PAGE = __PAGE__;
  const post = (m) => parent.postMessage(Object.assign({ sl: true }, m), "*");
  let mode = "none", selected = null, editing = null, original = "";
  window.addEventListener("error", (e) => post({ type: "error", message: String(e.message || e.error || "Script error"), line: e.lineno }));
  window.addEventListener("unhandledrejection", (e) => post({ type: "error", message: "Unhandled promise rejection: " + String(e.reason && e.reason.message || e.reason) }));

  function icons() { try { window.lucide && window.lucide.createIcons(); } catch (e) {} }
  let iconTimer = null;
  new MutationObserver(() => { clearTimeout(iconTimer); iconTimer = setTimeout(icons, 60); }).observe(document.documentElement, { childList: true, subtree: true });

  function highlightPlaceholders(root) {
    const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT, {
      acceptNode: (n) => /\\[\\[[^\\]]+\\]\\]/.test(n.nodeValue) && !(n.parentElement && n.parentElement.closest("script,style,mark.sl-ph,[contenteditable=true]")) ? 1 : 2,
    });
    const nodes = []; while (walker.nextNode()) nodes.push(walker.currentNode);
    for (const node of nodes) {
      const frag = document.createDocumentFragment();
      node.nodeValue.split(/(\\[\\[[^\\]]+\\]\\])/).forEach((part) => {
        if (/^\\[\\[[^\\]]+\\]\\]$/.test(part)) { const m = document.createElement("mark"); m.className = "sl-ph"; m.textContent = part; frag.appendChild(m); }
        else if (part) frag.appendChild(document.createTextNode(part));
      });
      node.parentNode.replaceChild(frag, node);
    }
  }

  document.addEventListener("DOMContentLoaded", () => {
    icons();
    highlightPlaceholders(document.body);
    post({ type: "ready", page: PAGE, title: document.title, placeholders: document.querySelectorAll("mark.sl-ph").length });
  });

  document.addEventListener("click", (e) => {
    const el = e.target instanceof Element ? e.target : null;
    if (!el) return;
    if (mode === "select") {
      const target = el.closest("[data-sl]");
      if (!target) return;
      e.preventDefault(); e.stopPropagation();
      if (selected) selected.removeAttribute("data-sl-selected");
      selected = target; target.setAttribute("data-sl-selected", "");
      post({ type: "select", id: target.getAttribute("data-sl"), tag: target.tagName.toLowerCase(), text: (target.innerText || "").trim().slice(0, 160) });
      return;
    }
    if (mode === "edit") {
      const target = el.closest("[data-sl]");
      if (!target || editing === target) return;
      e.preventDefault(); e.stopPropagation();
      const hasBlockChild = target.querySelector("div,section,article,ul,ol,table,form,header,footer,nav,main,img,iframe,video");
      if (hasBlockChild || !(target.innerText || "").trim()) { post({ type: "toast", message: "Pick a piece of text (a heading, paragraph, button or link)." }); return; }
      startEdit(target);
      return;
    }
    const a = el.closest("a[href]");
    if (!a) return;
    const href = a.getAttribute("href") || "";
    if (href.startsWith("#")) return;
    if (/^(mailto:|tel:)/i.test(href)) { e.preventDefault(); post({ type: "toast", message: "Opens " + href.split(":")[0] + " on the live site: " + href.slice(href.indexOf(":") + 1) }); return; }
    if (/^(https?:)?\\/\\//i.test(href)) { e.preventDefault(); window.open(a.href, "_blank", "noopener"); return; }
    e.preventDefault();
    post({ type: "navigate", href });
  }, true);

  document.addEventListener("mouseover", (e) => {
    if (mode !== "select" && mode !== "edit") return;
    const t = e.target instanceof Element ? e.target.closest("[data-sl]") : null;
    document.querySelectorAll("[data-sl-hover]").forEach((n) => n !== t && n.removeAttribute("data-sl-hover"));
    if (t && t !== editing) t.setAttribute("data-sl-hover", "");
  });

  function clean(node) {
    const c = node.cloneNode(true);
    c.querySelectorAll("mark.sl-ph").forEach((m) => m.replaceWith(document.createTextNode(m.textContent)));
    c.querySelectorAll("[data-sl],[data-sl-hover],[data-sl-selected],[contenteditable]").forEach((n) => { n.removeAttribute("data-sl"); n.removeAttribute("data-sl-hover"); n.removeAttribute("data-sl-selected"); n.removeAttribute("contenteditable"); });
    c.querySelectorAll("svg[data-lucide]").forEach((s) => { const i = document.createElement("i"); i.setAttribute("data-lucide", s.getAttribute("data-lucide")); i.className = s.getAttribute("class") ? s.getAttribute("class").replace(/\\blucide\\S*\\s?/g, "").trim() : ""; s.replaceWith(i); });
    return c.innerHTML;
  }

  function startEdit(target) {
    finishEdit(true);
    editing = target; original = target.innerHTML;
    target.removeAttribute("data-sl-hover");
    target.setAttribute("contenteditable", "true");
    target.focus();
    target.addEventListener("keydown", onKey);
    target.addEventListener("blur", onBlur);
  }
  function onKey(e) {
    if (e.key === "Escape") { editing.innerHTML = original; finishEdit(false); }
    if (e.key === "Enter" && !e.shiftKey && /^(h[1-6]|a|button|span|label|li|strong|em)$/i.test(editing.tagName)) { e.preventDefault(); editing.blur(); }
  }
  function onBlur() { finishEdit(true); }
  function finishEdit(save) {
    if (!editing) return;
    const t = editing; editing = null;
    t.removeEventListener("keydown", onKey); t.removeEventListener("blur", onBlur);
    t.removeAttribute("contenteditable");
    if (save && t.innerHTML !== original) post({ type: "text-edit", id: t.getAttribute("data-sl"), html: clean(t) });
  }

  document.addEventListener("submit", (e) => {
    const form = e.target;
    if (!(form instanceof HTMLFormElement)) return;
    e.preventDefault();
    const ok = form.querySelector("[data-sl-success]");
    if (ok) { ok.hidden = false; ok.style.display = ""; }
    post({ type: "toast", message: "Form works! Submissions are delivered to you once the site is published." });
  }, true);

  window.addEventListener("message", (e) => {
    const m = e.data || {};
    if (!m.sl) return;
    if (m.type === "mode") {
      mode = m.mode;
      finishEdit(true);
      document.querySelectorAll("[data-sl-hover],[data-sl-selected]").forEach((n) => { n.removeAttribute("data-sl-hover"); n.removeAttribute("data-sl-selected"); });
      if (mode !== "select") selected = null;
    }
    if (m.type === "scroll") window.scrollTo(0, m.y || 0);
    if (m.type === "hash" && m.hash) { const t = document.getElementById(m.hash); if (t) t.scrollIntoView(); }
    if (m.type === "highlight" && m.id) {
      const t = document.querySelector('[data-sl="' + CSS.escape(m.id) + '"]');
      if (t) { t.setAttribute("data-sl-selected", ""); t.scrollIntoView({ block: "center" }); }
    }
  });
  let st = null;
  window.addEventListener("scroll", () => { clearTimeout(st); st = setTimeout(() => post({ type: "scroll", y: window.scrollY }), 120); }, { passive: true });
})();`;

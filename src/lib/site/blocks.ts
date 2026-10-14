/**
 * Integration blocks: small, self-contained tags the AI places in a page, which the
 * platform expands into real embeds in the preview and on publish.
 *
 *   <div data-sl-block="map" data-address="900 E 11th St, Austin, TX" class="h-80 rounded-2xl overflow-hidden"></div>
 *   <div data-sl-block="booking" data-url="https://calendly.com/acme/consult" class="min-h-[680px]"></div>
 *   <div data-sl-block="video" data-url="https://www.youtube.com/watch?v=…" class="rounded-2xl overflow-hidden"></div>
 *   <a data-sl-block="pay" href="https://buy.stripe.com/…" class="…">Pay deposit</a>
 *
 * Config lives on the tag itself (data-address / data-url / href), so owners edit it in the
 * Integrations panel for free and the source stays plain HTML.
 */
import type { FileMap } from "@/lib/types";

export type BlockKind = "map" | "booking" | "video" | "pay";

export const BLOCK_KINDS: Record<BlockKind, { label: string; field: "data-address" | "data-url" | "href"; placeholder: string; help: string }> = {
  map: { label: "Map", field: "data-address", placeholder: "900 E 11th St, Austin, TX 78702", help: "Street address shown on an embedded Google Map." },
  booking: { label: "Booking calendar", field: "data-url", placeholder: "https://calendly.com/yourname/consultation", help: "Calendly, Cal.com, TidyCal or Acuity link. Other links become a booking button." },
  video: { label: "Video", field: "data-url", placeholder: "https://www.youtube.com/watch?v=…", help: "YouTube or Vimeo link." },
  pay: { label: "Payment button", field: "href", placeholder: "https://buy.stripe.com/…", help: "Stripe Payment Link, Square, PayPal or any checkout link." },
};

const TAG = /<([a-z][a-z0-9]*)\b([^>]*\bdata-sl-block\s*=\s*["'](map|booking|video|pay)["'][^>]*)>/gi;

function attr(attrs: string, name: string) {
  const m = attrs.match(new RegExp(`\\b${name}\\s*=\\s*(["'])(.*?)\\1`, "i"));
  return m ? m[2].replace(/&amp;/g, "&").replace(/&quot;/g, '"') : "";
}

function esc(s: string) {
  return s.replace(/&/g, "&amp;").replace(/"/g, "&quot;").replace(/</g, "&lt;");
}

const isPlaceholder = (v: string) => !v || /\[\[.*\]\]/.test(v) || v === "#";

function youtubeId(url: string) {
  return url.match(/(?:youtube(?:-nocookie)?\.com\/(?:watch\?(?:.*&)?v=|embed\/|shorts\/|live\/)|youtu\.be\/)([\w-]{6,20})/i)?.[1] ?? null;
}

function vimeoId(url: string) {
  return url.match(/vimeo\.com\/(?:video\/)?(\d{5,12})/i)?.[1] ?? null;
}

function safeHttps(url: string) {
  try {
    const u = new URL(url);
    return u.protocol === "https:" ? u.toString() : null;
  } catch {
    return null;
  }
}

function notice(text: string) {
  return `<div style="display:flex;height:100%;min-height:200px;align-items:center;justify-content:center;padding:24px;text-align:center;font:14px/1.5 system-ui,sans-serif;color:#78716c;background:repeating-linear-gradient(45deg,#f5f5f4 0 10px,#fafaf9 10px 20px);border:1px dashed #d6d3d1;border-radius:inherit">${esc(text)}</div>`;
}

const FRAME = `style="display:block;width:100%;height:100%;min-height:inherit;border:0" loading="lazy"`;

function inner(kind: BlockKind, attrs: string) {
  if (kind === "map") {
    const address = attr(attrs, "data-address");
    if (isPlaceholder(address)) return notice("Map: add your address in Integrations");
    return `<iframe title="Map: ${esc(address)}" src="https://www.google.com/maps?q=${encodeURIComponent(address)}&output=embed" ${FRAME} referrerpolicy="no-referrer-when-downgrade" allowfullscreen></iframe>`;
  }
  if (kind === "video") {
    const url = attr(attrs, "data-url");
    const yt = youtubeId(url);
    const vm = vimeoId(url);
    const src = yt ? `https://www.youtube-nocookie.com/embed/${yt}` : vm ? `https://player.vimeo.com/video/${vm}` : null;
    if (!src) return notice("Video: add a YouTube or Vimeo link in Integrations");
    return `<div style="position:relative;aspect-ratio:16/9;width:100%"><iframe title="Video" src="${src}" style="position:absolute;inset:0;width:100%;height:100%;border:0" loading="lazy" allow="accelerometer; encrypted-media; gyroscope; picture-in-picture; fullscreen" allowfullscreen></iframe></div>`;
  }
  // booking
  const url = safeHttps(attr(attrs, "data-url"));
  if (!url) return notice("Booking: add your Calendly, Cal.com or booking link in Integrations");
  const host = new URL(url).hostname;
  if (/(^|\.)calendly\.com$/.test(host)) return `<iframe title="Book an appointment" src="${esc(url)}${url.includes("?") ? "&" : "?"}hide_gdpr_banner=1" ${FRAME}></iframe>`;
  if (/(^|\.)(cal\.com|tidycal\.com|as\.me|acuityscheduling\.com|app\.acuityscheduling\.com)$/.test(host)) return `<iframe title="Book an appointment" src="${esc(url)}" ${FRAME}></iframe>`;
  return `<div style="display:flex;height:100%;min-height:160px;align-items:center;justify-content:center"><a href="${esc(url)}" target="_blank" rel="noopener" style="display:inline-block;padding:14px 24px;border-radius:999px;background:var(--color-brand,#1c1917);color:#fff;font:600 15px system-ui,sans-serif;text-decoration:none">Book online</a></div>`;
}

const CONTAINER = /<(div|section|figure|aside)\b([^>]*\bdata-sl-block\s*=\s*["'](map|booking|video)["'][^>]*)>([\s\S]*?)<\/\1>/gi;
const PAY = /<a\b([^>]*\bdata-sl-block\s*=\s*["']pay["'][^>]*)>/gi;

/**
 * Expands every block into its embed (blocks are empty containers; any fallback content
 * inside is replaced). `pay` links keep their markup and get safe link attributes.
 */
export function expandBlocks(html: string) {
  return html
    .replace(CONTAINER, (_m, name: string, attrs: string, kind: BlockKind) => `<${name}${attrs}>${inner(kind, attrs)}</${name}>`)
    .replace(PAY, (tag, attrs: string) => {
      const href = attr(attrs, "href");
      if (isPlaceholder(href)) return tag.replace(/>$/, ` title="Add your payment link in Integrations">`);
      return /\btarget\s*=/.test(attrs) ? tag : tag.replace(/>$/, ` target="_blank" rel="noopener">`);
    });
}

export type BlockRef = { file: string; index: number; kind: BlockKind; value: string };

/** Every block in the site, in document order per file. */
export function listBlocks(files: FileMap): BlockRef[] {
  const out: BlockRef[] = [];
  for (const [file, content] of Object.entries(files)) {
    if (!file.endsWith(".html")) continue;
    let index = 0;
    for (const m of content.matchAll(TAG)) {
      const kind = m[3].toLowerCase() as BlockKind;
      out.push({ file, index: index++, kind, value: attr(m[2], BLOCK_KINDS[kind].field) });
    }
  }
  return out;
}

/** Sets a block's config attribute (address / url / href) in the source. Returns the changed file. */
export function setBlockValue(files: FileMap, ref: { file: string; index: number }, value: string) {
  const source = files[ref.file];
  if (source === undefined) return null;
  let i = 0;
  let changed = false;
  const next = source.replace(TAG, (tag, name: string, attrs: string, kind: BlockKind) => {
    if (i++ !== ref.index) return tag;
    const field = BLOCK_KINDS[kind].field;
    const clean = esc(value.trim());
    const re = new RegExp(`\\s${field}\\s*=\\s*(["']).*?\\1`, "i");
    const nextAttrs = re.test(attrs) ? attrs.replace(re, ` ${field}="${clean}"`) : `${attrs} ${field}="${clean}"`;
    changed = true;
    return `<${name}${nextAttrs}>`;
  });
  return changed ? next : null;
}

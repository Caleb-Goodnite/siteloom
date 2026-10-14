/**
 * The design brief: a compact plan the model writes before building a new site.
 * Every page is then generated in parallel from the same brief, so colors, type,
 * spacing and components stay consistent across pages.
 */
import { DIRECTIONS, directionById, FONTS, googleFontsHref } from "@/lib/ai/design";
import { sanitizePath } from "@/lib/ai/protocol";

export type BriefPage = {
  file: string;
  navLabel: string;
  title: string;
  description: string;
  h1: string;
  sections: { name: string; notes: string }[];
};

export type Brief = {
  siteName: string;
  summary: string;
  direction: string;
  audience: string;
  voice: string;
  primaryCta: { label: string; href: string };
  colors: Record<"brand" | "brandInk" | "accent" | "surface" | "surfaceAlt" | "ink" | "muted", string>;
  fonts: { display: string; body: string };
  recipes: Record<string, string>;
  nav: { label: string; href: string }[];
  pages: BriefPage[];
  footer: string;
  schemaType: string;
  imageStyle: string;
};

const DEFAULT_RECIPES: Record<string, string> = {
  container: "mx-auto w-full max-w-6xl px-5 sm:px-8",
  section: "py-20 sm:py-28",
  eyebrow: "text-xs font-semibold uppercase tracking-[0.18em] text-brand",
  h1: "font-display text-5xl leading-[1.02] tracking-tight text-ink sm:text-7xl",
  h2: "font-display text-3xl leading-tight tracking-tight text-ink sm:text-5xl",
  h3: "text-lg font-semibold text-ink",
  lead: "text-lg leading-relaxed text-muted sm:text-xl",
  body: "text-base leading-relaxed text-muted",
  btnPrimary:
    "inline-flex items-center justify-center gap-2 rounded-full bg-brand px-6 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-brand-ink focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand",
  btnSecondary:
    "inline-flex items-center justify-center gap-2 rounded-full border border-ink/15 px-6 py-3 text-sm font-semibold text-ink transition hover:border-ink/40",
  card: "rounded-3xl border border-ink/10 bg-white p-8 shadow-sm",
  input: "w-full rounded-xl border border-ink/15 bg-white px-4 py-3 text-ink placeholder:text-muted/70 focus:border-brand focus:outline-none focus:ring-4 focus:ring-brand/15",
  link: "font-medium text-brand underline-offset-4 hover:underline",
  badge: "inline-flex items-center gap-1.5 rounded-full bg-brand/10 px-3 py-1 text-xs font-semibold text-brand",
};

const HEX = /^#[0-9a-f]{6}$/i;

function str(v: unknown, fallback = "", max = 400) {
  return typeof v === "string" && v.trim() ? v.trim().slice(0, max) : fallback;
}

/** Validates and repairs a model-written brief. Returns null if it's unusable. */
export function normalizeBrief(raw: unknown, fallbackName: string): Brief | null {
  if (!raw || typeof raw !== "object") return null;
  const r = raw as Record<string, unknown>;
  const direction = directionById(str(r.direction)) ?? DIRECTIONS[0];

  const pages: BriefPage[] = [];
  for (const p of Array.isArray(r.pages) ? r.pages : []) {
    if (!p || typeof p !== "object") continue;
    const page = p as Record<string, unknown>;
    let file = sanitizePath(str(page.file).toLowerCase());
    if (!file || !file.endsWith(".html") || file.includes("/")) continue;
    if (file === "home.html") file = "index.html";
    if (pages.some((x) => x.file === file)) continue;
    pages.push({
      file,
      navLabel: str(page.navLabel, file === "index.html" ? "Home" : file.replace(".html", ""), 40),
      title: str(page.title, fallbackName, 80),
      description: str(page.description, "", 200),
      h1: str(page.h1, "", 140),
      sections: (Array.isArray(page.sections) ? page.sections : [])
        .slice(0, 12)
        .map((s) => (s && typeof s === "object" ? (s as Record<string, unknown>) : {}))
        .map((s) => ({ name: str(s.name, "Section", 60), notes: str(s.notes, "", 500) })),
    });
    if (pages.length >= 8) break;
  }
  if (!pages.length) return null;
  if (!pages.some((p) => p.file === "index.html")) pages[0].file = "index.html";
  pages.sort((a, b) => (a.file === "index.html" ? -1 : b.file === "index.html" ? 1 : 0));

  const c = (r.colors && typeof r.colors === "object" ? r.colors : {}) as Record<string, unknown>;
  const color = (k: string, fb: string) => (typeof c[k] === "string" && HEX.test(c[k] as string) ? (c[k] as string) : fb);
  const f = (r.fonts && typeof r.fonts === "object" ? r.fonts : {}) as Record<string, unknown>;
  const display = FONTS[str(f.display)] ? str(f.display) : direction.fonts.display;
  const body = FONTS[str(f.body)] ? str(f.body) : direction.fonts.body;

  const recipesIn = (r.recipes && typeof r.recipes === "object" ? r.recipes : {}) as Record<string, unknown>;
  const recipes: Record<string, string> = { ...DEFAULT_RECIPES };
  for (const [k, v] of Object.entries(recipesIn)) if (typeof v === "string" && v.length < 400) recipes[k] = v;

  const files = new Set(pages.map((p) => p.file));
  const navIn = Array.isArray(r.nav) ? r.nav : [];
  const nav = navIn
    .map((n) => (n && typeof n === "object" ? (n as Record<string, unknown>) : {}))
    .map((n) => ({ label: str(n.label, "", 40), href: str(n.href, "", 120) }))
    .filter((n) => n.label && n.href && files.has(n.href.split("#")[0] || "index.html"))
    .slice(0, 7);
  const cta = (r.primaryCta && typeof r.primaryCta === "object" ? r.primaryCta : {}) as Record<string, unknown>;

  return {
    siteName: str(r.siteName, fallbackName, 80),
    summary: str(r.summary, "", 400),
    direction: direction.id,
    audience: str(r.audience, "", 300),
    voice: str(r.voice, "", 300),
    primaryCta: { label: str(cta.label, "Get in touch", 40), href: str(cta.href, pages.find((p) => /contact/.test(p.file))?.file ?? "index.html#contact", 120) },
    colors: {
      brand: color("brand", "#1f4d3a"),
      brandInk: color("brandInk", "#143326"),
      accent: color("accent", "#d9784a"),
      surface: color("surface", "#faf8f4"),
      surfaceAlt: color("surfaceAlt", "#f1ece3"),
      ink: color("ink", "#1b1a17"),
      muted: color("muted", "#5f5b54"),
    },
    fonts: { display, body },
    recipes,
    nav: nav.length ? nav : pages.map((p) => ({ label: p.navLabel, href: p.file })).slice(0, 6),
    pages,
    footer: str(r.footer, "", 500),
    schemaType: str(r.schemaType, "LocalBusiness", 60),
    imageStyle: str(r.imageStyle, "", 300),
  };
}

/** The shared <head> partial, written deterministically from the brief (fonts are guaranteed valid). */
export function headPartial(brief: Brief) {
  const href = googleFontsHref([brief.fonts.display, brief.fonts.body]);
  const fam = (name: string) => `"${name}", ${FONTS[name]?.fallback ?? "sans-serif"}`;
  const c = brief.colors;
  return [
    `<link rel="preconnect" href="https://fonts.googleapis.com">`,
    `<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>`,
    href ? `<link href="${href}" rel="stylesheet">` : "",
    `<style type="text/tailwindcss">`,
    `  @theme {`,
    `    --color-brand: ${c.brand};`,
    `    --color-brand-ink: ${c.brandInk};`,
    `    --color-accent: ${c.accent};`,
    `    --color-surface: ${c.surface};`,
    `    --color-surface-alt: ${c.surfaceAlt};`,
    `    --color-ink: ${c.ink};`,
    `    --color-muted: ${c.muted};`,
    `    --font-display: ${fam(brief.fonts.display)};`,
    `    --font-sans: ${fam(brief.fonts.body)};`,
    `  }`,
    `  html { scroll-behavior: smooth; }`,
    `  [x-cloak] { display: none !important; }`,
    `</style>`,
  ]
    .filter(Boolean)
    .join("\n");
}

/** Brief as sent to page writers (drops fields they don't need). */
export function briefForWriters(brief: Brief) {
  const { summary: _summary, ...rest } = brief;
  void _summary;
  return JSON.stringify(rest, null, 1);
}

/** A friendly plan message shown in chat before the pages stream in. */
export function planMessage(brief: Brief) {
  const dir = directionById(brief.direction);
  const pages = brief.pages.map((p) => p.navLabel).join(", ");
  return `${brief.summary || `Here's the plan for **${brief.siteName}**.`}\n\n- **Look:** ${dir?.name ?? "Custom"} (${brief.fonts.display} + ${brief.fonts.body})\n- **Pages:** ${pages}\n- **Main action:** ${brief.primaryCta.label}\n\nBuilding all pages in parallel now…\n\n`;
}

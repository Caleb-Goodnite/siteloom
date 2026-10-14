/**
 * Free visual theming: read and update the brand tokens (colors + fonts) that every page
 * uses, which live in the Tailwind @theme block (normally in partials/head.html).
 */
import { FONTS, googleFontsHref } from "@/lib/ai/design";
import type { FileMap } from "@/lib/types";

export type ThemeState = {
  file: string;
  colors: { name: string; value: string }[];
  fonts: { display: string | null; body: string | null };
};

const COLOR = /--color-([a-z0-9-]+)\s*:\s*(#[0-9a-f]{3,8})\s*;/gi;
const FONT = (v: "display" | "sans") => new RegExp(`--font-${v}\\s*:\\s*["']?([^"',;]+)["']?[^;]*;`, "i");

export function themeFile(files: FileMap) {
  if (files["partials/head.html"]?.includes("@theme")) return "partials/head.html";
  return Object.keys(files).find((p) => p.endsWith(".html") && /@theme\s*\{/.test(files[p])) ?? null;
}

export function readTheme(files: FileMap): ThemeState | null {
  const file = themeFile(files);
  if (!file) return null;
  const src = files[file];
  const block = src.slice(src.indexOf("@theme"));
  const colors = [...block.matchAll(COLOR)].map((m) => ({ name: m[1], value: m[2].toLowerCase() }));
  const display = block.match(FONT("display"))?.[1]?.trim() ?? null;
  const body = block.match(FONT("sans"))?.[1]?.trim() ?? null;
  return { file, colors, fonts: { display, body } };
}

/** Returns the updated theme file contents (or null if nothing changed). */
export function applyTheme(files: FileMap, changes: { colors?: Record<string, string>; display?: string; body?: string }) {
  const theme = readTheme(files);
  if (!theme) return null;
  let src = files[theme.file];

  for (const [name, value] of Object.entries(changes.colors ?? {})) {
    if (!/^#[0-9a-f]{6}$/i.test(value) || !/^[a-z0-9-]+$/.test(name)) continue;
    src = src.replace(new RegExp(`(--color-${name}\\s*:\\s*)#[0-9a-f]{3,8}(\\s*;)`, "i"), `$1${value.toLowerCase()}$2`);
  }

  const setFont = (v: "display" | "sans", name: string | undefined) => {
    if (!name || !FONTS[name]) return;
    const value = `"${name}", ${FONTS[name].fallback}`;
    src = FONT(v).test(src) ? src.replace(FONT(v), `--font-${v}: ${value};`) : src.replace(/@theme\s*\{/, (m) => `${m}\n    --font-${v}: ${value};`);
  };
  setFont("display", changes.display);
  setFont("sans", changes.body);

  const display = changes.display && FONTS[changes.display] ? changes.display : undefined;
  const body = changes.body && FONTS[changes.body] ? changes.body : undefined;
  if (display || body) {
    const families = [display ?? theme.fonts.display, body ?? theme.fonts.body].filter((f): f is string => Boolean(f && FONTS[f]));
    const href = googleFontsHref(families);
    if (href) {
      const link = /<link[^>]+href=["']https:\/\/fonts\.googleapis\.com\/css2\?[^"']*["'][^>]*>/i;
      const tag = `<link href="${href}" rel="stylesheet">`;
      src = link.test(src) ? src.replace(link, tag) : src.replace(/<style\b[^>]*text\/tailwindcss/i, (m) => `${tag}\n${m}`);
    }
  }
  return src === files[theme.file] ? null : { file: theme.file, content: src };
}

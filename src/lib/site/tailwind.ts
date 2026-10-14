import "server-only";
import fs from "node:fs/promises";
import path from "node:path";
import { compile } from "tailwindcss";
import { transform } from "lightningcss";

const TW_FILES: Record<string, string> = {
  tailwindcss: "index.css",
  "tailwindcss/index.css": "index.css",
  "tailwindcss/theme": "theme.css",
  "tailwindcss/theme.css": "theme.css",
  "tailwindcss/preflight": "preflight.css",
  "tailwindcss/preflight.css": "preflight.css",
  "tailwindcss/utilities": "utilities.css",
  "tailwindcss/utilities.css": "utilities.css",
};

const twDir = () => path.join(process.cwd(), "node_modules", "tailwindcss");
const cache = new Map<string, string>();

async function loadStylesheet(id: string) {
  const file = TW_FILES[id] ?? (id.startsWith("./") ? id.slice(2) : null);
  if (!file || !/^(index|theme|preflight|utilities)\.css$/.test(file)) {
    throw new Error(`Unsupported stylesheet import: ${id}`);
  }
  let content = cache.get(file);
  if (!content) {
    content = await fs.readFile(path.join(twDir(), file), "utf8");
    cache.set(file, content);
  }
  return { path: path.join(twDir(), file), base: twDir(), content };
}

/** Collects the bodies of every <style type="text/tailwindcss"> block. */
export function extractTailwindStyles(html: string) {
  const blocks: string[] = [];
  for (const m of html.matchAll(/<style\b[^>]*type\s*=\s*["']text\/tailwindcss["'][^>]*>([\s\S]*?)<\/style>/gi)) {
    blocks.push(m[1]);
  }
  return blocks;
}

export function removeTailwindStyles(html: string) {
  return html.replace(/<style\b[^>]*type\s*=\s*["']text\/tailwindcss["'][^>]*>[\s\S]*?<\/style>\s*/gi, "");
}

/**
 * Over-inclusive candidate extraction: every token that could be a class name.
 * Tailwind ignores tokens that aren't valid utilities, so extra words cost nothing.
 */
export function extractCandidates(contents: string[]) {
  const set = new Set<string>();
  for (const content of contents) {
    for (const token of content.split(/[\s"'`<>]+/)) {
      if (!token || token.length > 120) continue;
      set.add(token);
      const trimmed = token.replace(/^[({,;]+|[)},;:.]+$/g, "");
      if (trimmed && trimmed !== token) set.add(trimmed);
    }
  }
  return [...set];
}

/** Compiles the site's Tailwind into one minified stylesheet. Returns null on failure. */
export async function compileTailwind(themeBlocks: string[], contents: string[]) {
  try {
    // @import inside user blocks is not allowed (only the root import below).
    const userCss = themeBlocks.map((b) => b.replace(/@import[^;]*;/g, "")).join("\n");
    const compiler = await compile(`@import "tailwindcss";\n${userCss}`, { base: twDir(), loadStylesheet });
    const css = compiler.build(extractCandidates(contents));
    const { code } = transform({ filename: "site.css", code: Buffer.from(css), minify: true });
    return code.toString();
  } catch (err) {
    console.error("Tailwind compile failed", err);
    return null;
  }
}

/** Reads the --color-brand token (used to theme the auto-generated social image). */
export function brandColor(themeBlocks: string[]) {
  for (const b of themeBlocks) {
    const m = b.match(/--color-(?:brand|primary)\s*:\s*([^;]+);/);
    if (m && /^#[0-9a-f]{3,8}$/i.test(m[1].trim())) return m[1].trim();
  }
  return null;
}

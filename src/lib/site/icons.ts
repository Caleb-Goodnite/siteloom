import "server-only";
import * as lucide from "lucide";

type IconNode = [string, Record<string, string | number>][];

function toPascal(name: string) {
  return name
    .split("-")
    .filter(Boolean)
    .map((s) => s[0].toUpperCase() + s.slice(1))
    .join("");
}

function lookup(name: string): IconNode | null {
  const key = toPascal(name);
  const icons = lucide.icons as unknown as Record<string, IconNode>;
  const fromModule = (lucide as unknown as Record<string, unknown>)[key];
  return icons[key] ?? (Array.isArray(fromModule) ? (fromModule as IconNode) : null);
}

function escapeAttr(v: string | number) {
  return String(v).replace(/&/g, "&amp;").replace(/"/g, "&quot;");
}

/** Replaces <i data-lucide="name"> with inline SVG so published pages need no icon script. */
export function inlineIcons(html: string) {
  const replace = (match: string, before: string, name: string, after: string) => {
    const node = lookup(name);
    if (!node) return match;
    const attrs = `${before} ${after}`;
    const cls = attrs.match(/\bclass\s*=\s*["']([^"']*)["']/i)?.[1] ?? "";
    const label = attrs.match(/\baria-label\s*=\s*["']([^"']*)["']/i)?.[1];
    const style = attrs.match(/\bstyle\s*=\s*["']([^"']*)["']/i)?.[1];
    const children = node
      .map(([tag, a]) => `<${tag} ${Object.entries(a).map(([k, v]) => `${k}="${escapeAttr(v)}"`).join(" ")}/>`)
      .join("");
    const a11y = label ? `role="img" aria-label="${escapeAttr(label)}"` : `aria-hidden="true"`;
    return `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-${name}${cls ? ` ${escapeAttr(cls)}` : ""}"${style ? ` style="${escapeAttr(style)}"` : ""} ${a11y}>${children}</svg>`;
  };
  return html
    .replace(/<i\b([^>]*?)\bdata-lucide\s*=\s*["']([a-z0-9-]+)["']([^>]*?)>\s*<\/i>/gi, replace)
    .replace(/<i\b([^>]*?)\bdata-lucide\s*=\s*["']([a-z0-9-]+)["']([^>]*?)\/>/gi, replace);
}

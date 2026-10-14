/**
 * [[Placeholders]] mark facts only the owner knows (phone, address, hours…). The owner
 * fills each distinct placeholder once and every occurrence across the site is replaced.
 */
import type { FileMap } from "@/lib/types";

const TOKEN = /\[\[([^\]\n]{1,80})\]\]/g;

export type Placeholder = { key: string; count: number; files: string[] };

/** Common facts first, so the form starts with what matters most. */
const PRIORITY = [/phone/i, /e-?mail/i, /address|street/i, /city|zip|state/i, /hours/i, /price|cost|fee/i];

function rank(key: string) {
  const i = PRIORITY.findIndex((r) => r.test(key));
  return i === -1 ? PRIORITY.length : i;
}

export function listPlaceholders(files: FileMap): Placeholder[] {
  const map = new Map<string, Placeholder>();
  for (const [path, content] of Object.entries(files)) {
    if (!/\.(html|js)$/.test(path)) continue;
    for (const m of content.matchAll(TOKEN)) {
      const key = m[1].trim();
      const entry = map.get(key) ?? { key, count: 0, files: [] };
      entry.count++;
      if (!entry.files.includes(path)) entry.files.push(path);
      map.set(key, entry);
    }
  }
  return [...map.values()].sort((a, b) => rank(a.key) - rank(b.key) || b.count - a.count || a.key.localeCompare(b.key));
}

function escapeHtml(s: string) {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}

/**
 * Replaces filled-in placeholders everywhere. Inside href="tel:…" / "mailto:…" the value is
 * normalized so links keep working (digits and + for phones).
 */
export function fillPlaceholders(files: FileMap, values: Record<string, string>) {
  const changed: Record<string, string> = {};
  for (const [path, content] of Object.entries(files)) {
    if (!/\.(html|js)$/.test(path)) continue;
    let next = content.replace(/(href\s*=\s*["']tel:)\[\[([^\]\n]{1,80})\]\]/gi, (m, pre, key: string) => {
      const v = values[key.trim()]?.trim();
      return v ? `${pre}${v.replace(/[^\d+]/g, "")}` : m;
    });
    next = next.replace(/(href\s*=\s*["']mailto:)\[\[([^\]\n]{1,80})\]\]/gi, (m, pre, key: string) => {
      const v = values[key.trim()]?.trim();
      return v ? `${pre}${encodeURI(v)}` : m;
    });
    next = next.replace(TOKEN, (m, key: string) => {
      const v = values[key.trim()]?.trim();
      return v ? escapeHtml(v) : m;
    });
    if (next !== content) changed[path] = next;
  }
  return changed;
}

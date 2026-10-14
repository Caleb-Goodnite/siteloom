/**
 * The model answers in a small XML-ish protocol mixed with plain prose:
 *
 *   Short reply to the user…
 *   <sl-file path="index.html">…full contents…</sl-file>
 *   <sl-edit path="partials/header.html">
 *   <<<<<<< SEARCH
 *   exact existing lines
 *   =======
 *   replacement lines
 *   >>>>>>> REPLACE
 *   </sl-edit>
 *   <sl-delete path="old.html" />
 *
 * This module parses that (including incomplete, still-streaming output) and applies
 * the operations to a file map. It runs in both the browser (live preview while
 * streaming) and on the server (authoritative result).
 */
import type { FileMap } from "@/lib/types";

export type EditBlock = { search: string; replace: string };

export type Op =
  | { kind: "file"; path: string; content: string; complete: boolean }
  | { kind: "edit"; path: string; blocks: EditBlock[]; complete: boolean }
  | { kind: "delete"; path: string; complete: true };

export type Segment = { kind: "text"; text: string } | Op;

export type Parsed = {
  segments: Segment[];
  ops: Op[];
  /** Prose meant for the user (everything outside file operations). */
  text: string;
};

const OPEN_RE = /<sl-(file|edit|delete)\s+path\s*=\s*"([^"]*)"\s*(\/?)>/g;
const ALLOWED_EXT = /\.(html|css|js|json|txt|xml|md|webmanifest)$/i;

export const LIMITS = { maxFiles: 60, maxFileBytes: 400_000, maxTotalBytes: 3_000_000 };

/** Normalizes a model-provided path; returns null if it's unsafe or unsupported. */
export function sanitizePath(raw: string): string | null {
  const p = raw.trim().replace(/\\/g, "/").replace(/^\.?\/+/, "");
  if (!p || p.length > 120) return null;
  if (p.split("/").some((seg) => seg === ".." || seg === "." || seg === "")) return null;
  if (!/^[a-zA-Z0-9._/-]+$/.test(p)) return null;
  if (!ALLOWED_EXT.test(p)) return null;
  return p;
}

function stripFences(content: string) {
  let c = content.replace(/^\r?\n/, "");
  const fence = c.match(/^```[a-zA-Z0-9-]*\r?\n/);
  if (fence) {
    c = c.slice(fence[0].length);
    c = c.replace(/\r?\n?```\s*$/, "");
  }
  return c.replace(/\r?\n$/, "");
}

/** Removes a trailing partial tag (e.g. "<sl-fi" or "</sl-ed") from streaming text. */
function trimPartialTag(s: string) {
  const lt = s.lastIndexOf("<");
  if (lt === -1) return s;
  const tail = s.slice(lt);
  if (/^<\/?(s(l(-([a-z]*))?)?)?$/.test(tail) || /^<sl-[a-z]+[^>]*$/.test(tail)) return s.slice(0, lt);
  return s;
}

export function parseEditBlocks(body: string): EditBlock[] {
  const blocks: EditBlock[] = [];
  const re = /<{5,}\s*SEARCH[^\n]*\n([\s\S]*?)\n?={5,}[^\S\n]*\n([\s\S]*?)\n?>{5,}\s*REPLACE/g;
  let m: RegExpExecArray | null;
  while ((m = re.exec(body))) blocks.push({ search: m[1], replace: m[2] });
  return blocks;
}

export function parseResponse(input: string): Parsed {
  const segments: Segment[] = [];
  const ops: Op[] = [];
  let cursor = 0;
  OPEN_RE.lastIndex = 0;

  const pushText = (t: string) => {
    if (t.trim()) segments.push({ kind: "text", text: t });
  };

  let m: RegExpExecArray | null;
  while ((m = OPEN_RE.exec(input))) {
    const [tag, kind, rawPath, selfClosing] = m;
    pushText(input.slice(cursor, m.index));
    const path = sanitizePath(rawPath);
    const bodyStart = m.index + tag.length;

    if (kind === "delete" || selfClosing) {
      cursor = bodyStart;
      // tolerate an explicit closing tag after a self-closing delete
      const close = input.slice(cursor).match(/^\s*<\/sl-delete>/);
      if (close) cursor += close[0].length;
      if (path && kind === "delete") {
        const op: Op = { kind: "delete", path, complete: true };
        segments.push(op);
        ops.push(op);
      }
      OPEN_RE.lastIndex = cursor;
      continue;
    }

    const closeTag = `</sl-${kind}>`;
    const closeIdx = input.indexOf(closeTag, bodyStart);
    const complete = closeIdx !== -1;
    const rawBody = complete ? input.slice(bodyStart, closeIdx) : trimPartialTag(input.slice(bodyStart));
    cursor = complete ? closeIdx + closeTag.length : input.length;
    OPEN_RE.lastIndex = cursor;
    if (!path) continue;

    const op: Op =
      kind === "file"
        ? { kind: "file", path, content: stripFences(rawBody), complete }
        : { kind: "edit", path, blocks: parseEditBlocks(rawBody), complete };
    segments.push(op);
    ops.push(op);
    if (!complete) break;
  }

  if (cursor < input.length) pushText(trimPartialTag(input.slice(cursor)));

  const text = segments
    .filter((s): s is { kind: "text"; text: string } => s.kind === "text")
    .map((s) => s.text.trim())
    .join("\n\n")
    .trim();

  return { segments, ops, text };
}

// ─────────────────────────── applying edits ───────────────────────────

export type ApplyFailure = { path: string; reason: string; search?: string };

/** Finds `search` in `content`: exact first, then ignoring per-line indentation/trailing space. */
export function findBlock(content: string, search: string): { start: number; end: number } | null {
  if (!search.trim()) return null;
  const exact = content.indexOf(search);
  if (exact !== -1) return { start: exact, end: exact + search.length };

  const lines = content.split("\n");
  const want = search.split("\n").map((l) => l.trim());
  while (want.length && !want[0]) want.shift();
  while (want.length && !want[want.length - 1]) want.pop();
  if (!want.length) return null;

  const offsets: number[] = [];
  let acc = 0;
  for (const l of lines) {
    offsets.push(acc);
    acc += l.length + 1;
  }
  outer: for (let i = 0; i + want.length <= lines.length; i++) {
    for (let j = 0; j < want.length; j++) {
      if (lines[i + j].trim() !== want[j]) continue outer;
    }
    const last = i + want.length - 1;
    return { start: offsets[i], end: offsets[last] + lines[last].length };
  }
  return null;
}

export function applyEditBlocks(content: string, blocks: EditBlock[], path: string) {
  let out = content;
  const failures: ApplyFailure[] = [];
  for (const b of blocks) {
    const hit = findBlock(out, b.search);
    if (!hit) {
      failures.push({ path, reason: "search text not found", search: b.search });
      continue;
    }
    out = out.slice(0, hit.start) + b.replace + out.slice(hit.end);
  }
  return { content: out, failures };
}

export function applyOps(files: FileMap, ops: Op[], opts: { includeIncomplete?: boolean } = {}) {
  const next: FileMap = { ...files };
  const changed = new Set<string>();
  const failures: ApplyFailure[] = [];

  for (const op of ops) {
    if (!op.complete && !opts.includeIncomplete) continue;
    if (op.kind === "file") {
      if (op.content.length > LIMITS.maxFileBytes) {
        failures.push({ path: op.path, reason: "file too large" });
        continue;
      }
      next[op.path] = op.content;
      changed.add(op.path);
    } else if (op.kind === "delete") {
      if (op.path === "index.html") continue;
      if (op.path in next) {
        delete next[op.path];
        changed.add(op.path);
      }
    } else {
      const current = next[op.path];
      if (current === undefined) {
        failures.push({ path: op.path, reason: "file does not exist" });
        continue;
      }
      if (!op.complete) continue; // never apply half an edit
      const res = applyEditBlocks(current, op.blocks, op.path);
      failures.push(...res.failures);
      if (res.content !== current) {
        next[op.path] = res.content;
        changed.add(op.path);
      }
    }
  }

  const paths = Object.keys(next);
  if (paths.length > LIMITS.maxFiles) failures.push({ path: "*", reason: `too many files (max ${LIMITS.maxFiles})` });
  const total = paths.reduce((n, p) => n + next[p].length, 0);
  if (total > LIMITS.maxTotalBytes) failures.push({ path: "*", reason: "site is too large" });

  return { files: next, changed: [...changed], failures };
}

/** Pages are top-level .html files; partials and assets are not pages. */
export function listPages(files: FileMap) {
  return Object.keys(files)
    .filter((p) => p.endsWith(".html") && !p.includes("/"))
    .sort((a, b) => (a === "index.html" ? -1 : b === "index.html" ? 1 : a.localeCompare(b)));
}

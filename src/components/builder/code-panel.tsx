"use client";

import dynamic from "next/dynamic";
import { useEffect, useMemo, useState } from "react";
import { FileCode2, FilePlus2, Info, Save, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/field";
import { Dialog } from "@/components/ui/misc";
import { sanitizePath } from "@/lib/ai/protocol";
import type { FileMap } from "@/lib/types";
import { cn } from "@/lib/utils";

const CodeEditor = dynamic(() => import("./code-editor"), {
  ssr: false,
  loading: () => <div className="p-4 text-sm text-muted">Loading editor…</div>,
});

function groupOf(path: string) {
  if (path.startsWith("partials/")) return "Shared parts";
  if (!path.includes("/") && path.endsWith(".html")) return "Pages";
  return "Assets & other";
}

export function CodePanel({ files, onSave, disabled }: { files: FileMap; onSave: (changes: Record<string, string | null>) => Promise<boolean>; disabled: boolean }) {
  const paths = useMemo(() => Object.keys(files).sort(), [files]);
  const [chosen, setActive] = useState<string | null>(null);
  // Fall back to the home page when nothing (or a since-deleted file) is selected.
  const active = chosen && files[chosen] !== undefined ? chosen : paths.includes("index.html") ? "index.html" : (paths[0] ?? null);
  const [drafts, setDrafts] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);
  const [newOpen, setNewOpen] = useState(false);
  const [newPath, setNewPath] = useState("");

  const dirty = Object.keys(drafts).filter((p) => drafts[p] !== files[p]);
  const value = active ? (drafts[active] ?? files[active] ?? "") : "";

  async function save() {
    if (!dirty.length) return;
    setSaving(true);
    const ok = await onSave(Object.fromEntries(dirty.map((p) => [p, drafts[p]])));
    setSaving(false);
    if (ok) {
      setDrafts({});
      toast.success("Saved · free");
    }
  }

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "s") {
        e.preventDefault();
        void save();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  });

  const groups = ["Pages", "Shared parts", "Assets & other"].map((g) => ({ name: g, items: paths.filter((p) => groupOf(p) === g) }));

  return (
    <div className="flex min-h-0 flex-1">
      <div className="scrollbar-thin hidden w-56 shrink-0 overflow-y-auto border-r border-line bg-card p-2 sm:block">
        {groups.map(
          (g) =>
            g.items.length > 0 && (
              <div key={g.name} className="mb-3">
                <p className="px-2 py-1 text-[11px] font-semibold uppercase tracking-wider text-muted">{g.name}</p>
                {g.items.map((p) => (
                  <button
                    key={p}
                    onClick={() => setActive(p)}
                    className={cn(
                      "flex w-full items-center gap-2 rounded-lg px-2 py-1.5 text-left font-mono text-xs",
                      active === p ? "bg-paper-2 text-ink" : "text-ink-2 hover:bg-paper",
                    )}
                  >
                    <FileCode2 className="size-3.5 shrink-0 text-muted" />
                    <span className="truncate">{p.replace(/^partials\//, "")}</span>
                    {drafts[p] !== undefined && drafts[p] !== files[p] && <span className="ml-auto size-1.5 rounded-full bg-accent" />}
                  </button>
                ))}
              </div>
            ),
        )}
        <button onClick={() => setNewOpen(true)} className="flex w-full items-center gap-2 rounded-lg px-2 py-1.5 text-xs text-ink-2 hover:bg-paper">
          <FilePlus2 className="size-3.5" /> New file
        </button>
      </div>

      <div className="flex min-w-0 flex-1 flex-col">
        <div className="flex h-11 shrink-0 items-center gap-2 border-b border-line bg-card px-3">
          <select
            className="rounded-lg border border-line bg-card px-2 py-1 font-mono text-xs sm:hidden"
            value={active ?? ""}
            onChange={(e) => setActive(e.target.value)}
            aria-label="File"
          >
            {paths.map((p) => (
              <option key={p}>{p}</option>
            ))}
          </select>
          <span className="hidden font-mono text-xs text-ink sm:inline">{active}</span>
          <span className="hidden items-center gap-1 text-[11px] text-muted lg:flex">
            <Info className="size-3" /> Tailwind, Alpine.js and Lucide icons are added automatically
          </span>
          <div className="ml-auto flex items-center gap-1.5">
            {active && active !== "index.html" && (
              <Button
                size="sm"
                variant="ghost"
                disabled={disabled}
                onClick={async () => {
                  if (!confirm(`Delete ${active}?`)) return;
                  if (await onSave({ [active]: null })) toast.success(`Deleted ${active}`);
                }}
                aria-label="Delete file"
              >
                <Trash2 className="size-3.5" />
              </Button>
            )}
            <Button size="sm" onClick={save} loading={saving} disabled={!dirty.length || disabled}>
              <Save className="size-3.5" /> Save{dirty.length > 1 ? ` ${dirty.length} files` : ""}
            </Button>
          </div>
        </div>
        <div className="min-h-0 flex-1 overflow-hidden bg-white">
          {active ? (
            <CodeEditor
              path={active}
              value={value}
              readOnly={disabled}
              onChange={(v) => setDrafts((d) => ({ ...d, [active]: v }))}
            />
          ) : (
            <p className="p-6 text-sm text-muted">No files yet.</p>
          )}
        </div>
      </div>

      <Dialog open={newOpen} onOpenChange={setNewOpen} title="New file" description="Pages are top-level .html files (e.g. faq.html). Shared parts go in partials/.">
        <form
          className="space-y-4"
          onSubmit={async (e) => {
            e.preventDefault();
            const path = sanitizePath(newPath);
            if (!path) return toast.error("Use a name like faq.html, partials/cta.html or assets/site.js");
            if (files[path] !== undefined) return toast.error("That file already exists");
            const starter = path.endsWith(".html") && !path.includes("/")
              ? `<!doctype html>\n<html lang="en">\n<head>\n  <meta charset="utf-8">\n  <meta name="viewport" content="width=device-width, initial-scale=1">\n  <title>New page</title>\n  <meta name="description" content="">\n  <!-- @include partials/head.html -->\n</head>\n<body>\n  <!-- @include partials/header.html -->\n  <main id="main">\n    <h1>New page</h1>\n  </main>\n  <!-- @include partials/footer.html -->\n</body>\n</html>\n`
              : "";
            if (await onSave({ [path]: starter })) {
              setActive(path);
              setNewOpen(false);
              setNewPath("");
            }
          }}
        >
          <Input value={newPath} onChange={(e) => setNewPath(e.target.value)} placeholder="faq.html" autoFocus className="font-mono" />
          <div className="flex justify-end">
            <Button type="submit">Create</Button>
          </div>
        </form>
      </Dialog>
    </div>
  );
}

"use client";

import { useEffect, useState } from "react";
import { Download, Inbox, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import type { FormSubmission } from "@/lib/types";
import { cn, formatRelative } from "@/lib/utils";

function toCsv(rows: FormSubmission[]) {
  const keys = [...new Set(rows.flatMap((r) => Object.keys(r.data)))];
  const esc = (v: string) => `"${v.replace(/"/g, '""')}"`;
  const header = ["submitted_at", "form", "page", ...keys].map(esc).join(",");
  const lines = rows.map((r) => [r.created_at, r.form_name, r.page ?? "", ...keys.map((k) => r.data[k] ?? "")].map((v) => esc(String(v))).join(","));
  return [header, ...lines].join("\n");
}

export function FormsPanel({ projectId, published }: { projectId: string; published: boolean }) {
  const [rows, setRows] = useState<FormSubmission[] | null>(null);
  const [open, setOpen] = useState<string | null>(null);

  useEffect(() => {
    fetch(`/api/projects/${projectId}/forms`)
      .then(async (res) => {
        const data = await res.json();
        if (res.ok) setRows(data.submissions);
        else toast.error(data.error ?? "Couldn't load submissions");
      })
      .catch(() => setRows([]));
  }, [projectId]);

  async function patch(ids: string[], read: boolean) {
    setRows((r) => r?.map((x) => (ids.includes(x.id) ? { ...x, read } : x)) ?? r);
    await fetch(`/api/projects/${projectId}/forms`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ ids, read }) });
  }

  async function remove(id: string) {
    setRows((r) => r?.filter((x) => x.id !== id) ?? r);
    await fetch(`/api/projects/${projectId}/forms`, { method: "DELETE", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ ids: [id] }) });
  }

  async function removeAll() {
    if (!window.confirm("Delete every form submission for this site? This can't be undone.")) return;
    const res = await fetch(`/api/projects/${projectId}/forms`, { method: "DELETE", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ all: true }) });
    if (res.ok) {
      setRows([]);
      toast.success("All submissions deleted");
    } else toast.error("Couldn't delete submissions");
  }

  if (!rows) {
    return (
      <div className="flex flex-1 items-center justify-center">
        <Spinner className="text-muted" />
      </div>
    );
  }

  return (
    <div className="scrollbar-thin min-h-0 flex-1 overflow-y-auto">
      <div className="mx-auto max-w-3xl p-6">
        <div className="flex items-center justify-between gap-3">
          <div>
            <h2 className="text-lg font-semibold text-ink">Form submissions</h2>
            <p className="text-sm text-ink-2">Every form on your site delivers here. Paid plans also email each one to you. Submissions are deleted automatically after 12 months.</p>
          </div>
          {rows.length > 0 && (
            <div className="flex shrink-0 gap-2">
              <Button size="sm" variant="outline" onClick={removeAll}>
                <Trash2 className="size-3.5" /> Delete all
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() => {
                  const blob = new Blob([toCsv(rows)], { type: "text/csv" });
                  const a = document.createElement("a");
                  a.href = URL.createObjectURL(blob);
                  a.download = "submissions.csv";
                  a.click();
                  URL.revokeObjectURL(a.href);
                }}
              >
                <Download className="size-3.5" /> CSV
              </Button>
            </div>
          )}
        </div>

        {rows.length === 0 ? (
          <div className="mt-8 rounded-2xl border border-dashed border-line-2 p-10 text-center">
            <Inbox className="mx-auto size-6 text-muted" />
            <p className="mt-3 font-medium text-ink">No submissions yet</p>
            <p className="mx-auto mt-1 max-w-sm text-sm text-ink-2">
              {published
                ? "When visitors fill in a form on your live site, it shows up here."
                : "Forms work as soon as you publish. Spam protection is built in. Try it on your live site."}
            </p>
          </div>
        ) : (
          <ul className="mt-6 divide-y divide-line rounded-2xl border border-line bg-card">
            {rows.map((r) => {
              const preview = Object.values(r.data).join(" · ");
              const isOpen = open === r.id;
              return (
                <li key={r.id}>
                  <button
                    onClick={() => {
                      setOpen(isOpen ? null : r.id);
                      if (!r.read) void patch([r.id], true);
                    }}
                    className="flex w-full items-center gap-3 px-4 py-3 text-left"
                  >
                    <span className={cn("size-2 shrink-0 rounded-full", r.read ? "bg-transparent" : "bg-accent")} />
                    <span className="w-28 shrink-0 truncate text-sm font-medium text-ink">{r.form_name}</span>
                    <span className="min-w-0 flex-1 truncate text-sm text-ink-2">{preview}</span>
                    <span className="shrink-0 text-xs text-muted">{formatRelative(r.created_at)}</span>
                  </button>
                  {isOpen && (
                    <div className="border-t border-line bg-paper/50 px-4 py-3">
                      <dl className="grid gap-x-4 gap-y-2 text-sm sm:grid-cols-[140px_1fr]">
                        {Object.entries(r.data).map(([k, v]) => (
                          <div key={k} className="contents">
                            <dt className="text-muted">{k}</dt>
                            <dd className="whitespace-pre-wrap break-words text-ink">{v}</dd>
                          </div>
                        ))}
                        {r.page && (
                          <div className="contents">
                            <dt className="text-muted">page</dt>
                            <dd className="font-mono text-xs text-ink-2">{r.page}</dd>
                          </div>
                        )}
                      </dl>
                      <div className="mt-3 flex gap-2">
                        <Button size="sm" variant="ghost" onClick={() => patch([r.id], false)}>
                          Mark unread
                        </Button>
                        <Button size="sm" variant="ghost" className="text-danger" onClick={() => remove(r.id)}>
                          <Trash2 className="size-3.5" /> Delete
                        </Button>
                      </div>
                    </div>
                  )}
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </div>
  );
}

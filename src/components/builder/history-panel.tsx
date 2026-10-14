"use client";

import { useState } from "react";
import { Bot, Eye, ImageIcon, PencilLine, RotateCcw, Type } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import type { FileMap, ProjectVersion } from "@/lib/types";
import { cn, formatRelative } from "@/lib/utils";
import type { ApiErrorBody } from "./types";

const ICONS = { ai: Bot, manual: PencilLine, restore: RotateCcw, images: ImageIcon, "text-edit": Type } as const;

export function HistoryPanel(props: {
  projectId: string;
  versions: ProjectVersion[];
  viewingId: string | null;
  onView: (v: { id: string; label: string; files: FileMap }) => void;
  onRestored: (files: FileMap, version: ProjectVersion) => void;
  onError: (status: number, body: ApiErrorBody) => void;
}) {
  const [busy, setBusy] = useState<string | null>(null);

  async function view(v: ProjectVersion) {
    setBusy(`view:${v.id}`);
    const res = await fetch(`/api/projects/${props.projectId}/versions/${v.id}`);
    const data = await res.json();
    setBusy(null);
    if (!res.ok) return props.onError(res.status, data);
    props.onView({ id: v.id, label: v.label, files: data.files });
  }

  async function restore(v: ProjectVersion) {
    setBusy(`restore:${v.id}`);
    const res = await fetch(`/api/projects/${props.projectId}/versions/${v.id}`, { method: "POST" });
    const data = await res.json();
    setBusy(null);
    if (!res.ok) return props.onError(res.status, data);
    props.onRestored(data.files, data.version);
    toast.success("Restored. You can undo this from history too.");
  }

  return (
    <div className="scrollbar-thin min-h-0 flex-1 overflow-y-auto">
      <div className="mx-auto max-w-2xl p-6">
        <h2 className="text-lg font-semibold text-ink">Version history</h2>
        <p className="text-sm text-ink-2">Every change is saved. Preview or restore any version for free.</p>
        {props.versions.length === 0 ? (
          <p className="mt-6 text-sm text-muted">No versions yet.</p>
        ) : (
          <ol className="relative mt-6 space-y-1 border-l border-line pl-5">
            {props.versions.map((v, i) => {
              const Icon = ICONS[v.source] ?? Bot;
              return (
                <li key={v.id} className={cn("relative rounded-xl px-3 py-2.5", props.viewingId === v.id && "bg-amber-50")}>
                  <span className="absolute -left-[29px] top-3 flex size-4 items-center justify-center rounded-full border border-line bg-card">
                    <Icon className="size-2.5 text-muted" />
                  </span>
                  <div className="flex items-center gap-3">
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm text-ink">{v.label}</p>
                      <p className="text-xs text-muted">
                        {formatRelative(v.created_at)}
                        {i === 0 && " · current"}
                      </p>
                    </div>
                    <Button size="sm" variant="ghost" loading={busy === `view:${v.id}`} onClick={() => view(v)} aria-label="Preview version">
                      <Eye className="size-3.5" />
                    </Button>
                    {i > 0 && (
                      <Button size="sm" variant="outline" loading={busy === `restore:${v.id}`} onClick={() => restore(v)}>
                        Restore
                      </Button>
                    )}
                  </div>
                </li>
              );
            })}
          </ol>
        )}
      </div>
    </div>
  );
}

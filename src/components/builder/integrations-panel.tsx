"use client";

import { useMemo, useState } from "react";
import { CalendarDays, CreditCard, MapPin, PlayCircle, Sparkles } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Hint, Input, Label } from "@/components/ui/field";
import { BLOCK_KINDS, listBlocks, setBlockValue, type BlockKind } from "@/lib/site/blocks";
import type { FileMap } from "@/lib/types";
import type { ApiErrorBody, BuilderProject } from "./types";

const ICONS: Record<BlockKind, typeof MapPin> = { map: MapPin, booking: CalendarDays, video: PlayCircle, pay: CreditCard };

const SUGGESTIONS: { kind: BlockKind; prompt: string }[] = [
  { kind: "map", prompt: "Add a Google Map of our location to the contact page" },
  { kind: "booking", prompt: "Add an online booking calendar (Calendly) to the contact page" },
  { kind: "pay", prompt: "Add a 'Pay deposit' button that uses a Stripe Payment Link" },
  { kind: "video", prompt: "Add a YouTube video section to the home page" },
];

export function IntegrationsPanel({
  project,
  files,
  generating,
  onSaveFiles,
  onSaved,
  onAsk,
  onError,
}: {
  project: BuilderProject;
  files: FileMap;
  generating: boolean;
  onSaveFiles: (changes: Record<string, string>) => Promise<boolean>;
  onSaved: (p: Partial<BuilderProject>) => void;
  onAsk: (prompt: string) => void;
  onError: (status: number, body: ApiErrorBody) => void;
}) {
  const blocks = useMemo(() => listBlocks(files), [files]);
  const [values, setValues] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);
  const [gaId, setGaId] = useState(project.settings?.gaId ?? "");
  const [pixel, setPixel] = useState(project.settings?.metaPixelId ?? "");
  const [savingIds, setSavingIds] = useState(false);
  const key = (b: { file: string; index: number }) => `${b.file}#${b.index}`;
  const dirty = blocks.filter((b) => values[key(b)] !== undefined && values[key(b)] !== b.value);

  async function saveBlocks() {
    let next = { ...files };
    const changes: Record<string, string> = {};
    for (const b of dirty) {
      const updated = setBlockValue(next, b, values[key(b)]);
      if (updated) {
        next = { ...next, [b.file]: updated };
        changes[b.file] = updated;
      }
    }
    setSaving(true);
    const ok = await onSaveFiles(changes);
    setSaving(false);
    if (ok) {
      setValues({});
      toast.success("Integrations updated · free");
    }
  }

  async function saveIds(e: React.FormEvent) {
    e.preventDefault();
    setSavingIds(true);
    const res = await fetch(`/api/projects/${project.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ settings: { gaId: gaId.trim(), metaPixelId: pixel.trim() } }),
    });
    const data = await res.json();
    setSavingIds(false);
    if (!res.ok) return onError(res.status, data);
    onSaved({ settings: data.project.settings });
    toast.success(project.published ? "Saved. Republish to add tracking to the live site." : "Saved");
  }

  return (
    <div className="scrollbar-thin min-h-0 flex-1 overflow-y-auto">
      <div className="mx-auto max-w-2xl space-y-8 p-6">
        <section>
          <h2 className="text-lg font-semibold text-ink">Integrations</h2>
          <p className="text-sm text-ink-2">Maps, booking calendars, payment buttons and videos on your site. Changing a link here is free.</p>

          {blocks.length === 0 ? (
            <div className="mt-5 rounded-2xl border border-dashed border-line-2 p-6 text-center text-sm text-ink-2">
              No integrations yet. Ask for one in the chat, or pick a suggestion below.
            </div>
          ) : (
            <ul className="mt-5 space-y-3">
              {blocks.map((b) => {
                const meta = BLOCK_KINDS[b.kind];
                const Icon = ICONS[b.kind];
                const v = values[key(b)] ?? b.value;
                return (
                  <li key={key(b)} className="rounded-2xl border border-line bg-card p-4">
                    <Label htmlFor={key(b)} className="flex items-center gap-2">
                      <Icon className="size-4 text-accent" /> {meta.label}
                      <span className="font-mono text-[11px] font-normal text-muted">{b.file}</span>
                    </Label>
                    <Input id={key(b)} value={/\[\[.*\]\]/.test(v) ? "" : v} placeholder={meta.placeholder} onChange={(e) => setValues((x) => ({ ...x, [key(b)]: e.target.value }))} className="h-10" />
                    <Hint>{meta.help}</Hint>
                  </li>
                );
              })}
            </ul>
          )}
          {dirty.length > 0 && (
            <Button className="mt-4" loading={saving} disabled={generating} onClick={saveBlocks}>
              Save {dirty.length} change{dirty.length > 1 ? "s" : ""}
            </Button>
          )}

          <div className="mt-6 flex flex-wrap gap-2">
            {SUGGESTIONS.map((s) => {
              const Icon = ICONS[s.kind];
              return (
                <button
                  key={s.kind}
                  onClick={() => onAsk(s.prompt)}
                  disabled={generating}
                  className="inline-flex items-center gap-1.5 rounded-full border border-line bg-card px-3 py-1.5 text-xs text-ink-2 hover:border-line-2 hover:text-ink disabled:opacity-50"
                >
                  <Sparkles className="size-3 text-accent" />
                  <Icon className="size-3.5" /> {s.prompt}
                </button>
              );
            })}
          </div>
        </section>

        <form onSubmit={saveIds} className="rounded-2xl border border-line bg-card p-5">
          <h3 className="font-semibold text-ink">Your own tracking (optional)</h3>
          <p className="mt-1 text-sm text-ink-2">Built-in, cookie-free analytics are always on. Add these if you also use Google Analytics or run Meta ads.</p>
          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            <div>
              <Label htmlFor="ga">Google Analytics 4 ID</Label>
              <Input id="ga" value={gaId} onChange={(e) => setGaId(e.target.value.toUpperCase())} placeholder="G-XXXXXXXXXX" className="h-10" />
            </div>
            <div>
              <Label htmlFor="pixel">Meta Pixel ID</Label>
              <Input id="pixel" value={pixel} onChange={(e) => setPixel(e.target.value.replace(/\D/g, ""))} placeholder="123456789012345" className="h-10" />
            </div>
          </div>
          <Hint>If you add these, your site may need a cookie notice in some regions (EU/UK).</Hint>
          <Button type="submit" className="mt-4" variant="outline" loading={savingIds}>
            Save tracking IDs
          </Button>
        </form>
      </div>
    </div>
  );
}

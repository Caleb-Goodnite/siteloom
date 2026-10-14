"use client";

import { useMemo, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Hint, Label } from "@/components/ui/field";
import { DIRECTIONS, fontNames } from "@/lib/ai/design";
import { applyTheme, readTheme } from "@/lib/site/theme";
import type { FileMap } from "@/lib/types";

const LABELS: Record<string, string> = {
  brand: "Brand",
  "brand-ink": "Brand (dark)",
  accent: "Accent",
  surface: "Background",
  "surface-alt": "Alt background",
  ink: "Text",
  muted: "Secondary text",
};

/** Free visual theming: colors and fonts update every page instantly, no AI needed. */
export function DesignPanel({ files, generating, onSaveFiles }: { files: FileMap; generating: boolean; onSaveFiles: (c: Record<string, string>) => Promise<boolean> }) {
  const theme = useMemo(() => readTheme(files), [files]);
  const [colors, setColors] = useState<Record<string, string>>({});
  const [display, setDisplay] = useState<string>("");
  const [body, setBody] = useState<string>("");
  const [saving, setSaving] = useState(false);

  if (!theme) {
    return <p className="p-8 text-sm text-muted">Build your site first. Its colors and fonts will appear here for free editing.</p>;
  }
  const changed = Object.keys(colors).length > 0 || display || body;

  async function save() {
    const next = applyTheme(files, { colors, display: display || undefined, body: body || undefined });
    if (!next) return;
    setSaving(true);
    const ok = await onSaveFiles({ [next.file]: next.content });
    setSaving(false);
    if (ok) {
      setColors({});
      setDisplay("");
      setBody("");
      toast.success("Design updated · free");
    }
  }

  return (
    <div className="scrollbar-thin min-h-0 flex-1 overflow-y-auto">
      <div className="mx-auto max-w-2xl space-y-8 p-6">
        <div>
          <h2 className="text-lg font-semibold text-ink">Design</h2>
          <p className="text-sm text-ink-2">Change colors and fonts across every page. Free and instant. For layout changes, ask in the chat.</p>
        </div>

        <section>
          <h3 className="text-sm font-semibold text-ink">Colors</h3>
          <div className="mt-3 grid gap-3 sm:grid-cols-2">
            {theme.colors.map((c) => {
              const v = colors[c.name] ?? c.value;
              return (
                <label key={c.name} className="flex items-center gap-3 rounded-xl border border-line bg-card p-3">
                  <input
                    type="color"
                    value={v.length === 4 ? `#${v[1]}${v[1]}${v[2]}${v[2]}${v[3]}${v[3]}` : v.slice(0, 7)}
                    onChange={(e) => setColors((x) => ({ ...x, [c.name]: e.target.value }))}
                    className="size-9 cursor-pointer rounded-lg border border-line bg-transparent"
                    aria-label={`${LABELS[c.name] ?? c.name} color`}
                  />
                  <span className="min-w-0">
                    <span className="block text-sm font-medium text-ink">{LABELS[c.name] ?? c.name}</span>
                    <span className="font-mono text-xs text-muted">{v}</span>
                  </span>
                </label>
              );
            })}
          </div>
          {theme.colors.length === 0 && <Hint>No color tokens found in this site&apos;s theme.</Hint>}
        </section>

        <section className="grid gap-4 sm:grid-cols-2">
          {(
            [
              ["Heading font", display || theme.fonts.display || "", setDisplay, fontNames("display")],
              ["Body font", body || theme.fonts.body || "", setBody, fontNames("body")],
            ] as const
          ).map(([label, value, set, options]) => (
            <div key={label}>
              <Label>{label}</Label>
              <select
                value={value}
                onChange={(e) => set(e.target.value)}
                className="h-10 w-full rounded-xl border border-line-2 bg-card px-3 text-sm text-ink"
                style={{ fontFamily: value ? `"${value}"` : undefined }}
              >
                {!options.includes(value as never) && value && <option value={value}>{value}</option>}
                {options.map((f) => (
                  <option key={f} value={f}>
                    {f}
                  </option>
                ))}
              </select>
            </div>
          ))}
        </section>

        <section>
          <h3 className="text-sm font-semibold text-ink">Font pairings that work</h3>
          <div className="mt-3 flex flex-wrap gap-2">
            {DIRECTIONS.map((d) => (
              <button
                key={d.id}
                onClick={() => {
                  setDisplay(d.fonts.display);
                  setBody(d.fonts.body);
                }}
                className="rounded-full border border-line bg-card px-3 py-1.5 text-xs text-ink-2 hover:border-line-2 hover:text-ink"
              >
                {d.name}: {d.fonts.display} + {d.fonts.body}
              </button>
            ))}
          </div>
        </section>

        <Button onClick={save} loading={saving} disabled={!changed || generating}>
          Apply to all pages
        </Button>
      </div>
    </div>
  );
}

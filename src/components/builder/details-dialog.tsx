"use client";

import { useMemo, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/field";
import { Dialog } from "@/components/ui/misc";
import { fillPlaceholders, listPlaceholders } from "@/lib/site/placeholders";
import type { FileMap } from "@/lib/types";

/** One field per distinct [[placeholder]]; saving fills every occurrence across the site (free). */
export function DetailsDialog({
  open,
  onOpenChange,
  files,
  onSave,
}: {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  files: FileMap;
  onSave: (changes: Record<string, string>) => Promise<boolean>;
}) {
  const placeholders = useMemo(() => listPlaceholders(files), [files]);
  const [values, setValues] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);
  const filled = Object.values(values).filter((v) => v.trim()).length;

  async function save() {
    const changes = fillPlaceholders(files, values);
    if (!Object.keys(changes).length) return onOpenChange(false);
    setSaving(true);
    const ok = await onSave(changes);
    setSaving(false);
    if (ok) {
      toast.success(`Filled ${filled} detail${filled > 1 ? "s" : ""} across your site · free`);
      setValues({});
      onOpenChange(false);
    }
  }

  return (
    <Dialog
      open={open}
      onOpenChange={onOpenChange}
      title="Fill in your details"
      description="Each one is used everywhere it appears on your site. Leave anything blank to fill it later."
      className="max-w-lg"
    >
      {placeholders.length === 0 ? (
        <p className="text-sm text-ink-2">All details are filled in. 🎉</p>
      ) : (
        <form
          className="space-y-3"
          onSubmit={(e) => {
            e.preventDefault();
            void save();
          }}
        >
          <div className="scrollbar-thin -mx-1 max-h-[55dvh] space-y-3 overflow-y-auto px-1">
            {placeholders.map((p, i) => (
              <label key={p.key} className="block">
                <span className="mb-1 flex items-baseline justify-between gap-3 text-sm font-medium text-ink">
                  {p.key}
                  <span className="text-xs font-normal text-muted">
                    used {p.count}× {p.files.length > 1 ? `on ${p.files.length} files` : ""}
                  </span>
                </span>
                {p.count > 2 && /^(price|name|title|role|cost|amount)$/i.test(p.key) && (
                  <span className="mb-1 block text-xs text-warn">
                    All {p.count} copies get this value. For different values, use Edit text in the preview instead.
                  </span>
                )}
                <Input
                  value={values[p.key] ?? ""}
                  onChange={(e) => setValues((v) => ({ ...v, [p.key]: e.target.value.replace(/\[\[|\]\]/g, "") }))}
                  autoFocus={i === 0}
                  maxLength={300}
                  className="h-10"
                />
              </label>
            ))}
          </div>
          <div className="flex items-center justify-between gap-3 border-t border-line pt-4">
            <span className="text-xs text-muted">
              {filled} of {placeholders.length} filled
            </span>
            <Button type="submit" loading={saving} disabled={!filled}>
              Save details
            </Button>
          </div>
        </form>
      )}
    </Dialog>
  );
}

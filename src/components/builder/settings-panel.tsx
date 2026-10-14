"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Hint, Input, Label, Textarea } from "@/components/ui/field";
import type { ApiErrorBody, BuilderProject } from "./types";

export function SettingsPanel({
  project,
  onSaved,
  onError,
}: {
  project: BuilderProject;
  onSaved: (p: Partial<BuilderProject>) => void;
  onError: (status: number, body: ApiErrorBody) => void;
}) {
  const [name, setName] = useState(project.name);
  const [siteName, setSiteName] = useState(project.settings?.siteName ?? project.name);
  const [description, setDescription] = useState(project.settings?.description ?? "");
  const [lang, setLang] = useState(project.settings?.lang ?? "en");
  const [formEmail, setFormEmail] = useState(project.settings?.formEmail ?? "");
  const [gsc, setGsc] = useState(project.settings?.googleVerification ?? "");
  const [busy, setBusy] = useState(false);

  async function save(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    const res = await fetch(`/api/projects/${project.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name,
        settings: { siteName, description, lang, formEmail, googleVerification: gsc.replace(/.*content="([^"]+)".*/, "$1").trim() },
      }),
    });
    const data = await res.json();
    setBusy(false);
    if (!res.ok) return onError(res.status, data);
    onSaved({ name: data.project.name, settings: data.project.settings });
    toast.success(project.published ? "Saved. Republish to apply to the live site." : "Saved");
  }

  return (
    <div className="scrollbar-thin min-h-0 flex-1 overflow-y-auto">
      <form onSubmit={save} className="mx-auto max-w-2xl space-y-5 p-6">
        <div>
          <h2 className="text-lg font-semibold text-ink">Site settings</h2>
          <p className="text-sm text-ink-2">Used for social cards, the sitemap, llms.txt and form emails.</p>
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <Label htmlFor="pname">Project name</Label>
            <Input id="pname" value={name} onChange={(e) => setName(e.target.value)} maxLength={60} />
          </div>
          <div>
            <Label htmlFor="sname">Site / business name</Label>
            <Input id="sname" value={siteName} onChange={(e) => setSiteName(e.target.value)} maxLength={80} />
          </div>
        </div>
        <div>
          <Label htmlFor="desc">Short description</Label>
          <Textarea id="desc" rows={2} value={description} onChange={(e) => setDescription(e.target.value)} maxLength={300} />
          <Hint>One or two sentences about the business. Shown in the showcase and to AI assistants via llms.txt.</Hint>
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <Label htmlFor="lang">Language code</Label>
            <Input id="lang" value={lang} onChange={(e) => setLang(e.target.value)} maxLength={10} placeholder="en" />
          </div>
          <div>
            <Label htmlFor="femail">Send form submissions to</Label>
            <Input id="femail" type="email" value={formEmail} onChange={(e) => setFormEmail(e.target.value)} placeholder="Your account email" />
          </div>
        </div>
        <div>
          <Label htmlFor="gsc">Google Search Console verification</Label>
          <Input id="gsc" value={gsc} onChange={(e) => setGsc(e.target.value)} placeholder='Paste the meta tag or its content value' />
          <Hint>
            In Search Console choose &ldquo;URL prefix&rdquo; → &ldquo;HTML tag&rdquo;, paste it here, save and republish. Then submit /sitemap.xml.
          </Hint>
        </div>
        <Button type="submit" loading={busy}>
          Save settings
        </Button>
      </form>
    </div>
  );
}

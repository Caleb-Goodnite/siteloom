"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { ExternalLink, Globe, MoreHorizontal, Pencil, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/field";
import { Badge, Dialog, Menu, MenuContent, MenuItem, MenuSeparator, MenuTrigger } from "@/components/ui/misc";
import { publishedUrl } from "@/config/site";
import { formatRelative } from "@/lib/utils";

export type ProjectCard = {
  id: string;
  name: string;
  slug: string;
  published: boolean;
  published_at: string | null;
  updated_at: string;
  custom_domain: string | null;
  domain_verified: boolean;
  status: string;
  blocked: boolean;
};

function hue(s: string) {
  let h = 0;
  for (const c of s) h = (h * 31 + c.charCodeAt(0)) % 360;
  return h;
}

export function ProjectGrid({ projects }: { projects: ProjectCard[] }) {
  const router = useRouter();
  const [renaming, setRenaming] = useState<ProjectCard | null>(null);
  const [deleting, setDeleting] = useState<ProjectCard | null>(null);
  const [name, setName] = useState("");
  const [busy, setBusy] = useState(false);

  async function rename() {
    if (!renaming) return;
    setBusy(true);
    const res = await fetch(`/api/projects/${renaming.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name }),
    });
    setBusy(false);
    if (!res.ok) toast.error((await res.json()).error ?? "Rename failed");
    setRenaming(null);
    router.refresh();
  }

  async function remove() {
    if (!deleting) return;
    setBusy(true);
    const res = await fetch(`/api/projects/${deleting.id}`, { method: "DELETE" });
    setBusy(false);
    if (!res.ok) toast.error((await res.json()).error ?? "Delete failed");
    else toast.success(`Deleted ${deleting.name}`);
    setDeleting(null);
    router.refresh();
  }

  if (!projects.length) {
    return (
      <div className="rounded-2xl border border-dashed border-line-2 p-10 text-center text-sm text-muted">
        Your sites will appear here.
      </div>
    );
  }

  return (
    <>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {projects.map((p) => {
          const h = hue(p.name);
          const url = publishedUrl(p.slug, p.domain_verified ? p.custom_domain : null);
          return (
            <div key={p.id} className="group relative overflow-hidden rounded-2xl border border-line bg-card transition-shadow hover:shadow-[0_14px_40px_-22px_rgba(28,25,23,0.4)]">
              <Link href={`/project/${p.id}`} className="block">
                <div
                  className="flex aspect-[16/9] items-end p-4"
                  style={{ background: `linear-gradient(135deg, hsl(${h} 45% 90%), hsl(${(h + 50) % 360} 40% 80%))` }}
                >
                  <span className="font-display text-3xl leading-none text-ink/80">{p.name}</span>
                </div>
              </Link>
              <div className="flex items-center justify-between gap-2 p-4">
                <div className="min-w-0">
                  <Link href={`/project/${p.id}`} className="block truncate font-medium text-ink hover:underline">
                    {p.name}
                  </Link>
                  <p className="mt-0.5 text-xs text-muted">Edited {formatRelative(p.updated_at)}</p>
                </div>
                <div className="flex items-center gap-1.5">
                  {p.blocked ? (
                    <Badge tone="danger">Suspended</Badge>
                  ) : p.status === "generating" ? (
                    <Badge tone="accent">Building…</Badge>
                  ) : p.published ? (
                    <Badge tone="ok">
                      <Globe className="size-3" /> Live
                    </Badge>
                  ) : (
                    <Badge>Draft</Badge>
                  )}
                  <Menu>
                    <MenuTrigger className="rounded-full p-1.5 text-muted hover:bg-paper-2 hover:text-ink" aria-label={`Options for ${p.name}`}>
                      <MoreHorizontal className="size-4" />
                    </MenuTrigger>
                    <MenuContent>
                      {p.published && (
                        <MenuItem asChild>
                          <a href={url} target="_blank" rel="noopener">
                            <ExternalLink className="size-4" /> Open live site
                          </a>
                        </MenuItem>
                      )}
                      <MenuItem
                        onSelect={() => {
                          setName(p.name);
                          setRenaming(p);
                        }}
                      >
                        <Pencil className="size-4" /> Rename
                      </MenuItem>
                      <MenuSeparator />
                      <MenuItem danger onSelect={() => setDeleting(p)}>
                        <Trash2 className="size-4" /> Delete
                      </MenuItem>
                    </MenuContent>
                  </Menu>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <Dialog open={!!renaming} onOpenChange={(o) => !o && setRenaming(null)} title="Rename site">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            void rename();
          }}
          className="space-y-4"
        >
          <Input value={name} onChange={(e) => setName(e.target.value)} maxLength={60} autoFocus />
          <div className="flex justify-end gap-2">
            <Button variant="ghost" onClick={() => setRenaming(null)}>
              Cancel
            </Button>
            <Button type="submit" loading={busy}>
              Save
            </Button>
          </div>
        </form>
      </Dialog>

      <Dialog
        open={!!deleting}
        onOpenChange={(o) => !o && setDeleting(null)}
        title={`Delete ${deleting?.name ?? "site"}?`}
        description="This permanently deletes the site, its history, form submissions and analytics, and takes it offline. This can't be undone."
      >
        <div className="flex justify-end gap-2">
          <Button variant="ghost" onClick={() => setDeleting(null)}>
            Cancel
          </Button>
          <Button variant="danger" loading={busy} onClick={remove}>
            Delete forever
          </Button>
        </div>
      </Dialog>
    </>
  );
}

"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { AlertTriangle, Check, Copy, Download, ExternalLink, Globe, Lock, RefreshCw } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Hint, Input, Label } from "@/components/ui/field";
import { Dialog, Switch } from "@/components/ui/misc";
import { Spinner } from "@/components/ui/spinner";
import { publishedUrl, site } from "@/config/site";
import { cn } from "@/lib/utils";
import type { ApiErrorBody, BuilderProject, PlanInfo } from "./types";

type DomainStatus = {
  domain: string | null;
  verified?: boolean;
  configured?: boolean;
  records?: { type: string; name: string; value: string }[];
  message?: string;
};

export function PublishDialog(props: {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  project: BuilderProject;
  plan: PlanInfo;
  seoScore: number | null;
  placeholders: number;
  unpublishedChanges: boolean;
  onProject: (p: Partial<BuilderProject>) => void;
  onError: (status: number, body: ApiErrorBody) => void;
}) {
  const { project, plan } = props;
  const [slug, setSlug] = useState(project.slug);
  const [publishing, setPublishing] = useState(false);
  const [warnings, setWarnings] = useState<string[]>([]);
  const [blocked, setBlocked] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [domainInput, setDomainInput] = useState(project.custom_domain ?? "");
  const [domain, setDomain] = useState<DomainStatus | null>(null);
  const [domainBusy, setDomainBusy] = useState(false);

  const url = publishedUrl(project.slug, project.domain_verified ? project.custom_domain : null);

  useEffect(() => {
    if (!props.open) return;
    if (project.custom_domain) {
      fetch(`/api/projects/${project.id}/domain`)
        .then((r) => r.json())
        .then((d: DomainStatus) => {
          setDomain(d);
          if (d.verified !== undefined && d.verified !== project.domain_verified) props.onProject({ domain_verified: d.verified });
        })
        .catch(() => {});
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [props.open]);

  async function publish() {
    setPublishing(true);
    setBlocked(null);
    try {
      if (slug !== project.slug) {
        const res = await fetch(`/api/projects/${project.id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ slug }) });
        const data = await res.json();
        if (!res.ok) throw Object.assign(new Error(data.error), { status: res.status, body: data });
        props.onProject({ slug: data.project.slug });
      }
      const res = await fetch(`/api/projects/${project.id}/publish`, { method: "POST" });
      const data = await res.json();
      if (!res.ok) {
        if (res.status === 422) {
          setBlocked(data.error);
          return;
        }
        throw Object.assign(new Error(data.error), { status: res.status, body: data });
      }
      setWarnings(data.warnings ?? []);
      props.onProject({ published: true, published_at: data.publishedAt, updated_at: data.publishedAt });
      toast.success(project.published ? "Your site is updated" : "Your site is live! 🎉");
    } catch (err) {
      const e = err as Error & { status?: number; body?: ApiErrorBody };
      props.onError(e.status ?? 500, e.body ?? { error: e.message });
    } finally {
      setPublishing(false);
    }
  }

  async function unpublish() {
    if (!confirm("Take this site offline? You can publish it again anytime.")) return;
    const res = await fetch(`/api/projects/${project.id}/publish`, { method: "DELETE" });
    if (!res.ok) return props.onError(res.status, await res.json());
    props.onProject({ published: false, showcase: false });
    toast("Site unpublished");
  }

  async function toggleShowcase(v: boolean) {
    props.onProject({ showcase: v });
    const res = await fetch(`/api/projects/${project.id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ showcase: v }) });
    if (!res.ok) props.onProject({ showcase: !v });
  }

  async function connectDomain() {
    setDomainBusy(true);
    const res = await fetch(`/api/projects/${project.id}/domain`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ domain: domainInput }) });
    const data = await res.json();
    setDomainBusy(false);
    if (!res.ok) return props.onError(res.status, data);
    setDomain(data);
    props.onProject({ custom_domain: data.domain, domain_verified: Boolean(data.verified) });
  }

  async function checkDomain() {
    setDomainBusy(true);
    const res = await fetch(`/api/projects/${project.id}/domain`);
    const data = await res.json();
    setDomainBusy(false);
    setDomain(data);
    props.onProject({ domain_verified: Boolean(data.verified) });
    toast(data.verified ? "Domain connected! SSL may take a few minutes." : "Not connected yet. DNS changes can take up to a few hours.");
  }

  async function removeDomain() {
    if (!confirm("Disconnect this domain?")) return;
    setDomainBusy(true);
    await fetch(`/api/projects/${project.id}/domain`, { method: "DELETE" });
    setDomainBusy(false);
    setDomain(null);
    setDomainInput("");
    props.onProject({ custom_domain: null, domain_verified: false });
  }

  const sitesDomain = site.sitesDomain;

  return (
    <Dialog
      open={props.open}
      onOpenChange={props.onOpenChange}
      title={project.published ? "Your site is live" : "Publish your site"}
      description={project.published ? undefined : "Free hosting with SSL, a sitemap, social cards and working forms."}
      className="max-w-xl"
    >
      <div className="space-y-6">
        {project.published ? (
          <div className="flex items-center gap-2 rounded-xl border border-line bg-paper/60 p-2 pl-3">
            <Globe className="size-4 shrink-0 text-ok" />
            <a href={url} target="_blank" rel="noopener" className="min-w-0 flex-1 truncate text-sm font-medium text-ink underline-offset-4 hover:underline">
              {url.replace(/^https?:\/\//, "")}
            </a>
            <Button
              size="sm"
              variant="ghost"
              onClick={async () => {
                await navigator.clipboard.writeText(url);
                setCopied(true);
                setTimeout(() => setCopied(false), 1500);
              }}
              aria-label="Copy URL"
            >
              {copied ? <Check className="size-3.5" /> : <Copy className="size-3.5" />}
            </Button>
            <a href={url} target="_blank" rel="noopener" className="rounded-full p-2 text-muted hover:bg-paper-2 hover:text-ink" aria-label="Open site">
              <ExternalLink className="size-3.5" />
            </a>
          </div>
        ) : (
          <div>
            <Label htmlFor="slug">Your free address</Label>
            <div className="flex items-center rounded-xl border border-line-2 bg-card pr-3 focus-within:border-ink">
              <input
                id="slug"
                value={slug}
                onChange={(e) => setSlug(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ""))}
                className="h-11 min-w-0 flex-1 rounded-xl bg-transparent px-3.5 text-[15px] focus:outline-none"
                maxLength={48}
              />
              <span className="shrink-0 text-sm text-muted">.{sitesDomain}</span>
            </div>
          </div>
        )}

        {(props.placeholders > 0 || (props.seoScore !== null && props.seoScore < 70)) && (
          <div className="space-y-1.5 rounded-xl bg-amber-50 p-3 text-sm text-amber-900">
            {props.placeholders > 0 && (
              <p className="flex gap-2">
                <AlertTriangle className="mt-0.5 size-4 shrink-0" />
                {props.placeholders} placeholder{props.placeholders > 1 ? "s" : ""} like [[Phone number]] still need real details. Use Edit text to fill them in.
              </p>
            )}
            {props.seoScore !== null && props.seoScore < 70 && (
              <p className="flex gap-2">
                <AlertTriangle className="mt-0.5 size-4 shrink-0" />
                SEO score is {props.seoScore}. Check the SEO tab for quick wins.
              </p>
            )}
          </div>
        )}

        {blocked && (
          <div className="rounded-xl bg-red-50 p-3 text-sm text-red-800">
            <p className="font-medium">This site can&apos;t be published yet</p>
            <p className="mt-1">{blocked}</p>
            <Link href="/legal/acceptable-use" className="mt-1 inline-block underline">
              Acceptable use policy
            </Link>
          </div>
        )}

        {warnings.length > 0 && (
          <ul className="space-y-1 text-xs text-muted">
            {warnings.map((w) => (
              <li key={w}>• {w}</li>
            ))}
          </ul>
        )}

        <div className="flex flex-wrap gap-2">
          <Button variant="accent" size="lg" className="flex-1" loading={publishing} onClick={publish}>
            {project.published ? (props.unpublishedChanges ? "Publish changes" : "Republish") : "Publish now"}
          </Button>
          {project.published && (
            <Button variant="outline" size="lg" onClick={unpublish}>
              Unpublish
            </Button>
          )}
        </div>

        {project.published && (
          <label className="flex items-center justify-between gap-4 rounded-xl border border-line p-3">
            <span>
              <span className="block text-sm font-medium text-ink">Show in the {site.name} showcase</span>
              <span className="block text-xs text-muted">Get discovered, and earn a link from our showcase page.</span>
            </span>
            <Switch checked={project.showcase} onCheckedChange={toggleShowcase} aria-label="Show in showcase" />
          </label>
        )}

        {/* Custom domain */}
        <div className="border-t border-line pt-5">
          <h3 className="flex items-center gap-2 text-sm font-semibold text-ink">
            Custom domain {plan.customDomains === 0 && <Lock className="size-3.5 text-muted" />}
          </h3>
          {plan.customDomains === 0 ? (
            <p className="mt-1 text-sm text-ink-2">
              Use your own domain (like yourbusiness.com) on any paid plan.{" "}
              <Link href="/dashboard/billing" className="font-medium text-accent-ink underline underline-offset-4">
                Upgrade
              </Link>
            </p>
          ) : project.custom_domain ? (
            <div className="mt-3 space-y-3">
              <div className="flex items-center gap-2 text-sm">
                <span className={cn("size-2 rounded-full", project.domain_verified ? "bg-ok" : "bg-amber-500")} />
                <span className="font-medium text-ink">{project.custom_domain}</span>
                <span className="text-muted">{project.domain_verified ? "Connected" : "Waiting for DNS"}</span>
                <div className="ml-auto flex gap-1">
                  <Button size="sm" variant="ghost" onClick={checkDomain} disabled={domainBusy} aria-label="Check DNS">
                    {domainBusy ? <Spinner className="size-3.5" /> : <RefreshCw className="size-3.5" />}
                  </Button>
                  <Button size="sm" variant="ghost" onClick={removeDomain} disabled={domainBusy}>
                    Remove
                  </Button>
                </div>
              </div>
              {!project.domain_verified && domain?.records && domain.records.length > 0 && (
                <div className="rounded-xl border border-line bg-paper/60 p-3">
                  <p className="text-xs text-ink-2">Add these records at your domain provider (GoDaddy, Namecheap, Cloudflare…):</p>
                  <table className="mt-2 w-full text-left font-mono text-xs">
                    <thead>
                      <tr className="text-muted">
                        <th className="py-1 font-normal">Type</th>
                        <th className="py-1 font-normal">Name</th>
                        <th className="py-1 font-normal">Value</th>
                      </tr>
                    </thead>
                    <tbody>
                      {domain.records.map((r) => (
                        <tr key={`${r.type}${r.name}`} className="align-top">
                          <td className="py-1 pr-3">{r.type}</td>
                          <td className="py-1 pr-3">{r.name}</td>
                          <td className="break-all py-1">{r.value}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  <Hint>DNS changes usually take minutes but can take up to 48 hours. We check automatically every day.</Hint>
                </div>
              )}
            </div>
          ) : (
            <form
              className="mt-3 flex gap-2"
              onSubmit={(e) => {
                e.preventDefault();
                void connectDomain();
              }}
            >
              <Input value={domainInput} onChange={(e) => setDomainInput(e.target.value)} placeholder="www.yourbusiness.com" className="h-10" />
              <Button type="submit" variant="outline" loading={domainBusy} disabled={!domainInput.trim()}>
                Connect
              </Button>
            </form>
          )}
        </div>

        <div className="flex items-center justify-between border-t border-line pt-5 text-sm">
          <span className="text-ink-2">Own your code: a production-ready static site.</span>
          <a href={`/api/projects/${project.id}/export`} className="inline-flex items-center gap-1.5 font-medium text-ink hover:underline">
            <Download className="size-4" /> Download .zip
          </a>
        </div>
      </div>
    </Dialog>
  );
}

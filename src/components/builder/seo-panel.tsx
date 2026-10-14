"use client";

import { useState } from "react";
import { AlertCircle, AlertTriangle, Info, RefreshCw, Sparkles } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { TIERS } from "@/config/models";
import type { SeoReport, Severity } from "@/lib/site/seo";
import type { SeoSnapshot } from "@/lib/types";
import { cn, formatRelative } from "@/lib/utils";
import type { BuilderProject } from "./types";

const ICON: Record<Severity, typeof Info> = { error: AlertCircle, warning: AlertTriangle, info: Info };
const TONE: Record<Severity, string> = { error: "text-danger", warning: "text-warn", info: "text-muted" };

function LiveCard({ project, onSeo }: { project: BuilderProject; onSeo: (seo: SeoSnapshot) => void }) {
  const [busy, setBusy] = useState(false);
  const seo = project.settings?.seo;
  if (!project.published) {
    return (
      <div className="rounded-2xl border border-dashed border-line-2 p-5 text-sm text-ink-2">
        <b className="text-ink">Live audit:</b> once you publish, every page is graded automatically with the same auditor as our{" "}
        <a href="/tools/website-grader" target="_blank" className="underline underline-offset-4">free website grader</a>, and you can re-check the live site anytime.
      </div>
    );
  }
  async function recheck() {
    setBusy(true);
    const res = await fetch(`/api/projects/${project.id}/seo-check`, { method: "POST" });
    const data = await res.json();
    setBusy(false);
    if (!res.ok) return toast.error(data.error ?? "Couldn't check the live site");
    if (data.seo) onSeo(data.seo);
    toast.success(`Live site scored ${data.result.score}/100`);
  }
  return (
    <div className="rounded-2xl border border-line bg-card p-5">
      <div className="flex flex-wrap items-center gap-4">
        <div>
          <p className="text-xs font-medium uppercase tracking-wider text-muted">Published site audit</p>
          <p className="mt-1 flex items-baseline gap-2">
            <span className="font-display text-4xl text-ink">{seo?.score ?? "—"}</span>
            <span className="text-sm text-muted">/ 100 average across {seo?.pages ?? 0} page{seo?.pages === 1 ? "" : "s"}</span>
          </p>
          {seo?.live && (
            <p className="mt-1 text-xs text-ink-2">
              Live check: <b>{seo.live.score}/100</b>, responded in {(seo.live.responseMs / 1000).toFixed(2)}s · {formatRelative(seo.live.checkedAt)}
            </p>
          )}
        </div>
        <Button size="sm" variant="outline" className="ml-auto" loading={busy} onClick={recheck}>
          <RefreshCw className="size-3.5" /> Re-check live site
        </Button>
      </div>
      {seo && seo.issues.length > 0 && (
        <ul className="mt-4 space-y-1.5 border-t border-line pt-4 text-sm">
          {seo.issues.slice(0, 6).map((i, n) => (
            <li key={n} className="flex gap-2 text-ink-2">
              <span className={cn("mt-1.5 size-1.5 shrink-0 rounded-full", i.status === "fail" ? "bg-danger" : "bg-warn")} />
              <span>
                <b className="font-medium text-ink">{i.label}</b> · {i.detail} <span className="font-mono text-[11px] text-muted">{i.page}</span>
              </span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

export function SeoPanel({
  report,
  generating,
  canFast,
  onFix,
  project,
  onSeo,
}: {
  report: SeoReport | null;
  generating: boolean;
  canFast: boolean;
  onFix: (prompt: string) => void;
  project: BuilderProject;
  onSeo: (seo: SeoSnapshot) => void;
}) {
  if (!report) return <p className="p-8 text-sm text-muted">Build your site first. Then this panel checks it the way a search engine would.</p>;
  const fixable = report.issues.filter((i) => i.severity !== "info" && i.page !== "*");
  const color = report.score >= 85 ? "#15803d" : report.score >= 60 ? "#b45309" : "#b91c1c";
  const circumference = 2 * Math.PI * 34;

  function fixPrompt() {
    const lines = fixable.map((i) => `- ${i.page}: ${i.message}`).join("\n");
    return `Fix these SEO issues without changing the design or adding invented facts (use [[placeholders]] for unknown details):\n${lines}`;
  }

  return (
    <div className="scrollbar-thin min-h-0 flex-1 overflow-y-auto">
      <div className="mx-auto max-w-3xl space-y-6 p-6">
        <LiveCard project={project} onSeo={onSeo} />
        <div className="flex flex-col items-start gap-6 rounded-2xl border border-line bg-card p-6 sm:flex-row sm:items-center">
          <svg viewBox="0 0 80 80" className="size-24 shrink-0" role="img" aria-label={`SEO score ${report.score} out of 100`}>
            <circle cx="40" cy="40" r="34" fill="none" stroke="var(--paper-2)" strokeWidth="8" />
            <circle
              cx="40"
              cy="40"
              r="34"
              fill="none"
              stroke={color}
              strokeWidth="8"
              strokeLinecap="round"
              strokeDasharray={circumference}
              strokeDashoffset={circumference * (1 - report.score / 100)}
              transform="rotate(-90 40 40)"
            />
            <text x="40" y="46" textAnchor="middle" fontSize="20" fontWeight="700" fill="var(--ink)">
              {report.score}
            </text>
          </svg>
          <div className="flex-1">
            <h2 className="text-lg font-semibold text-ink">Draft check</h2>
            <p className="mt-1 text-sm text-ink-2">
              On publish we automatically add canonical URLs, Open Graph and Twitter tags, a social image, sitemap.xml, robots.txt and
              llms.txt. This checks what&apos;s in your content.
            </p>
            {fixable.length > 0 && (
              <Button className="mt-4" size="sm" variant="accent" disabled={generating || !canFast} onClick={() => onFix(fixPrompt())}>
                <Sparkles className="size-3.5" /> Fix {fixable.length} issue{fixable.length > 1 ? "s" : ""} with AI · {TIERS.fast.credits} credit
              </Button>
            )}
          </div>
        </div>

        <h3 className="text-sm font-semibold text-ink">Issues</h3>
        {report.issues.length === 0 ? (
          <p className="mt-2 text-sm text-ok">No issues found. Nice work.</p>
        ) : (
          <ul className="mt-3 divide-y divide-line rounded-2xl border border-line bg-card">
            {report.issues.map((i, n) => {
              const Icon = ICON[i.severity];
              return (
                <li key={n} className="flex items-start gap-3 px-4 py-3 text-sm">
                  <Icon className={cn("mt-0.5 size-4 shrink-0", TONE[i.severity])} />
                  <span className="flex-1 text-ink-2">{i.message}</span>
                  {i.page !== "*" && <span className="shrink-0 font-mono text-[11px] text-muted">{i.page}</span>}
                </li>
              );
            })}
          </ul>
        )}

        <h3 className="mt-8 text-sm font-semibold text-ink">Pages</h3>
        <div className="mt-3 overflow-x-auto rounded-2xl border border-line bg-card">
          <table className="w-full min-w-[560px] text-sm">
            <thead>
              <tr className="border-b border-line text-left text-xs text-muted">
                <th className="p-3 font-medium">Page</th>
                <th className="p-3 font-medium">Google preview</th>
                <th className="p-3 text-right font-medium">Words</th>
              </tr>
            </thead>
            <tbody>
              {report.pages.map((p) => (
                <tr key={p.page} className="border-b border-line align-top last:border-0">
                  <td className="p-3 font-mono text-xs text-ink-2">{p.page}</td>
                  <td className="p-3">
                    <p className="line-clamp-1 text-[15px] text-[#1a0dab]">{p.title || <span className="text-danger">Missing title</span>}</p>
                    <p className="line-clamp-2 text-xs text-ink-2">{p.description || <span className="text-danger">Missing description</span>}</p>
                  </td>
                  <td className="p-3 text-right tabular-nums text-ink-2">{p.words}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

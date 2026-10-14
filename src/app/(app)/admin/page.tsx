import type { Metadata } from "next";
import { AppShell } from "@/components/app/app-shell";
import { ReportActions } from "@/components/app/admin-actions";
import { publishedUrl } from "@/config/site";
import { requireAdmin } from "@/lib/auth";
import { serverEnv } from "@/lib/env";
import { getBusinessMetrics } from "@/lib/metrics";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { formatRelative, formatUsd } from "@/lib/utils";

export const metadata: Metadata = { title: "Admin", robots: { index: false } };

function Stat({ label, value, sub }: { label: string; value: string; sub?: string }) {
  return (
    <div className="rounded-2xl border border-line bg-card p-5">
      <p className="text-xs text-muted">{label}</p>
      <p className="mt-1 text-2xl font-semibold tabular-nums text-ink">{value}</p>
      {sub && <p className="mt-0.5 text-xs text-muted">{sub}</p>}
    </div>
  );
}

export default async function AdminPage() {
  const { profile } = await requireAdmin();
  const admin = supabaseAdmin();
  const [m, { data: reports }, { data: moderation }, { data: signups }] = await Promise.all([
    getBusinessMetrics(),
    admin.from("abuse_reports").select("id, url, reason, details, created_at, project_id, projects(id, name, slug, blocked, custom_domain, domain_verified)").eq("status", "open").order("created_at", { ascending: false }).limit(50),
    admin.from("moderation_events").select("id, project_id, verdict, categories, reason, created_at").order("created_at", { ascending: false }).limit(20),
    admin.from("profiles").select("id, email, plan, created_at").order("created_at", { ascending: false }).limit(10),
  ]);
  const maxSpend = Math.max(0.01, ...m.aiSpendSeries.map((s) => s.cost));
  const budget = serverEnv.dailyAiBudgetUsd;

  return (
    <AppShell profile={profile}>
      <h1 className="font-display text-5xl text-ink">Admin</h1>

      <div className="mt-8 grid grid-cols-2 gap-3 md:grid-cols-4">
        <Stat label="MRR" value={formatUsd(m.mrr)} sub={`${m.paidByPlan.starter + m.paidByPlan.pro + m.paidByPlan.business} paying`} />
        <Stat label="Users" value={m.users.toLocaleString()} sub={`+${m.signups1d} today · +${m.signups7d} this week`} />
        <Stat label="AI spend today" value={formatUsd(m.aiSpend1d)} sub={`budget ${formatUsd(budget, 0)} · 30d ${formatUsd(m.aiSpend30d)}`} />
        <Stat label="Gross margin (30d est.)" value={m.mrr ? `${Math.round((1 - m.aiSpend30d / m.mrr) * 100)}%` : "—"} sub="MRR vs. AI spend" />
        <Stat label="Generations (24h)" value={m.generations1d.toLocaleString()} />
        <Stat label="Sites" value={m.projects.toLocaleString()} sub={`${m.published} published`} />
        <Stat label="Form submissions (7d)" value={m.formSubmissions7d.toLocaleString()} />
        <Stat label="Open abuse reports" value={String(m.openReports)} />
      </div>

      <section className="mt-8 rounded-2xl border border-line bg-card p-6">
        <h2 className="font-semibold text-ink">AI spend, last 30 days</h2>
        <div className="mt-4 flex h-32 items-end gap-1" role="img" aria-label="Daily AI spend bar chart">
          {m.aiSpendSeries.map((s) => (
            <div key={s.day} className="group relative flex-1">
              <div className="w-full rounded-t bg-accent/80" style={{ height: `${Math.max(2, (s.cost / maxSpend) * 120)}px` }} />
              <span className="pointer-events-none absolute -top-8 left-1/2 hidden -translate-x-1/2 whitespace-nowrap rounded bg-ink px-2 py-1 text-[10px] text-white group-hover:block">
                {s.day}: {formatUsd(s.cost)} · {s.requests} calls
              </span>
            </div>
          ))}
          {!m.aiSpendSeries.length && <p className="text-sm text-muted">No usage yet.</p>}
        </div>
      </section>

      <div className="mt-8 grid gap-6 lg:grid-cols-2">
        <section className="rounded-2xl border border-line bg-card p-6">
          <h2 className="font-semibold text-ink">Open abuse reports</h2>
          <ul className="mt-3 divide-y divide-line">
            {(reports ?? []).map((r) => {
              const p = (Array.isArray(r.projects) ? r.projects[0] : r.projects) as
                | { id: string; name: string; slug: string; blocked: boolean; custom_domain: string | null; domain_verified: boolean }
                | null;
              return (
                <li key={r.id} className="py-3 text-sm">
                  <div className="flex items-center justify-between gap-3">
                    <a href={r.url ?? "#"} target="_blank" rel="noopener noreferrer" className="truncate font-medium text-ink underline">
                      {r.url}
                    </a>
                    <span className="shrink-0 text-xs text-muted">{formatRelative(r.created_at)}</span>
                  </div>
                  <p className="mt-1 text-ink-2">
                    <b>{r.reason}</b>
                    {r.details ? ` — ${r.details}` : ""}
                  </p>
                  {p && (
                    <p className="mt-1 text-xs text-muted">
                      Project “{p.name}” · {publishedUrl(p.slug, p.domain_verified ? p.custom_domain : null)} {p.blocked ? "· BLOCKED" : ""}
                    </p>
                  )}
                  <ReportActions reportId={r.id} projectId={p?.id ?? null} blocked={p?.blocked ?? false} />
                </li>
              );
            })}
            {!reports?.length && <li className="py-3 text-sm text-muted">Nothing to review. 🎉</li>}
          </ul>
        </section>

        <section className="space-y-6">
          <div className="rounded-2xl border border-line bg-card p-6">
            <h2 className="font-semibold text-ink">Moderation log</h2>
            <ul className="mt-3 divide-y divide-line text-sm">
              {(moderation ?? []).map((e) => (
                <li key={e.id} className="flex items-start justify-between gap-3 py-2">
                  <span className="text-ink-2">
                    <b className={e.verdict === "block" ? "text-danger" : "text-warn"}>{e.verdict}</b> {e.categories?.join(", ")} — {e.reason}
                    <span className="block font-mono text-[11px] text-muted">{e.project_id}</span>
                  </span>
                  <span className="shrink-0 text-xs text-muted">{formatRelative(e.created_at)}</span>
                </li>
              ))}
              {!moderation?.length && <li className="py-2 text-muted">No blocked publishes.</li>}
            </ul>
          </div>
          <div className="rounded-2xl border border-line bg-card p-6">
            <h2 className="font-semibold text-ink">Latest signups</h2>
            <ul className="mt-3 divide-y divide-line text-sm">
              {(signups ?? []).map((s) => (
                <li key={s.id} className="flex justify-between gap-3 py-2">
                  <span className="truncate text-ink-2">{s.email}</span>
                  <span className="shrink-0 text-xs text-muted">
                    {s.plan} · {formatRelative(s.created_at)}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        </section>
      </div>
    </AppShell>
  );
}

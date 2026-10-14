"use client";

import { useEffect, useState } from "react";
import { BarChart3 } from "lucide-react";
import { Spinner } from "@/components/ui/spinner";

type Data = {
  days: { day: string; count: number }[];
  total: number;
  pages: { key: string; count: number }[];
  sources: { key: string; count: number }[];
};

function TopList({ title, rows, empty }: { title: string; rows: { key: string; count: number }[]; empty: string }) {
  const max = Math.max(1, ...rows.map((r) => r.count));
  return (
    <div className="rounded-2xl border border-line bg-card p-5">
      <h3 className="text-sm font-semibold text-ink">{title}</h3>
      {rows.length === 0 ? (
        <p className="mt-3 text-sm text-muted">{empty}</p>
      ) : (
        <ul className="mt-3 space-y-1.5">
          {rows.map((r) => (
            <li key={r.key} className="relative flex items-center justify-between overflow-hidden rounded-lg px-2.5 py-1.5 text-sm">
              <span className="absolute inset-y-0 left-0 rounded-lg bg-accent-soft" style={{ width: `${(r.count / max) * 100}%` }} />
              <span className="relative truncate text-ink">{r.key}</span>
              <span className="relative tabular-nums text-ink-2">{r.count}</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

export function AnalyticsPanel({ projectId, published }: { projectId: string; published: boolean }) {
  const [data, setData] = useState<Data | null>(null);

  useEffect(() => {
    fetch(`/api/projects/${projectId}/analytics`)
      .then((r) => r.json())
      .then(setData)
      .catch(() => setData({ days: [], total: 0, pages: [], sources: [] }));
  }, [projectId]);

  if (!data) {
    return (
      <div className="flex flex-1 items-center justify-center">
        <Spinner className="text-muted" />
      </div>
    );
  }
  const max = Math.max(1, ...data.days.map((d) => d.count));

  return (
    <div className="scrollbar-thin min-h-0 flex-1 overflow-y-auto">
      <div className="mx-auto max-w-3xl space-y-4 p-6">
        <div>
          <h2 className="text-lg font-semibold text-ink">Analytics</h2>
          <p className="text-sm text-ink-2">Privacy-friendly: no cookies and no banner needed. Bots are filtered out.</p>
        </div>
        {!published && data.total === 0 ? (
          <div className="rounded-2xl border border-dashed border-line-2 p-10 text-center">
            <BarChart3 className="mx-auto size-6 text-muted" />
            <p className="mt-3 font-medium text-ink">Publish to start collecting visits</p>
          </div>
        ) : (
          <>
            <div className="rounded-2xl border border-line bg-card p-5">
              <div className="flex items-baseline justify-between">
                <h3 className="text-sm font-semibold text-ink">Page views · last 30 days</h3>
                <span className="font-display text-3xl tabular-nums text-ink">{data.total.toLocaleString()}</span>
              </div>
              <div className="mt-4 flex h-32 items-end gap-[3px]" role="img" aria-label="Daily page views">
                {data.days.map((d) => (
                  <div key={d.day} className="group relative flex-1">
                    <div className="w-full rounded-t-sm bg-ink/80 transition-colors group-hover:bg-accent" style={{ height: `${Math.max(2, (d.count / max) * 128)}px` }} />
                    <span className="pointer-events-none absolute -top-7 left-1/2 hidden -translate-x-1/2 whitespace-nowrap rounded bg-ink px-1.5 py-0.5 text-[10px] text-white group-hover:block">
                      {new Date(d.day + "T00:00:00").toLocaleDateString(undefined, { month: "short", day: "numeric" })}: {d.count}
                    </span>
                  </div>
                ))}
              </div>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <TopList title="Top pages" rows={data.pages} empty="No visits yet." />
              <TopList title="Where visitors come from" rows={data.sources} empty="Direct visits only so far." />
            </div>
          </>
        )}
      </div>
    </div>
  );
}

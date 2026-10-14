import { api, getOwnedProject, requireApiUser } from "@/lib/http";
import { supabaseAdmin } from "@/lib/supabase/admin";

type Ctx = { params: Promise<{ id: string }> };

/** Last 30 days of page views, top pages and top traffic sources. */
export const GET = api<Ctx>(async (_req, ctx) => {
  const user = await requireApiUser();
  const { id } = await ctx.params;
  await getOwnedProject(id, user.id, "id");
  const since = new Date(Date.now() - 29 * 86400_000).toISOString().slice(0, 10);
  const admin = supabaseAdmin();
  const [{ data: views }, { data: refs }] = await Promise.all([
    admin.from("page_views").select("day, path, views").eq("project_id", id).gte("day", since),
    admin.from("page_referrers").select("source, views").eq("project_id", id).gte("day", since),
  ]);

  const byDay = new Map<string, number>();
  for (let i = 29; i >= 0; i--) byDay.set(new Date(Date.now() - i * 86400_000).toISOString().slice(0, 10), 0);
  const byPath = new Map<string, number>();
  for (const v of views ?? []) {
    byDay.set(v.day, (byDay.get(v.day) ?? 0) + v.views);
    byPath.set(v.path, (byPath.get(v.path) ?? 0) + v.views);
  }
  const bySource = new Map<string, number>();
  for (const r of refs ?? []) bySource.set(r.source, (bySource.get(r.source) ?? 0) + r.views);

  const top = (m: Map<string, number>) =>
    [...m.entries()].sort((a, b) => b[1] - a[1]).slice(0, 10).map(([key, count]) => ({ key, count }));

  return Response.json({
    days: [...byDay.entries()].map(([day, count]) => ({ day, count })),
    total: [...byDay.values()].reduce((a, b) => a + b, 0),
    pages: top(byPath),
    sources: top(bySource),
  });
});

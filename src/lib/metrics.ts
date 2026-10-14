import "server-only";
import { PLANS, type PlanId } from "@/config/plans";
import { supabaseAdmin } from "@/lib/supabase/admin";

export type BusinessMetrics = {
  users: number;
  signups7d: number;
  signups1d: number;
  paidByPlan: Record<PlanId, number>;
  mrr: number;
  projects: number;
  published: number;
  generations1d: number;
  aiSpend1d: number;
  aiSpend30d: number;
  aiSpendSeries: { day: string; cost: number; requests: number }[];
  openReports: number;
  formSubmissions7d: number;
};

/** Headline numbers for the admin dashboard and the daily digest email. */
export async function getBusinessMetrics(): Promise<BusinessMetrics> {
  const admin = supabaseAdmin();
  const now = Date.now();
  const iso = (ms: number) => new Date(now - ms).toISOString();
  const day = 86400_000;
  const count = async (q: PromiseLike<{ count: number | null }>) => (await q).count ?? 0;

  const [users, signups7d, signups1d, projects, published, generations1d, openReports, formSubmissions7d, paid, spend] = await Promise.all([
    count(admin.from("profiles").select("id", { count: "exact", head: true })),
    count(admin.from("profiles").select("id", { count: "exact", head: true }).gte("created_at", iso(7 * day))),
    count(admin.from("profiles").select("id", { count: "exact", head: true }).gte("created_at", iso(day))),
    count(admin.from("projects").select("id", { count: "exact", head: true })),
    count(admin.from("projects").select("id", { count: "exact", head: true }).eq("published", true)),
    count(admin.from("messages").select("id", { count: "exact", head: true }).eq("role", "assistant").gte("created_at", iso(day))),
    count(admin.from("abuse_reports").select("id", { count: "exact", head: true }).eq("status", "open")),
    count(admin.from("form_submissions").select("id", { count: "exact", head: true }).gte("created_at", iso(7 * day))),
    admin.from("profiles").select("plan, billing_interval").neq("plan", "free").in("subscription_status", ["active", "trialing", "past_due"]),
    admin.from("ai_spend_daily").select("day, cost_usd, requests").gte("day", iso(30 * day).slice(0, 10)).order("day"),
  ]);

  const paidByPlan: Record<PlanId, number> = { free: 0, starter: 0, pro: 0, business: 0 };
  let mrr = 0;
  for (const p of (paid.data ?? []) as { plan: PlanId; billing_interval: string | null }[]) {
    paidByPlan[p.plan] = (paidByPlan[p.plan] ?? 0) + 1;
    const plan = PLANS[p.plan];
    if (plan) mrr += p.billing_interval === "year" ? plan.priceYearly / 12 : plan.priceMonthly;
  }
  const series = ((spend.data ?? []) as { day: string; cost_usd: number; requests: number }[]).map((r) => ({
    day: r.day,
    cost: Number(r.cost_usd),
    requests: r.requests,
  }));
  const today = new Date().toISOString().slice(0, 10);

  return {
    users,
    signups7d,
    signups1d,
    paidByPlan,
    mrr,
    projects,
    published,
    generations1d,
    aiSpend1d: series.find((s) => s.day === today)?.cost ?? 0,
    aiSpend30d: series.reduce((n, s) => n + s.cost, 0),
    aiSpendSeries: series,
    openReports,
    formSubmissions7d,
  };
}

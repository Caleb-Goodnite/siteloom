import { site } from "@/config/site";
import { refundCredits } from "@/lib/credits";
import { checkDomain } from "@/lib/domains";
import { sendAdminAlert } from "@/lib/email";
import { serverEnv } from "@/lib/env";
import { runLifecycleEmails } from "@/lib/lifecycle";
import { getBusinessMetrics } from "@/lib/metrics";
import { redeployPublished } from "@/lib/site/deploy";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { formatUsd } from "@/lib/utils";

export const maxDuration = 300;

/**
 * Daily self-maintenance (scheduled in vercel.json):
 *  1. refunds + unlocks generations that were interrupted (e.g. a function timeout)
 *  2. prunes old versions, rate-limit rows and webhook markers
 *  3. re-checks custom domains waiting on DNS
 *  4. sends onboarding/upgrade emails (each at most once per person)
 *  5. emails the admin a one-screen business digest
 */
export async function GET(req: Request) {
  const secret = serverEnv.cronSecret;
  if (!secret || req.headers.get("authorization") !== `Bearer ${secret}`) {
    return new Response("Unauthorized", { status: 401 });
  }
  const admin = supabaseAdmin();
  const log: string[] = [];

  // 1. Interrupted generations
  const cutoff = new Date(Date.now() - 20 * 60_000).toISOString();
  const { data: stuck } = await admin
    .from("messages")
    .select("id, ledger_id, project_id")
    .eq("status", "streaming")
    .lt("created_at", cutoff)
    .limit(500);
  for (const m of stuck ?? []) {
    if (m.ledger_id) await refundCredits(m.ledger_id, "Interrupted generation — refunded");
    await admin.from("messages").update({ status: "error", error: "This generation was interrupted. You haven't been charged.", credits_charged: 0 }).eq("id", m.id);
  }
  await admin.from("projects").update({ status: "idle", generating_since: null, cancel_requested: false }).eq("status", "generating").lt("generating_since", cutoff);
  log.push(`refunded ${stuck?.length ?? 0} interrupted generations`);

  // 2. Housekeeping
  const { error: cleanupError } = await admin.rpc("cleanup_ops", { p_keep_versions: 50 });
  log.push(cleanupError ? `cleanup failed: ${cleanupError.message}` : "cleanup ok");

  // 3. Pending custom domains
  const { data: pending } = await admin.from("projects").select("id, custom_domain").not("custom_domain", "is", null).eq("domain_verified", false).limit(50);
  let verified = 0;
  for (const p of pending ?? []) {
    const status = await checkDomain(p.custom_domain!).catch(() => null);
    if (status?.verified) {
      verified++;
      await admin.from("projects").update({ domain_verified: true }).eq("id", p.id);
      await redeployPublished(p.id).catch((e) => console.error(e));
    }
  }
  log.push(`verified ${verified}/${pending?.length ?? 0} pending domains`);

  // 4. Onboarding / upgrade emails
  try {
    log.push(`lifecycle emails: ${JSON.stringify(await runLifecycleEmails())}`);
  } catch (err) {
    console.error("lifecycle emails failed", err);
    log.push("lifecycle emails failed");
  }

  // 5. Digest
  const m = await getBusinessMetrics();
  await sendAdminAlert(
    `Daily digest — ${formatUsd(m.mrr, 0)} MRR, ${m.signups1d} signups`,
    `<table style="font-size:14px;border-collapse:collapse">
${[
  ["MRR", formatUsd(m.mrr)],
  ["Paid customers", `${m.paidByPlan.starter} Starter · ${m.paidByPlan.pro} Pro · ${m.paidByPlan.business} Business`],
  ["Signups (24h / 7d)", `${m.signups1d} / ${m.signups7d}`],
  ["Total users", String(m.users)],
  ["Generations (24h)", String(m.generations1d)],
  ["AI spend (24h / 30d)", `${formatUsd(m.aiSpend1d)} / ${formatUsd(m.aiSpend30d)}`],
  ["Cost per credit (30d)", (() => {
    const all = m.costPerCredit.find((t) => t.tier === "all");
    return all?.credits ? `${formatUsd(all.cost / all.credits, 3)} over ${all.messages} messages` : "no paid messages yet";
  })()],
  ["Published sites", String(m.published)],
  ["Form submissions (7d)", String(m.formSubmissions7d)],
  ["Open abuse reports", String(m.openReports)],
]
  .map(([k, v]) => `<tr><td style="padding:4px 16px 4px 0;color:#78716c">${k}</td><td><b>${v}</b></td></tr>`)
  .join("\n")}
</table>
<p style="font-size:12px;color:#78716c">${log.join(" · ")}</p>
<p><a href="${site.url}/admin">Open admin →</a></p>`,
  );

  return Response.json({ ok: true, log });
}

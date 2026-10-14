import { z } from "zod";
import { site } from "@/config/site";
import { sendAdminAlert, escapeHtml } from "@/lib/email";
import { serverEnv } from "@/lib/env";
import { api, ApiError, clientIp, rateLimit } from "@/lib/http";
import { invalidateSite } from "@/lib/site/hosting";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { sha256Hex } from "@/lib/utils";

const Body = z.object({
  url: z.string().trim().url().max(500),
  reason: z.enum(["phishing", "scam", "malware", "impersonation", "illegal", "spam", "other"]),
  details: z.string().trim().max(2000).optional(),
  email: z.union([z.string().email(), z.literal("")]).optional(),
});

/**
 * Auto-takedown: this many open serious reports from distinct reporters suspends a FREE site
 * pending review (paid sites only alert the admin, so competitors can't grief them offline).
 */
const AUTO_SUSPEND_REPORTS = 3;

export const POST = api(async (req) => {
  const ip = clientIp(req);
  if (!(await rateLimit(`report:${ip}`, 5, 3600))) throw new ApiError(429, "Too many reports. Try again later.");
  const body = Body.parse(await req.json());
  const host = new URL(body.url).hostname.toLowerCase();
  const admin = supabaseAdmin();

  const sitesSuffix = `.${site.sitesDomain.split(":")[0]}`;
  const query = admin.from("projects").select("id, user_id, slug, custom_domain, name, blocked");
  const { data: project } = host.endsWith(sitesSuffix)
    ? await query.eq("slug", host.slice(0, -sitesSuffix.length)).maybeSingle()
    : await query.in("custom_domain", [host, host.replace(/^www\./, "")]).maybeSingle();

  await admin.from("abuse_reports").insert({
    project_id: project?.id ?? null,
    url: body.url,
    reason: body.reason,
    details: body.details ?? null,
    reporter_email: body.email || null,
    reporter_hash: (await sha256Hex(`${ip}:${serverEnv.supabaseSecretKey.slice(-12)}`)).slice(0, 24),
  });

  if (project && !project.blocked && ["phishing", "malware", "impersonation", "scam"].includes(body.reason)) {
    const [{ data: reports }, { data: owner }] = await Promise.all([
      admin
        .from("abuse_reports")
        .select("reporter_hash")
        .eq("project_id", project.id)
        .eq("status", "open")
        .in("reason", ["phishing", "malware", "impersonation", "scam"]),
      admin.from("profiles").select("plan").eq("id", project.user_id).single(),
    ]);
    const distinct = new Set((reports ?? []).map((r) => r.reporter_hash)).size;
    if (distinct >= AUTO_SUSPEND_REPORTS && owner?.plan === "free") {
      await admin.from("projects").update({ blocked: true, blocked_reason: "Auto-suspended after multiple abuse reports (pending review)" }).eq("id", project.id);
      invalidateSite(project);
    }
  }

  void sendAdminAlert(
    `Abuse report: ${body.reason}`,
    `<p><b>${escapeHtml(body.url)}</b>${project ? ` (project ${project.id}, “${escapeHtml(project.name)}”)` : " (no matching project)"}</p><p>${escapeHtml(body.details ?? "")}</p><p><a href="${site.url}/admin">Review in admin →</a></p>`,
  );
  return Response.json({ ok: true });
});

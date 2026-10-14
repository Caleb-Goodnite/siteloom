import "server-only";
import { site } from "@/config/site";
import { serverEnv } from "@/lib/env";

/**
 * Transactional email through Resend's HTTP API. Optional: without RESEND_API_KEY
 * emails are skipped (logged) and everything else keeps working.
 */
export async function sendEmail(opts: { to: string; subject: string; html: string; replyTo?: string; headers?: Record<string, string> }) {
  const key = serverEnv.resendKey;
  if (!key) {
    console.info(`[email skipped: RESEND_API_KEY not set] ${opts.subject} → ${opts.to}`);
    return false;
  }
  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      from: serverEnv.emailFrom || `${site.name} <hello@${new URL(site.url).hostname}>`,
      to: [opts.to],
      subject: opts.subject,
      html: opts.html,
      reply_to: opts.replyTo,
      headers: opts.headers,
    }),
  });
  if (!res.ok) console.error("Resend error", res.status, await res.text());
  return res.ok;
}

export function escapeHtml(s: string) {
  return s.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]!);
}

/** Shared email shell. Marketing emails pass an unsubscribe URL (and show the postal address, per CAN-SPAM). */
export function emailLayout(body: string, opts: { unsubscribeUrl?: string } = {}) {
  const postal = process.env.EMAIL_POSTAL_ADDRESS;
  const footer = [
    `${site.name} by ${site.company.name} · <a href="${site.url}" style="color:#78716c">${new URL(site.url).hostname}</a>`,
    opts.unsubscribeUrl && postal ? escapeHtml(postal) : "",
    opts.unsubscribeUrl ? `<a href="${opts.unsubscribeUrl}" style="color:#78716c">Unsubscribe from tips and offers</a>` : "",
  ]
    .filter(Boolean)
    .join("<br>");
  return `<!doctype html><html><body style="margin:0;background:#f6f3ee;font-family:-apple-system,Segoe UI,Helvetica,Arial,sans-serif;color:#1c1917">
<div style="max-width:560px;margin:0 auto;padding:32px 24px">
<div style="font-size:20px;font-weight:700;margin-bottom:24px">${site.name}</div>
<div style="background:#fff;border-radius:16px;padding:28px;border:1px solid #e7e2da;font-size:15px;line-height:1.6">${body}</div>
<p style="font-size:12px;color:#78716c;margin-top:20px;line-height:1.6">${footer}</p>
</div></body></html>`;
}

const layout = (body: string) => emailLayout(body);

export async function sendWelcomeEmail(to: string, name: string | null) {
  if (!to) return;
  await sendEmail({
    to,
    subject: `Welcome to ${site.name} — your first site is a sentence away`,
    html: layout(`
<p>Hi ${escapeHtml(name?.split(" ")[0] ?? "there")},</p>
<p>Thanks for joining ${site.name}. You have bonus credits waiting, so the fastest way to see what it can do is to describe your business in one or two sentences:</p>
<p style="background:#f6f3ee;border-radius:10px;padding:14px;font-style:italic">“A website for Bright Smile Dental in Austin, TX. Services, insurance we accept, meet the team, and a booking request form.”</p>
<p>A few tips that save credits:</p>
<ul>
<li><b>Click any text in the preview to edit it for free</b> — no AI needed.</li>
<li>Use <b>Fast</b> for small changes and <b>Standard</b> for new pages.</li>
<li>If a generation fails, you're refunded automatically.</li>
</ul>
<p><a href="${site.url}/dashboard" style="display:inline-block;background:#1c1917;color:#fff;text-decoration:none;padding:12px 20px;border-radius:999px;font-weight:600">Build my site →</a></p>`),
  });
}

export async function sendFormSubmissionEmail(opts: {
  to: string;
  siteName: string;
  formName: string;
  page: string | null;
  data: Record<string, string>;
  projectId: string;
}) {
  const rows = Object.entries(opts.data)
    .map(
      ([k, v]) =>
        `<tr><td style="padding:6px 12px 6px 0;color:#78716c;vertical-align:top;white-space:nowrap">${escapeHtml(k)}</td><td style="padding:6px 0">${escapeHtml(v).replace(/\n/g, "<br>")}</td></tr>`,
    )
    .join("");
  const replyTo = Object.entries(opts.data).find(([k, v]) => /e-?mail/i.test(k) && /@/.test(v))?.[1];
  await sendEmail({
    to: opts.to,
    replyTo,
    subject: `New ${opts.formName} submission — ${opts.siteName}`,
    html: layout(`
<p style="margin-top:0"><b>${escapeHtml(opts.siteName)}</b> received a new <b>${escapeHtml(opts.formName)}</b> submission${opts.page ? ` on <code>${escapeHtml(opts.page)}</code>` : ""}.</p>
<table style="border-collapse:collapse;font-size:14px">${rows}</table>
<p><a href="${site.url}/project/${opts.projectId}?tab=forms">View all submissions →</a></p>`),
  });
}

export async function sendAdminAlert(subject: string, body: string) {
  for (const to of serverEnv.adminEmails) {
    await sendEmail({ to, subject: `[${site.name} admin] ${subject}`, html: layout(body) });
  }
}

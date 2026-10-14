import "server-only";
import { createHmac, timingSafeEqual } from "node:crypto";
import { publishedUrl, site } from "@/config/site";
import { industries } from "@/content/industries";
import { emailLayout, escapeHtml, sendEmail } from "@/lib/email";
import { serverEnv } from "@/lib/env";
import { supabaseAdmin } from "@/lib/supabase/admin";

/**
 * Automated onboarding/upgrade emails, sent by the daily cron. Each kind goes to a
 * person at most once (email_log), only to people who haven't opted out, and every
 * email carries a one-click unsubscribe link.
 */

export function unsubscribeToken(userId: string) {
  return createHmac("sha256", serverEnv.supabaseSecretKey).update(`unsubscribe:${userId}`).digest("hex").slice(0, 32);
}

export function verifyUnsubscribe(userId: string, token: string) {
  const expected = Buffer.from(unsubscribeToken(userId));
  const given = Buffer.from(token);
  return expected.length === given.length && timingSafeEqual(expected, given);
}

export function unsubscribeUrl(userId: string) {
  return `${site.url}/unsubscribe?u=${userId}&t=${unsubscribeToken(userId)}`;
}

type Recipient = { id: string; email: string; full_name: string | null };

const firstName = (r: Recipient) => escapeHtml(r.full_name?.split(" ")[0] || "there");
const button = (href: string, label: string) =>
  `<p><a href="${href}" style="display:inline-block;background:#1c1917;color:#fff;text-decoration:none;padding:12px 20px;border-radius:999px;font-weight:600">${label}</a></p>`;

const KINDS = {
  first_site: {
    subject: () => `Your website is one sentence away`,
    body: (r: Recipient) => {
      const examples = ["restaurants", "dentists", "plumbers"].map((s) => industries.find((i) => i.slug === s)!).filter(Boolean);
      return `<p>Hi ${firstName(r)},</p>
<p>You signed up for ${site.name} but haven't built your site yet. It takes about two minutes. Describe your business in a sentence or two, like:</p>
${examples.map((i) => `<p style="background:#f6f3ee;border-radius:10px;padding:12px;font-style:italic;margin:8px 0">“${escapeHtml(i.prompt.slice(0, 180))}…”</p>`).join("")}
<p>Already have a website? Paste its address and we'll redesign it with your real content.</p>
${button(`${site.url}/dashboard`, "Build my site →")}`;
    },
  },
  publish: {
    subject: () => `Your site is ready to go live`,
    body: (r: Recipient, ctx: { projectId: string; name: string }) => `<p>Hi ${firstName(r)},</p>
<p><b>${escapeHtml(ctx.name)}</b> is built but not published yet. Publishing is free and takes one click. You'll get a live address with SSL, a sitemap for Google, and contact forms that deliver to your inbox.</p>
<p>Before you do, open <b>Fill in your details</b> to add your phone number, address and hours in one go.</p>
${button(`${site.url}/project/${ctx.projectId}`, "Open my site →")}`,
  },
  seo_tips: {
    subject: () => `3 things to do so Google finds your new site`,
    body: (r: Recipient, ctx: { url: string; name: string }) => `<p>Hi ${firstName(r)},</p>
<p>Congrats on publishing <b>${escapeHtml(ctx.name)}</b>! Your site already has titles, descriptions, structured data and a sitemap. Three things only you can do will speed up getting found:</p>
<ol>
<li><b>Add it to Google Search Console</b> (search.google.com/search-console) and submit your sitemap: <code>${escapeHtml(ctx.url)}/sitemap.xml</code></li>
<li><b>Claim your Google Business Profile</b> and put your website address on it, using the exact same business name, address and phone number as your site.</li>
<li><b>Ask five happy customers for a Google review.</b> Reviews are one of the strongest local ranking signals.</li>
</ol>
<p>Our <a href="${site.url}/blog/local-seo-checklist">local SEO checklist</a> covers the rest.</p>
${button(ctx.url, "View my live site →")}`,
  },
  own_domain: {
    subject: () => `Make it yours: put your site on your own domain`,
    body: (r: Recipient, ctx: { name: string }) => `<p>Hi ${firstName(r)},</p>
<p><b>${escapeHtml(ctx.name)}</b> has been live for a week. A custom domain (like yourbusiness.com) looks more trustworthy to customers, is easier to remember, and removes the “Made with ${site.name}” badge.</p>
<p>Paid plans include your own domain with SSL, more published sites, form notifications by email and more credits each month.</p>
${button(`${site.url}/dashboard/billing`, "See plans →")}`,
  },
} as const;

type Kind = keyof typeof KINDS;

async function alreadySent(kind: Kind, userIds: string[]) {
  if (!userIds.length) return new Set<string>();
  const { data } = await supabaseAdmin().from("email_log").select("user_id").eq("kind", kind).in("user_id", userIds);
  return new Set((data ?? []).map((r) => r.user_id as string));
}

async function send<K extends Kind>(kind: K, r: Recipient, ctx: Parameters<(typeof KINDS)[K]["body"]>[1]) {
  // Claim the slot first so a crash or retry can never send twice.
  const { error } = await supabaseAdmin().from("email_log").insert({ user_id: r.id, kind });
  if (error) return false;
  const def = KINDS[kind] as { subject: () => string; body: (r: Recipient, c: typeof ctx) => string };
  const unsub = unsubscribeUrl(r.id);
  return sendEmail({
    to: r.email,
    subject: def.subject(),
    html: emailLayout(def.body(r, ctx), { unsubscribeUrl: unsub }),
    headers: { "List-Unsubscribe": `<${unsub}>`, "List-Unsubscribe-Post": "List-Unsubscribe=One-Click" },
  });
}

const HOUR = 3600_000;
const ago = (ms: number) => new Date(Date.now() - ms).toISOString();

/** Runs every lifecycle sequence once. Returns counts per kind. */
export async function runLifecycleEmails(limit = 200) {
  if (!serverEnv.resendKey) return { skipped: "RESEND_API_KEY not set" };
  const admin = supabaseAdmin();
  const counts: Record<string, number> = {};

  // 1. Signed up 20h–7d ago and never created a project.
  {
    const { data: users } = await admin
      .from("profiles")
      .select("id, email, full_name")
      .eq("marketing_emails", true)
      .lte("created_at", ago(20 * HOUR))
      .gte("created_at", ago(7 * 24 * HOUR))
      .limit(limit);
    const ids = (users ?? []).map((u) => u.id);
    const sent = await alreadySent("first_site", ids);
    const { data: withProjects } = ids.length ? await admin.from("projects").select("user_id").in("user_id", ids) : { data: [] };
    const has = new Set((withProjects ?? []).map((p) => p.user_id));
    counts.first_site = 0;
    for (const u of users ?? []) if (!sent.has(u.id) && !has.has(u.id) && (await send("first_site", u, undefined))) counts.first_site++;
  }

  // 2. Built a site 2–14 days ago, never published anything.
  {
    const { data: projects } = await admin
      .from("projects")
      .select("id, name, user_id, files, profiles!inner(id, email, full_name, marketing_emails)")
      .eq("published", false)
      .lte("updated_at", ago(48 * HOUR))
      .gte("created_at", ago(14 * 24 * HOUR))
      .limit(limit);
    const candidates = (projects ?? []).filter((p) => Object.keys((p.files as object) ?? {}).length > 0);
    const userIds = [...new Set(candidates.map((p) => p.user_id))];
    const sent = await alreadySent("publish", userIds);
    const { data: live } = userIds.length ? await admin.from("projects").select("user_id").in("user_id", userIds).eq("published", true) : { data: [] };
    const hasLive = new Set((live ?? []).map((p) => p.user_id));
    counts.publish = 0;
    const seen = new Set<string>();
    for (const p of candidates) {
      const u = (Array.isArray(p.profiles) ? p.profiles[0] : p.profiles) as Recipient & { marketing_emails: boolean };
      if (!u?.marketing_emails || seen.has(u.id) || sent.has(u.id) || hasLive.has(u.id)) continue;
      seen.add(u.id);
      if (await send("publish", u, { projectId: p.id, name: p.name })) counts.publish++;
    }
  }

  // 3 & 4. Published sites: SEO tips after 3 days; free plan → own-domain nudge after 7 days.
  for (const [kind, minAge, freeOnly] of [
    ["seo_tips", 3, false],
    ["own_domain", 7, true],
  ] as const) {
    const { data: projects } = await admin
      .from("projects")
      .select("id, name, slug, custom_domain, domain_verified, user_id, profiles!inner(id, email, full_name, marketing_emails, plan)")
      .eq("published", true)
      .eq("blocked", false)
      .lte("published_at", ago(minAge * 24 * HOUR))
      .gte("published_at", ago((minAge + 21) * 24 * HOUR))
      .limit(limit);
    const userIds = [...new Set((projects ?? []).map((p) => p.user_id))];
    const sent = await alreadySent(kind, userIds);
    counts[kind] = 0;
    const seen = new Set<string>();
    for (const p of projects ?? []) {
      const u = (Array.isArray(p.profiles) ? p.profiles[0] : p.profiles) as Recipient & { marketing_emails: boolean; plan: string };
      if (!u?.marketing_emails || seen.has(u.id) || sent.has(u.id) || (freeOnly && u.plan !== "free")) continue;
      seen.add(u.id);
      const url = publishedUrl(p.slug, p.domain_verified ? p.custom_domain : null);
      const ok = kind === "seo_tips" ? await send("seo_tips", u, { url, name: p.name }) : await send("own_domain", u, { name: p.name });
      if (ok) counts[kind]++;
    }
  }
  return counts;
}

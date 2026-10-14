import { after } from "next/server";
import { getPlan } from "@/config/plans";
import { site } from "@/config/site";
import { sendFormSubmissionEmail } from "@/lib/email";
import { clientIp, rateLimit } from "@/lib/http";
import { contentTypeFor, getHostedSite, normalizeHost, type HostedSite } from "@/lib/site/hosting";
import { siteOgImage } from "@/lib/site/og";
import { siteRuntimeJs } from "@/lib/site/runtime";
import { cleanUrlFor, pageForPath } from "@/lib/site/render";
import { supabaseAdmin } from "@/lib/supabase/admin";

type Ctx = { params: Promise<{ host: string; path?: string[] }> };

const EDGE_CACHE = "public, max-age=0, s-maxage=60, stale-while-revalidate=86400";
const SECURITY_HEADERS = {
  "X-Content-Type-Options": "nosniff",
  "Referrer-Policy": "strict-origin-when-cross-origin",
};

function page(body: string, status: number) {
  return new Response(
    `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="robots" content="noindex"><title>${status === 404 ? "Page not found" : "Unavailable"}</title></head><body style="margin:0;min-height:100vh;display:grid;place-items:center;font-family:system-ui,sans-serif;background:#f6f3ee;color:#1c1917;text-align:center;padding:24px">${body}</body></html>`,
    { status, headers: { "Content-Type": "text/html; charset=utf-8", "Cache-Control": "public, max-age=0, s-maxage=30", ...SECURITY_HEADERS } },
  );
}

const notFound = () =>
  page(`<div><h1 style="font-size:28px;margin:0 0 8px">There's nothing here yet</h1><p style="color:#78716c">This site isn't published. <a href="${site.url}" style="color:inherit">Build yours with ${site.name}</a>.</p></div>`, 404);

/** Rejects requests where the routed host doesn't match the real Host header (no serving on the app origin). */
async function resolve(req: Request, ctx: Ctx) {
  const { host, path = [] } = await ctx.params;
  const routed = normalizeHost(decodeURIComponent(host));
  const actual = normalizeHost(req.headers.get("host") ?? "");
  if (routed !== actual) return null;
  let s: HostedSite | null;
  try {
    s = await getHostedSite(routed);
  } catch (err) {
    console.error("hosted site lookup failed", err);
    return { host: routed, path: "/", site: null, unavailable: true };
  }
  return { host: routed, path: "/" + path.map(decodeURIComponent).join("/"), site: s, unavailable: false };
}

export async function GET(req: Request, ctx: Ctx) {
  const r = await resolve(req, ctx);
  if (!r) return new Response("Not found", { status: 404 });
  const { host, path, site: s } = r;
  if (r.unavailable) {
    return page(`<div><h1 style="font-size:28px;margin:0 0 8px">Back in a moment</h1><p style="color:#78716c">This site is temporarily unavailable. Please try again shortly.</p></div>`, 503);
  }
  if (!s || !s.published || !s.published_files) return notFound();
  if (s.blocked) {
    return page(`<div><h1 style="font-size:28px;margin:0 0 8px">This site is unavailable</h1><p style="color:#78716c">It was suspended for violating ${site.name}'s acceptable use policy.</p></div>`, 451);
  }

  // One canonical host: once a custom domain is verified, the subdomain and www-variant redirect to it.
  if (s.custom_domain && s.domain_verified && host !== s.custom_domain) {
    const url = new URL(req.url);
    return Response.redirect(`https://${s.custom_domain}${path}${url.search}`, 301);
  }

  const files = s.published_files;

  if (path === "/__sl/sl.js") {
    return new Response(siteRuntimeJs(), {
      headers: { "Content-Type": "text/javascript; charset=utf-8", "Cache-Control": "public, max-age=3600, s-maxage=86400", ...SECURITY_HEADERS },
    });
  }
  if (path === "/__sl/og.png") {
    const title = new URL(req.url).searchParams.get("t")?.slice(0, 120) || s.name;
    return siteOgImage({ title, siteName: s.settings?.siteName ?? s.name, host, brand: s.settings?.brand ?? null });
  }

  const filePath = path.slice(1);
  if (filePath && !filePath.endsWith(".html") && files[filePath] !== undefined) {
    const immutable = filePath.startsWith("assets/") && new URL(req.url).searchParams.has("v");
    return new Response(files[filePath], {
      headers: {
        "Content-Type": contentTypeFor(filePath),
        "Cache-Control": immutable ? "public, max-age=31536000, immutable" : EDGE_CACHE,
        ...SECURITY_HEADERS,
      },
    });
  }

  // One URL per page: /about.html and /about/ redirect to /about.
  if (/\.html$/.test(path) || (path.length > 1 && path.endsWith("/"))) {
    const target = pageForPath(path, files);
    if (target) return Response.redirect(new URL(cleanUrlFor(target) + new URL(req.url).search, req.url), 301);
  }

  const pageFile = pageForPath(path, files);
  if (!pageFile || pageFile === "404.html") {
    if (files["404.html"]) {
      return new Response(files["404.html"], { status: 404, headers: { "Content-Type": "text/html; charset=utf-8", "Cache-Control": EDGE_CACHE, ...SECURITY_HEADERS } });
    }
    return page(`<div><h1 style="font-size:28px;margin:0 0 8px">Page not found</h1><p><a href="/" style="color:inherit">Go to the home page</a></p></div>`, 404);
  }

  return new Response(files[pageFile], {
    headers: { "Content-Type": "text/html; charset=utf-8", "Cache-Control": EDGE_CACHE, ...SECURITY_HEADERS },
  });
}

// ─────────────────────────── forms + analytics ───────────────────────────

const BOT_UA = /bot|crawl|spider|slurp|lighthouse|headless|preview|facebookexternalhit|curl|wget|python/i;

function cleanFormData(input: unknown) {
  if (!input || typeof input !== "object") return null;
  const out: Record<string, string> = {};
  let total = 0;
  for (const [k, v] of Object.entries(input as Record<string, unknown>).slice(0, 30)) {
    if (typeof v !== "string") continue;
    const key = k.slice(0, 60).trim();
    const value = v.slice(0, 5000).trim();
    if (!key || !value) continue;
    total += key.length + value.length;
    if (total > 20000) break;
    out[key] = value;
  }
  return Object.keys(out).length ? out : null;
}

async function handleForm(req: Request, s: HostedSite) {
  let body: { form?: unknown; page?: unknown; data?: unknown; hp?: unknown; t?: unknown };
  try {
    body = await req.json();
  } catch {
    return Response.json({ error: "Invalid submission" }, { status: 400 });
  }
  // Honeypot / too-fast submissions: pretend success so bots learn nothing.
  if ((typeof body.hp === "string" && body.hp) || (typeof body.t === "number" && body.t < 1500)) {
    return Response.json({ ok: true });
  }
  const ip = clientIp(req);
  if (!(await rateLimit(`form:${s.id}:${ip}`, 5, 600)) || !(await rateLimit(`form-day:${s.id}`, 300, 86400))) {
    return Response.json({ error: "Too many submissions. Please try again later." }, { status: 429 });
  }
  const data = cleanFormData(body.data);
  if (!data) return Response.json({ error: "Please fill in the form." }, { status: 400 });
  const formName = typeof body.form === "string" ? body.form.slice(0, 60) : "Form";
  const pagePath = typeof body.page === "string" ? body.page.slice(0, 200) : null;

  const admin = supabaseAdmin();
  const { error } = await admin.from("form_submissions").insert({ project_id: s.id, form_name: formName, page: pagePath, data });
  if (error) {
    console.error("form insert failed", error);
    return Response.json({ error: "Could not send. Please try again." }, { status: 500 });
  }

  after(async () => {
    const { data: owner } = await admin.from("profiles").select("email, plan, email_notifications").eq("id", s.user_id).single();
    if (!owner || !owner.email_notifications) return;
    const plan = getPlan(owner.plan);
    if (plan.id === "free") return; // free plan: dashboard inbox only
    await sendFormSubmissionEmail({
      to: s.settings?.formEmail || owner.email,
      siteName: s.settings?.siteName ?? s.name,
      formName,
      page: pagePath,
      data,
      projectId: s.id,
    });
  });
  return Response.json({ ok: true });
}

async function handleBeacon(req: Request, s: HostedSite) {
  if (BOT_UA.test(req.headers.get("user-agent") ?? "")) return new Response(null, { status: 204 });
  let body: { p?: unknown; s?: unknown } = {};
  try {
    body = JSON.parse(await req.text());
  } catch {
    return new Response(null, { status: 204 });
  }
  const path = typeof body.p === "string" ? body.p.slice(0, 200) : "/";
  const source = typeof body.s === "string" ? body.s.slice(0, 80).toLowerCase() : "";
  if (await rateLimit(`pv:${s.id}:${clientIp(req)}`, 120, 3600)) {
    after(() => supabaseAdmin().rpc("track_page_view", { p_project: s.id, p_path: path, p_source: source || null }));
  }
  return new Response(null, { status: 204 });
}

export async function POST(req: Request, ctx: Ctx) {
  const r = await resolve(req, ctx);
  if (!r?.site || !r.site.published || r.site.blocked) return Response.json({ error: "Not found" }, { status: 404 });
  if (r.path === "/__sl/form") return handleForm(req, r.site);
  if (r.path === "/__sl/a") return handleBeacon(req, r.site);
  return Response.json({ error: "Not found" }, { status: 404 });
}

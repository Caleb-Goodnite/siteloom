import { z } from "zod";
import { getPlan } from "@/config/plans";
import { site } from "@/config/site";
import { getProfile } from "@/lib/auth";
import { addDomain, checkDomain, isValidDomain, removeDomain } from "@/lib/domains";
import { api, ApiError, getOwnedProject, requireApiUser } from "@/lib/http";
import { redeployPublished } from "@/lib/site/deploy";
import { invalidateSite } from "@/lib/site/hosting";
import { supabaseAdmin } from "@/lib/supabase/admin";
import type { Project } from "@/lib/types";

type Ctx = { params: Promise<{ id: string }> };

/** Current domain + DNS status (re-checks verification). */
export const GET = api<Ctx>(async (_req, ctx) => {
  const user = await requireApiUser();
  const { id } = await ctx.params;
  const project = await getOwnedProject<Project>(id, user.id, "id, slug, custom_domain, domain_verified");
  if (!project.custom_domain) return Response.json({ domain: null });
  const status = await checkDomain(project.custom_domain);
  if (status.verified !== project.domain_verified) {
    await supabaseAdmin().from("projects").update({ domain_verified: status.verified }).eq("id", id);
    invalidateSite(project);
    // Canonical URLs, sitemap and OG tags should now use the custom domain.
    await redeployPublished(id);
  }
  return Response.json({ domain: project.custom_domain, ...status });
});

const Body = z.object({ domain: z.string().trim().toLowerCase().max(253) });

export const POST = api<Ctx>(async (req, ctx) => {
  const user = await requireApiUser(req);
  const { id } = await ctx.params;
  const { domain: raw } = Body.parse(await req.json());
  const domain = raw.replace(/^https?:\/\//, "").replace(/\/.*$/, "");
  if (!isValidDomain(domain)) throw new ApiError(400, "Enter a domain like example.com or www.example.com.");
  if (domain.endsWith(site.sitesDomain) || domain.endsWith(new URL(site.url).hostname)) throw new ApiError(400, "That domain can't be used.");

  const [project, profile] = await Promise.all([getOwnedProject<Project>(id, user.id, "id, slug, custom_domain"), getProfile(user.id)]);
  const plan = getPlan(profile.plan);
  if (plan.customDomains === 0) throw new ApiError(403, "Custom domains are included in paid plans.", "upgrade");
  const admin = supabaseAdmin();
  const { count } = await admin
    .from("projects")
    .select("id", { count: "exact", head: true })
    .eq("user_id", user.id)
    .not("custom_domain", "is", null)
    .neq("id", id);
  if ((count ?? 0) >= plan.customDomains) throw new ApiError(403, `Your plan includes ${plan.customDomains} custom domain${plan.customDomains > 1 ? "s" : ""}.`, "upgrade");

  const { data: taken } = await admin.from("projects").select("id").eq("custom_domain", domain).neq("id", id).maybeSingle();
  if (taken) throw new ApiError(409, "That domain is already connected to another site.");

  if (project.custom_domain && project.custom_domain !== domain) await removeDomain(project.custom_domain);
  const status = await addDomain(domain);
  if (status.message && !status.records.length) throw new ApiError(400, status.message);
  await admin.from("projects").update({ custom_domain: domain, domain_verified: status.verified }).eq("id", id);
  invalidateSite({ ...project, custom_domain: domain });
  return Response.json({ domain, ...status });
});

export const DELETE = api<Ctx>(async (req, ctx) => {
  const user = await requireApiUser(req);
  const { id } = await ctx.params;
  const project = await getOwnedProject<Project>(id, user.id, "id, slug, custom_domain");
  if (project.custom_domain) await removeDomain(project.custom_domain);
  await supabaseAdmin().from("projects").update({ custom_domain: null, domain_verified: false }).eq("id", id);
  invalidateSite(project);
  return Response.json({ ok: true });
});

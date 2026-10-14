import "server-only";
import dns from "node:dns/promises";
import { serverEnv } from "@/lib/env";

/**
 * Custom domains. With VERCEL_TOKEN + VERCEL_PROJECT_ID set, domains are attached to the
 * Vercel project automatically (Vercel issues SSL). Without them we fall back to a DNS check
 * and you attach the domain in your host's dashboard.
 */
export type DnsRecord = { type: "A" | "CNAME" | "TXT"; name: string; value: string };
export type DomainStatus = { verified: boolean; configured: boolean; records: DnsRecord[]; message?: string };

const API = "https://api.vercel.com";
const DEFAULT_A = process.env.CUSTOM_DOMAIN_A_RECORD || "76.76.21.21";
const DEFAULT_CNAME = process.env.CUSTOM_DOMAIN_CNAME || "cname.vercel-dns.com";

export function isValidDomain(d: string) {
  return /^(?=.{4,253}$)(?!-)([a-z0-9-]{1,63}\.)+[a-z]{2,63}$/.test(d) && !d.endsWith(".vercel.app");
}

export function isApex(domain: string) {
  return domain.split(".").length === 2;
}

function vercelConfigured() {
  return Boolean(serverEnv.vercelToken && serverEnv.vercelProjectId);
}

async function vercel(path: string, init?: RequestInit) {
  const team = serverEnv.vercelTeamId ? `${path.includes("?") ? "&" : "?"}teamId=${serverEnv.vercelTeamId}` : "";
  const res = await fetch(`${API}${path}${team}`, {
    ...init,
    headers: { Authorization: `Bearer ${serverEnv.vercelToken}`, "Content-Type": "application/json", ...(init?.headers ?? {}) },
  });
  const body = await res.json().catch(() => ({}));
  return { ok: res.ok, status: res.status, body };
}

function baseRecords(domain: string, recommended?: { a?: string; cname?: string }): DnsRecord[] {
  return isApex(domain)
    ? [{ type: "A", name: "@", value: recommended?.a ?? DEFAULT_A }]
    : [{ type: "CNAME", name: domain.split(".").slice(0, -2).join("."), value: recommended?.cname ?? DEFAULT_CNAME }];
}

export async function addDomain(domain: string): Promise<DomainStatus> {
  if (!vercelConfigured()) return checkDomain(domain);
  const pid = serverEnv.vercelProjectId!;
  const res = await vercel(`/v10/projects/${pid}/domains`, { method: "POST", body: JSON.stringify({ name: domain }) });
  if (!res.ok && res.status !== 400 /* already on this project */) {
    const msg = res.status === 409 ? "That domain is already connected to another site." : (res.body?.error?.message ?? "Could not add the domain.");
    return { verified: false, configured: false, records: [], message: msg };
  }
  return checkDomain(domain);
}

export async function checkDomain(domain: string): Promise<DomainStatus> {
  if (vercelConfigured()) {
    const pid = serverEnv.vercelProjectId!;
    const [info, config] = await Promise.all([
      vercel(`/v9/projects/${pid}/domains/${domain}`),
      vercel(`/v6/domains/${domain}/config`),
    ]);
    let verified = Boolean(info.body?.verified);
    if (!verified && info.ok) {
      const v = await vercel(`/v9/projects/${pid}/domains/${domain}/verify`, { method: "POST" });
      verified = Boolean(v.body?.verified);
    }
    const recommended = {
      a: config.body?.recommendedIPv4?.[0]?.value?.[0],
      cname: config.body?.recommendedCNAME?.[0]?.value?.replace(/\.$/, ""),
    };
    const records = baseRecords(domain, recommended);
    for (const c of (info.body?.verification ?? []) as { type: string; domain: string; value: string }[]) {
      if (c.type === "TXT") records.push({ type: "TXT", name: c.domain, value: c.value });
    }
    const configured = config.ok ? config.body?.misconfigured === false : false;
    return { verified: verified && configured, configured, records };
  }

  // DNS fallback (no Vercel API): accept a CNAME/A pointing at our hosting.
  const records = baseRecords(domain);
  try {
    if (isApex(domain)) {
      const a = await dns.resolve4(domain);
      const ok = a.includes(DEFAULT_A);
      return { verified: ok, configured: ok, records };
    }
    const cname = await dns.resolveCname(domain);
    const ok = cname.some((c) => c.replace(/\.$/, "") === DEFAULT_CNAME);
    return { verified: ok, configured: ok, records };
  } catch {
    return { verified: false, configured: false, records };
  }
}

export async function removeDomain(domain: string) {
  if (!vercelConfigured()) return;
  await vercel(`/v9/projects/${serverEnv.vercelProjectId}/domains/${domain}`, { method: "DELETE" });
}

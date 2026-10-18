import type { Metadata } from "next";
import { ArrowUpRight } from "lucide-react";
import { HeroPrompt } from "@/components/marketing/hero-prompt";
import { publishedUrl, site } from "@/config/site";
import { supabaseAdmin } from "@/lib/supabase/admin";

export const revalidate = 3600;

export const metadata: Metadata = {
  title: "Showcase: real websites built with Curblit",
  description: `Live websites businesses built and published with ${site.name}.`,
  alternates: { canonical: "/showcase" },
};

type ShowcaseSite = { id: string; name: string; slug: string; custom_domain: string | null; domain_verified: boolean; settings: { description?: string } };

async function getShowcase(): Promise<ShowcaseSite[]> {
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !(process.env.SUPABASE_SECRET_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY)) return [];
  try {
    const { data } = await supabaseAdmin()
      .from("projects")
      .select("id, name, slug, custom_domain, domain_verified, settings")
      .eq("published", true)
      .eq("showcase", true)
      .eq("blocked", false)
      .order("published_at", { ascending: false })
      .limit(60);
    return (data as ShowcaseSite[]) ?? [];
  } catch {
    return [];
  }
}

export default async function ShowcasePage() {
  const sites = await getShowcase();
  return (
    <div className="mx-auto max-w-6xl px-4 pt-16 sm:px-6">
      <h1 className="font-display text-6xl leading-[0.98] text-ink sm:text-7xl">Showcase</h1>
      <p className="mt-4 max-w-2xl text-lg text-ink-2">
        Real, live websites built with {site.name} by people who chose to share them.
      </p>
      {sites.length === 0 ? (
        <div className="mt-12 rounded-2xl border border-dashed border-line-2 bg-card/60 p-10 text-center">
          <p className="text-lg font-medium text-ink">The showcase is just getting started.</p>
          <p className="mt-1 text-ink-2">Publish your site and switch on &ldquo;Show in showcase&rdquo; to be featured here.</p>
          <div className="mx-auto mt-6 max-w-xl text-left">
            <HeroPrompt compact />
          </div>
        </div>
      ) : (
        <div className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {sites.map((s) => {
            const url = publishedUrl(s.slug, s.domain_verified ? s.custom_domain : null);
            return (
              <a key={s.id} href={url} target="_blank" rel="ugc noopener" className="group overflow-hidden rounded-2xl border border-line bg-card transition-colors hover:border-ink">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={`${url}/__sl/og.png?t=${encodeURIComponent(s.name)}`} alt={`${s.name} preview`} width={1200} height={630} loading="lazy" className="aspect-[1200/630] w-full object-cover" />
                <div className="flex items-start justify-between gap-3 p-4">
                  <div>
                    <h2 className="font-semibold text-ink">{s.name}</h2>
                    {s.settings?.description && <p className="mt-1 line-clamp-2 text-sm text-ink-2">{s.settings.description}</p>}
                  </div>
                  <ArrowUpRight className="size-4 shrink-0 text-muted group-hover:text-ink" />
                </div>
              </a>
            );
          })}
        </div>
      )}
    </div>
  );
}

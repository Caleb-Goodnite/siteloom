import "server-only";
import { unstable_cache } from "next/cache";
import { supabaseAdmin } from "@/lib/supabase/admin";

/** Aggregate SEO audit scores of published sites, for the marketing site (cached hourly). */
export const getPublicSeoStats = unstable_cache(
  async (): Promise<{ sites: number; average: number } | null> => {
    if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !(process.env.SUPABASE_SECRET_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY)) return null;
    try {
      const { data } = await supabaseAdmin()
        .from("projects")
        .select("score:settings->seo->score")
        .eq("published", true)
        .eq("blocked", false)
        .not("settings->seo->score", "is", null)
        .limit(5000);
      const scores = (data ?? []).map((r) => Number((r as { score: unknown }).score)).filter((n) => Number.isFinite(n) && n > 0);
      if (!scores.length) return { sites: 0, average: 0 };
      return { sites: scores.length, average: Math.round(scores.reduce((a, b) => a + b, 0) / scores.length) };
    } catch {
      return null;
    }
  },
  ["public-seo-stats"],
  { revalidate: 3600 },
);

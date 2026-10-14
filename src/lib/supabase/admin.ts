import "server-only";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { serverEnv } from "@/lib/env";

let admin: SupabaseClient | null = null;

/**
 * Privileged client (bypasses RLS). Only use after the caller's identity and
 * ownership have been checked — see src/lib/auth.ts.
 */
export function supabaseAdmin() {
  if (!admin) {
    admin = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL || "", serverEnv.supabaseSecretKey, {
      auth: { persistSession: false, autoRefreshToken: false },
    });
  }
  return admin;
}

export const ASSETS_BUCKET = "site-assets";

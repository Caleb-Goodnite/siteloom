"use client";

import { useEffect, useState } from "react";
import { createClient, isSupabaseConfigured } from "@/lib/supabase/client";

/**
 * Client-side "is someone signed in?" for marketing pages, so those pages can stay
 * fully static (no cookies read on the server). UI hint only — never used for authorization.
 */
export function useSignedIn() {
  const [signedIn, setSignedIn] = useState<boolean | null>(isSupabaseConfigured() ? null : false);
  useEffect(() => {
    if (!isSupabaseConfigured()) return;
    const supabase = createClient();
    supabase.auth.getSession().then(({ data }) => setSignedIn(Boolean(data.session)));
    const { data: sub } = supabase.auth.onAuthStateChange((_e, session) => setSignedIn(Boolean(session)));
    return () => sub.subscription.unsubscribe();
  }, []);
  return signedIn;
}

export const PENDING_PROMPT_KEY = "sl:pending-prompt";

/** What a visitor typed on a marketing page before signing up: a description or a site to redesign. */
export type PendingStart = { prompt?: string; importUrl?: string };

export function savePendingStart(start: PendingStart) {
  try {
    localStorage.setItem(PENDING_PROMPT_KEY, JSON.stringify({ ...start, at: Date.now() }));
  } catch {}
}

export function takePendingStart(): PendingStart | null {
  try {
    const raw = localStorage.getItem(PENDING_PROMPT_KEY);
    if (!raw) return null;
    localStorage.removeItem(PENDING_PROMPT_KEY);
    const { prompt, importUrl, at } = JSON.parse(raw) as PendingStart & { at: number };
    if (Date.now() - at > 1000 * 60 * 60 * 24) return null;
    return prompt || importUrl ? { prompt, importUrl } : null;
  } catch {
    return null;
  }
}

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

export function savePendingPrompt(prompt: string) {
  try {
    localStorage.setItem(PENDING_PROMPT_KEY, JSON.stringify({ prompt, at: Date.now() }));
  } catch {}
}

export function takePendingPrompt(): string | null {
  try {
    const raw = localStorage.getItem(PENDING_PROMPT_KEY);
    if (!raw) return null;
    localStorage.removeItem(PENDING_PROMPT_KEY);
    const { prompt, at } = JSON.parse(raw) as { prompt: string; at: number };
    return Date.now() - at < 1000 * 60 * 60 * 24 ? prompt : null;
  } catch {
    return null;
  }
}

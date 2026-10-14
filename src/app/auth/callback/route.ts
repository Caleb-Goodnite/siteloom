import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

/** OAuth, magic-link and email-confirmation landing: exchanges the PKCE code for a session. */
export async function GET(request: Request) {
  const url = new URL(request.url);
  const code = url.searchParams.get("code");
  const nextParam = url.searchParams.get("next") ?? "/dashboard";
  const next = nextParam.startsWith("/") && !nextParam.startsWith("//") ? nextParam : "/dashboard";

  if (code) {
    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) return NextResponse.redirect(new URL(next, url.origin));
    console.error("auth callback error", error.message);
  }
  return NextResponse.redirect(new URL(`/login?error=${encodeURIComponent("That link is invalid or has expired. Please try again.")}`, url.origin));
}

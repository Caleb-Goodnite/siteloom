"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input, Label } from "@/components/ui/field";
import { createClient, isSupabaseConfigured } from "@/lib/supabase/client";
import { track } from "@/lib/track";

const PROVIDERS = (process.env.NEXT_PUBLIC_AUTH_PROVIDERS ?? "google,github")
  .split(",")
  .map((p) => p.trim())
  .filter((p): p is "google" | "github" => p === "google" || p === "github");

/** Only allow same-site relative redirects. */
export function safeNext(next: string | null, fallback = "/dashboard") {
  return next && next.startsWith("/") && !next.startsWith("//") ? next : fallback;
}

function GoogleIcon() {
  return (
    <svg viewBox="0 0 24 24" className="size-4" aria-hidden="true">
      <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.27-4.74 3.27-8.1z" />
      <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84A11 11 0 0 0 12 23z" />
      <path fill="#FBBC05" d="M5.84 14.1A6.6 6.6 0 0 1 5.5 12c0-.73.13-1.44.34-2.1V7.07H2.18A11 11 0 0 0 1 12c0 1.78.43 3.45 1.18 4.93l3.66-2.84z" />
      <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15A10.96 10.96 0 0 0 12 1 11 11 0 0 0 2.18 7.07l3.66 2.84C6.71 7.31 9.14 5.38 12 5.38z" />
    </svg>
  );
}

function GitHubIcon() {
  return (
    <svg viewBox="0 0 24 24" className="size-4" aria-hidden="true" fill="currentColor">
      <path d="M12 .3a12 12 0 0 0-3.8 23.4c.6.1.8-.3.8-.6v-2c-3.3.7-4-1.6-4-1.6-.6-1.4-1.4-1.8-1.4-1.8-1-.7.1-.7.1-.7 1.2.1 1.8 1.2 1.8 1.2 1 1.8 2.8 1.3 3.5 1 .1-.8.4-1.3.7-1.6-2.7-.3-5.5-1.3-5.5-6 0-1.2.5-2.3 1.3-3.1-.2-.4-.6-1.6 0-3.2 0 0 1-.3 3.4 1.2a11.5 11.5 0 0 1 6 0C17.3 4.7 18.3 5 18.3 5c.7 1.6.2 2.9.1 3.2.8.8 1.3 1.9 1.3 3.2 0 4.6-2.8 5.6-5.5 5.9.5.4.9 1.1.9 2.2v3.3c0 .3.1.7.8.6A12 12 0 0 0 12 .3" />
    </svg>
  );
}

export function AuthForm({ mode }: { mode: "login" | "signup" }) {
  const router = useRouter();
  const params = useSearchParams();
  const next = safeNext(params.get("next"));
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState<string | null>(null);
  const [sent, setSent] = useState<null | "confirm" | "magic">(null);

  useEffect(() => {
    const error = params.get("error");
    if (error) toast.error(error);
  }, [params]);

  const callback = () => `${window.location.origin}/auth/callback?next=${encodeURIComponent(next)}`;

  if (!isSupabaseConfigured()) {
    return (
      <div className="rounded-2xl border border-line bg-card p-6 text-sm text-ink-2">
        Authentication isn&apos;t configured yet. Add your Supabase URL and publishable key to <code>.env.local</code> (see README).
      </div>
    );
  }

  async function oauth(provider: "google" | "github") {
    setBusy(provider);
    const { error } = await createClient().auth.signInWithOAuth({ provider, options: { redirectTo: callback() } });
    if (error) {
      toast.error(error.message);
      setBusy(null);
    }
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy("password");
    const supabase = createClient();
    try {
      if (mode === "signup") {
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
          options: { emailRedirectTo: callback(), data: { full_name: name.trim() || undefined } },
        });
        if (error) throw error;
        track("signup", { method: "password" });
        if (data.session) {
          router.replace(next);
          router.refresh();
        } else setSent("confirm");
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        router.replace(next);
        router.refresh();
      }
    } catch (err) {
      toast.error((err as Error).message);
    } finally {
      setBusy(null);
    }
  }

  async function magicLink() {
    if (!email) {
      toast("Enter your email first.");
      return;
    }
    setBusy("magic");
    const { error } = await createClient().auth.signInWithOtp({ email, options: { emailRedirectTo: callback(), shouldCreateUser: mode === "signup" } });
    setBusy(null);
    if (error) toast.error(error.message);
    else setSent("magic");
  }

  if (sent) {
    return (
      <div className="rounded-2xl border border-line bg-card p-6 text-center">
        <h1 className="font-display text-3xl text-ink">Check your inbox</h1>
        <p className="mt-2 text-sm text-ink-2">
          {sent === "confirm" ? "We sent a link to confirm your email." : "We sent you a sign-in link."} Open it on this device to continue.
        </p>
        <p className="mt-4 text-xs text-muted">{email}</p>
      </div>
    );
  }

  return (
    <div>
      <h1 className="font-display text-4xl text-ink">{mode === "signup" ? "Create your account" : "Welcome back"}</h1>
      <p className="mt-2 text-sm text-ink-2">
        {mode === "signup" ? "Start free. Your first site is a sentence away." : "Log in to keep building."}
      </p>

      {PROVIDERS.length > 0 && (
        <div className="mt-7 grid gap-2">
          {PROVIDERS.includes("google") && (
            <Button variant="outline" size="lg" className="w-full" loading={busy === "google"} onClick={() => oauth("google")}>
              <GoogleIcon /> Continue with Google
            </Button>
          )}
          {PROVIDERS.includes("github") && (
            <Button variant="outline" size="lg" className="w-full" loading={busy === "github"} onClick={() => oauth("github")}>
              <GitHubIcon /> Continue with GitHub
            </Button>
          )}
          <div className="my-3 flex items-center gap-3 text-xs text-muted">
            <span className="h-px flex-1 bg-line" /> or <span className="h-px flex-1 bg-line" />
          </div>
        </div>
      )}

      <form onSubmit={submit} className={PROVIDERS.length ? "space-y-4" : "mt-7 space-y-4"}>
        {mode === "signup" && (
          <div>
            <Label htmlFor="name">Name</Label>
            <Input id="name" autoComplete="name" value={name} onChange={(e) => setName(e.target.value)} />
          </div>
        )}
        <div>
          <Label htmlFor="email">Email</Label>
          <Input id="email" type="email" autoComplete="email" required value={email} onChange={(e) => setEmail(e.target.value)} />
        </div>
        <div>
          <div className="flex items-center justify-between">
            <Label htmlFor="password">Password</Label>
            {mode === "login" && (
              <Link href="/forgot-password" className="mb-1.5 text-xs text-muted hover:text-ink">
                Forgot?
              </Link>
            )}
          </div>
          <Input
            id="password"
            type="password"
            autoComplete={mode === "signup" ? "new-password" : "current-password"}
            minLength={mode === "signup" ? 8 : undefined}
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
        </div>
        <Button type="submit" size="lg" className="w-full" loading={busy === "password"}>
          {mode === "signup" ? "Create account" : "Log in"}
        </Button>
        <button type="button" onClick={magicLink} className="w-full text-center text-sm text-ink-2 hover:text-ink" disabled={busy !== null}>
          {busy === "magic" ? "Sending…" : "Email me a sign-in link instead"}
        </button>
      </form>

      <p className="mt-8 text-center text-sm text-ink-2">
        {mode === "signup" ? (
          <>
            Already have an account?{" "}
            <Link href={`/login${params.toString() ? `?${params}` : ""}`} className="font-medium text-ink underline underline-offset-4">
              Log in
            </Link>
          </>
        ) : (
          <>
            New here?{" "}
            <Link href={`/signup${params.toString() ? `?${params}` : ""}`} className="font-medium text-ink underline underline-offset-4">
              Create an account
            </Link>
          </>
        )}
      </p>
      {mode === "signup" && (
        <p className="mt-4 text-center text-xs text-muted">
          By continuing you agree to our <Link href="/legal/terms" className="underline">Terms</Link> and{" "}
          <Link href="/legal/privacy" className="underline">Privacy Policy</Link>.
        </p>
      )}
    </div>
  );
}

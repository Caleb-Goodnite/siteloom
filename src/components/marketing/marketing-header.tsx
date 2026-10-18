"use client";

import { useEffect, useState } from "react";
import { AppHeader, type AccountSummary } from "@/components/app/app-header";
import { SiteHeader } from "./site-header";
import { useSignedIn } from "./use-session";

/**
 * Marketing pages are static, so the server can't pick the header. Both are rendered and CSS
 * shows one based on <html data-auth>, which the head script in the root layout sets from the
 * auth cookie before first paint. Signed-in visitors get the same header as the dashboard.
 */
export function MarketingHeader() {
  const signedIn = useSignedIn();
  const [account, setAccount] = useState<AccountSummary | null>(null);

  useEffect(() => {
    if (signedIn === null) return;
    if (!signedIn) {
      document.documentElement.dataset.auth = "out";
      return;
    }
    document.documentElement.dataset.auth = "in";
    let cancelled = false;
    fetch("/api/account", { cache: "no-store" })
      .then((res) => {
        if (res.status === 401) document.documentElement.dataset.auth = "out";
        return res.ok ? (res.json() as Promise<AccountSummary>) : null;
      })
      .then((a) => {
        if (!cancelled && a) setAccount(a);
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, [signedIn]);

  return (
    <>
      <div className="auth-in-only">
        <AppHeader account={signedIn ? account : null} />
      </div>
      <div className="auth-out-only">
        <SiteHeader />
      </div>
      <noscript>
        <style>{".auth-out-only{display:contents!important}"}</style>
      </noscript>
    </>
  );
}

import { getPlan } from "@/config/plans";
import { isAdmin } from "@/lib/auth";
import { totalCredits } from "@/lib/credits";
import type { Profile } from "@/lib/types";
import { LegalFooter } from "@/components/ui/legal-footer";
import { AppHeader, type AccountSummary } from "./app-header";

export function accountSummary(profile: Profile): AccountSummary {
  return {
    email: profile.email,
    name: profile.full_name,
    avatar: profile.avatar_url,
    planName: getPlan(profile.plan).name,
    credits: totalCredits(profile),
    allowance: profile.credits_allowance,
    bonus: profile.credits_bonus,
    admin: isAdmin(profile),
  };
}

export function AppShell({ profile, children }: { profile: Profile; children: React.ReactNode }) {
  return (
    <div className="min-h-dvh">
      <AppHeader account={accountSummary(profile)} />
      <main id="main" className="mx-auto max-w-6xl px-4 py-8 sm:px-6 sm:py-10">
        {children}
      </main>
      <LegalFooter />
    </div>
  );
}

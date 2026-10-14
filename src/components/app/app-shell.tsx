import Link from "next/link";
import { Coins } from "lucide-react";
import { Logo } from "@/components/ui/logo";
import { getPlan } from "@/config/plans";
import { isAdmin } from "@/lib/auth";
import { totalCredits } from "@/lib/credits";
import type { Profile } from "@/lib/types";
import { AccountMenu } from "./account-menu";
import { NavLink } from "./nav-link";

export function AppShell({ profile, children }: { profile: Profile; children: React.ReactNode }) {
  const plan = getPlan(profile.plan);
  return (
    <div className="min-h-dvh">
      <header className="sticky top-0 z-30 border-b border-line bg-paper/90 backdrop-blur">
        <div className="mx-auto flex h-14 max-w-6xl items-center gap-2 px-4 sm:px-6">
          <Logo href="/dashboard" className="mr-4" />
          <nav className="flex items-center gap-1 text-sm" aria-label="App">
            <NavLink href="/dashboard" exact>
              Sites
            </NavLink>
            <NavLink href="/dashboard/billing">Billing</NavLink>
            <NavLink href="/dashboard/settings" className="hidden sm:inline-flex">
              Settings
            </NavLink>
            {isAdmin(profile) && <NavLink href="/admin">Admin</NavLink>}
          </nav>
          <div className="ml-auto flex items-center gap-2">
            <Link
              href="/dashboard/billing"
              className="hidden items-center gap-1.5 rounded-full border border-line bg-card px-3 py-1.5 text-xs font-medium text-ink sm:inline-flex"
              title={`${profile.credits_allowance} plan + ${profile.credits_bonus} bonus credits`}
            >
              <Coins className="size-3.5 text-accent" />
              {totalCredits(profile)} credits
              <span className="text-muted">· {plan.name}</span>
            </Link>
            <AccountMenu email={profile.email} name={profile.full_name} avatar={profile.avatar_url} />
          </div>
        </div>
      </header>
      <main id="main" className="mx-auto max-w-6xl px-4 py-8 sm:px-6 sm:py-10">
        {children}
      </main>
    </div>
  );
}

import Link from "next/link";
import { Coins } from "lucide-react";
import { Logo } from "@/components/ui/logo";
import { ThemeToggle } from "@/components/ui/theme-toggle";
import { AccountMenu } from "./account-menu";
import { NavLink } from "./nav-link";

/** What the app header needs to know about the signed-in account (also returned by GET /api/account). */
export type AccountSummary = {
  email: string;
  name: string | null;
  avatar: string | null;
  planName: string;
  credits: number;
  allowance: number;
  bonus: number;
  admin: boolean;
};

/**
 * The signed-in navigation, shared by the dashboard (server-rendered with the profile) and the
 * marketing pages (static, filled in on the client). `account` is null while it's loading.
 */
export function AppHeader({ account }: { account: AccountSummary | null }) {
  return (
    <header className="sticky top-0 z-30 border-b border-line bg-paper/90 backdrop-blur">
      <a href="#main" className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-3 focus:rounded-lg focus:bg-ink focus:px-3 focus:py-2 focus:text-white">
        Skip to content
      </a>
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
          <NavLink href="/templates" className="hidden md:inline-flex">
            Templates
          </NavLink>
          <NavLink href="/tools/website-grader" className="hidden md:inline-flex">
            SEO check
          </NavLink>
          <NavLink href="/blog" className="hidden lg:inline-flex">
            Guides
          </NavLink>
          {account?.admin && <NavLink href="/admin">Admin</NavLink>}
        </nav>
        <div className="ml-auto flex items-center gap-2">
          {account ? (
            <Link
              href="/dashboard/billing"
              className="hidden items-center gap-1.5 rounded-full border border-line bg-card px-3 py-1.5 text-xs font-medium text-ink sm:inline-flex"
              title={`${account.allowance} plan + ${account.bonus} bonus credits`}
            >
              <Coins className="size-3.5 text-accent" />
              {account.credits} credits
              <span className="text-muted">· {account.planName}</span>
            </Link>
          ) : (
            <span className="hidden h-7 w-32 animate-pulse rounded-full border border-line bg-card sm:inline-block" aria-hidden="true" />
          )}
          <ThemeToggle />
          {account ? (
            <AccountMenu email={account.email} name={account.name} avatar={account.avatar} />
          ) : (
            <span className="size-8 animate-pulse rounded-full bg-paper-2" aria-hidden="true" />
          )}
        </div>
      </div>
    </header>
  );
}

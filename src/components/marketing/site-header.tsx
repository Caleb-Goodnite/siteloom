"use client";

import Link from "next/link";
import { useState } from "react";
import { Menu, X } from "lucide-react";
import { ButtonLink } from "@/components/ui/button";
import { Logo } from "@/components/ui/logo";
import { ThemeToggle } from "@/components/ui/theme-toggle";
import { useSignedIn } from "./use-session";

const NAV = [
  { href: "/templates", label: "Templates" },
  { href: "/redesign", label: "Redesign" },
  { href: "/seo", label: "SEO" },
  { href: "/tools/website-grader", label: "Free SEO check" },
  { href: "/pricing", label: "Pricing" },
  { href: "/blog", label: "Guides" },
];

export function SiteHeader() {
  const signedIn = useSignedIn();
  const [open, setOpen] = useState(false);

  return (
    <header className="sticky top-0 z-40 border-b border-line/70 bg-paper/85 backdrop-blur-md">
      <a href="#main" className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-3 focus:rounded-lg focus:bg-ink focus:px-3 focus:py-2 focus:text-white">
        Skip to content
      </a>
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 sm:px-6">
        <Logo />
        <nav className="hidden items-center gap-1 md:flex" aria-label="Main">
          {NAV.map((n) => (
            <Link key={n.href} href={n.href} className="rounded-full px-3 py-2 text-sm text-ink-2 transition-colors hover:bg-paper-2 hover:text-ink">
              {n.label}
            </Link>
          ))}
        </nav>
        <div className="ml-auto flex items-center gap-2 md:ml-0">
          <div className="hidden items-center gap-2 md:flex">
            {signedIn ? (
              <ButtonLink href="/dashboard" size="sm">
                Dashboard
              </ButtonLink>
            ) : (
              <>
                <ButtonLink href="/login" variant="ghost" size="sm">
                  Log in
                </ButtonLink>
                <ButtonLink href="/signup" size="sm">
                  Start free
                </ButtonLink>
              </>
            )}
          </div>
          <ThemeToggle />
        </div>
        <button
          className="rounded-full p-2 text-ink md:hidden"
          onClick={() => setOpen((o) => !o)}
          aria-label={open ? "Close menu" : "Open menu"}
          aria-expanded={open}
        >
          {open ? <X className="size-5" /> : <Menu className="size-5" />}
        </button>
      </div>
      {open && (
        <div className="border-t border-line bg-paper px-4 pb-5 pt-2 md:hidden">
          <nav className="flex flex-col" aria-label="Mobile">
            {NAV.map((n) => (
              <Link key={n.href} href={n.href} onClick={() => setOpen(false)} className="rounded-lg px-2 py-3 text-base text-ink">
                {n.label}
              </Link>
            ))}
          </nav>
          <div className="mt-3 flex gap-2">
            {signedIn ? (
              <ButtonLink href="/dashboard" className="flex-1">
                Dashboard
              </ButtonLink>
            ) : (
              <>
                <ButtonLink href="/login" variant="outline" className="flex-1">
                  Log in
                </ButtonLink>
                <ButtonLink href="/signup" className="flex-1">
                  Start free
                </ButtonLink>
              </>
            )}
          </div>
        </div>
      )}
    </header>
  );
}

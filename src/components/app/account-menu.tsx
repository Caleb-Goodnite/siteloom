"use client";

import Link from "next/link";
import { BookOpen, CreditCard, Gauge, Home, LayoutTemplate, LifeBuoy, LogOut, Settings } from "lucide-react";
import { Menu, MenuContent, MenuItem, MenuLabel, MenuSeparator, MenuTrigger } from "@/components/ui/misc";
import { site } from "@/config/site";
import { createClient, isSupabaseConfigured } from "@/lib/supabase/client";

async function signOut() {
  try {
    // Clears the browser session (and its cookies) and revokes the refresh token...
    if (isSupabaseConfigured()) await createClient().auth.signOut();
    // ...and lets the server clear anything it set, before a full reload so every header resets.
    await fetch("/auth/signout", { method: "POST", redirect: "manual" });
  } finally {
    // A full page load on purpose: client navigation would keep the signed-in UI state around.
    // eslint-disable-next-line @next/next/no-location-assign-relative-destination
    window.location.assign("/");
  }
}

export function AccountMenu({ email, name, avatar }: { email: string; name: string | null; avatar: string | null }) {
  const initial = (name ?? email).trim()[0]?.toUpperCase() ?? "?";
  return (
    <Menu>
      <MenuTrigger className="flex size-8 items-center justify-center overflow-hidden rounded-full bg-ink text-xs font-semibold text-white" aria-label="Account menu">
        {avatar ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={avatar} alt="" className="size-full object-cover" referrerPolicy="no-referrer" />
        ) : (
          initial
        )}
      </MenuTrigger>
      <MenuContent>
        <MenuLabel>
          {name && <div className="font-medium text-ink">{name}</div>}
          <div className="truncate">{email}</div>
        </MenuLabel>
        <MenuSeparator />
        <MenuItem asChild>
          <Link href="/dashboard/billing">
            <CreditCard className="size-4" /> Billing & credits
          </Link>
        </MenuItem>
        <MenuItem asChild>
          <Link href="/dashboard/settings">
            <Settings className="size-4" /> Settings
          </Link>
        </MenuItem>
        <MenuSeparator />
        <MenuItem asChild>
          <Link href="/templates">
            <LayoutTemplate className="size-4" /> Templates
          </Link>
        </MenuItem>
        <MenuItem asChild>
          <Link href="/tools/website-grader">
            <Gauge className="size-4" /> Free SEO check
          </Link>
        </MenuItem>
        <MenuItem asChild>
          <Link href="/blog">
            <BookOpen className="size-4" /> Guides
          </Link>
        </MenuItem>
        <MenuItem asChild>
          <Link href="/">
            <Home className="size-4" /> {site.name} home
          </Link>
        </MenuItem>
        <MenuSeparator />
        <MenuItem asChild>
          <a href={`mailto:${site.supportEmail}`}>
            <LifeBuoy className="size-4" /> Help
          </a>
        </MenuItem>
        <MenuSeparator />
        {/* Not a <form>: the menu unmounts on select, which cancels a form submit before it's sent. */}
        <MenuItem onSelect={signOut}>
          <LogOut className="size-4" /> Log out
        </MenuItem>
      </MenuContent>
    </Menu>
  );
}

"use client";

import Link from "next/link";
import { CreditCard, LifeBuoy, LogOut, Settings } from "lucide-react";
import { Menu, MenuContent, MenuItem, MenuLabel, MenuSeparator, MenuTrigger } from "@/components/ui/misc";
import { site } from "@/config/site";

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
        <MenuItem asChild>
          <a href={`mailto:${site.supportEmail}`}>
            <LifeBuoy className="size-4" /> Help
          </a>
        </MenuItem>
        <MenuSeparator />
        <form action="/auth/signout" method="post">
          <MenuItem asChild>
            <button type="submit" className="w-full">
              <LogOut className="size-4" /> Log out
            </button>
          </MenuItem>
        </form>
      </MenuContent>
    </Menu>
  );
}

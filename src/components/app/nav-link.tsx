"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

export function NavLink({ href, exact, className, children }: { href: string; exact?: boolean; className?: string; children: React.ReactNode }) {
  const pathname = usePathname();
  const active = exact ? pathname === href : pathname === href || pathname.startsWith(`${href}/`);
  return (
    <Link
      href={href}
      aria-current={active ? "page" : undefined}
      className={cn(
        "inline-flex rounded-full px-3 py-1.5 text-ink-2 transition-colors hover:bg-paper-2 hover:text-ink",
        active && "bg-paper-2 font-medium text-ink",
        className,
      )}
    >
      {children}
    </Link>
  );
}

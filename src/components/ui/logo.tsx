import Link from "next/link";
import { site } from "@/config/site";
import { cn } from "@/lib/utils";

/** Woven mark: two warp threads crossed by an accent weft thread. */
export function LogoMark({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 32 32" className={cn("size-7", className)} aria-hidden="true">
      <rect width="32" height="32" rx="9" fill="#1c1917" />
      <path d="M11 7v18M21 7v18" stroke="#f6f3ee" strokeWidth="3" strokeLinecap="round" />
      <path d="M6 16c3.5-4 6.5-4 10 0s6.5 4 10 0" stroke="#ff5a1f" strokeWidth="3" fill="none" strokeLinecap="round" />
    </svg>
  );
}

export function Logo({ className, href = "/" }: { className?: string; href?: string }) {
  return (
    <Link href={href} className={cn("inline-flex items-center gap-2 font-semibold tracking-tight text-ink", className)}>
      <LogoMark />
      <span className="text-[17px]">{site.name}</span>
    </Link>
  );
}

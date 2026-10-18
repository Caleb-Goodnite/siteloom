import Link from "next/link";
import { site } from "@/config/site";
import { cn } from "@/lib/utils";

/** Three equal-weight lines on forest green: white rails top and bottom, a short white pill + green stroke in the middle. */
export function LogoMark({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 32 32" className={cn("size-7", className)} aria-hidden="true">
      <rect width="32" height="32" rx="9" fill="#08251b" />
      <rect x="5" y="7.5" width="22" height="3.25" rx="1.625" fill="#f2f4ed" />
      <rect x="5" y="21.25" width="22" height="3.25" rx="1.625" fill="#f2f4ed" />
      <rect x="5" y="14.375" width="7.25" height="3.25" rx="1.625" fill="#f2f4ed" />
      <rect x="14.75" y="14.375" width="12.25" height="3.25" rx="1.625" fill="#78b990" />
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

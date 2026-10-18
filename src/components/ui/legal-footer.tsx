import Link from "next/link";
import { site } from "@/config/site";

const links = [
  ["Terms", "/legal/terms"],
  ["Privacy", "/legal/privacy"],
  ["Acceptable use", "/legal/acceptable-use"],
  ["Report abuse", "/report"],
] as const;

export function LegalFooter() {
  return (
    <footer className="border-t border-line bg-paper-2/40">
      <div className="mx-auto flex max-w-6xl flex-col gap-3 px-4 py-5 text-xs text-muted sm:flex-row sm:items-center sm:justify-between sm:px-6">
        <p>© {new Date().getFullYear()} {site.company.name}. {site.name} is a product of {site.company.name}.</p>
        <nav aria-label="Legal and support" className="flex flex-wrap gap-x-5 gap-y-2">
          {links.map(([label, href]) => (
            <Link key={href} href={href} className="underline-offset-4 hover:text-ink hover:underline">
              {label}
            </Link>
          ))}
          <a href={`mailto:${site.supportEmail}`} className="underline-offset-4 hover:text-ink hover:underline">
            Contact
          </a>
        </nav>
      </div>
    </footer>
  );
}

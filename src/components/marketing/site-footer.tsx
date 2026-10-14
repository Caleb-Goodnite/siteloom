import Link from "next/link";
import { site } from "@/config/site";
import { Logo } from "@/components/ui/logo";
import { competitors } from "@/content/compare";
import { industries } from "@/content/industries";

export function SiteFooter() {
  const year = new Date().getFullYear();
  return (
    <footer className="mt-24 border-t border-line bg-paper-2/60">
      <div className="mx-auto grid max-w-6xl gap-10 px-4 py-14 sm:px-6 md:grid-cols-5">
        <div className="md:col-span-2">
          <Logo />
          <p className="mt-4 max-w-xs text-sm leading-relaxed text-muted">{site.description}</p>
        </div>
        <FooterCol title="Product" links={[["Pricing", "/pricing"], ["Templates", "/templates"], ["Showcase", "/showcase"], ["Guides", "/blog"], ["Start free", "/signup"]]} />
        <FooterCol title="Website builder for" links={industries.slice(0, 8).map((i) => [i.name, `/for/${i.slug}`])} />
        <FooterCol
          title="Compare"
          links={[...competitors.map((c) => [`${site.name} vs ${c.name}`, `/compare/${c.slug}`] as [string, string]), ["All comparisons", "/compare"]]}
        />
      </div>
      <div className="border-t border-line">
        <div className="mx-auto flex max-w-6xl flex-col gap-3 px-4 py-6 text-xs text-muted sm:flex-row sm:items-center sm:justify-between sm:px-6">
          <p>
            © {year} {site.name}. All rights reserved.
          </p>
          <div className="flex flex-wrap gap-4">
            <Link href="/legal/terms" className="hover:text-ink">Terms</Link>
            <Link href="/legal/privacy" className="hover:text-ink">Privacy</Link>
            <Link href="/legal/acceptable-use" className="hover:text-ink">Acceptable use</Link>
            <Link href="/report" className="hover:text-ink">Report abuse</Link>
            <a href={`mailto:${site.supportEmail}`} className="hover:text-ink">Contact</a>
          </div>
        </div>
      </div>
    </footer>
  );
}

function FooterCol({ title, links }: { title: string; links: [string, string][] }) {
  return (
    <div>
      <h2 className="text-xs font-semibold uppercase tracking-wider text-ink">{title}</h2>
      <ul className="mt-4 space-y-2.5">
        {links.map(([label, href]) => (
          <li key={href}>
            <Link href={href} className="text-sm text-ink-2 hover:text-ink">
              {label}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}

import Link from "next/link";
import { site } from "@/config/site";
import { Logo } from "@/components/ui/logo";
import { competitors } from "@/content/compare";
import { industries } from "@/content/industries";

export function SiteFooter() {
  const year = new Date().getFullYear();
  return (
    <footer className="mt-24 border-t border-line bg-paper-2/60">
      <div className="mx-auto grid max-w-6xl gap-10 px-4 py-14 sm:px-6 md:grid-cols-3 lg:grid-cols-6">
        <div className="md:col-span-3 lg:col-span-2">
          <Logo />
          <p className="mt-4 max-w-xs text-sm leading-relaxed text-muted">{site.description}</p>
        </div>
        <FooterCol
          title="Product"
          links={[
            ["Pricing", "/pricing"],
            ["About Curblit", "/about"],
            ["Templates", "/templates"],
            ["Website redesign", "/redesign"],
            ["SEO website builder", "/seo"],
            ["Free website grader", "/tools/website-grader"],
            ["Showcase", "/showcase"],
            ["Guides", "/blog"],
            ["Start free", "/signup"],
          ]}
        />
        <FooterCol title="Website builder for" links={industries.slice(0, 8).map((i) => [i.name, `/for/${i.slug}`])} />
        <FooterCol
          title="Compare"
          links={[...competitors.slice(0, 7).map((c) => [`${site.name} vs ${c.name}`, `/compare/${c.slug}`] as [string, string]), ["All comparisons", "/compare"]]}
        />
        <FooterCol
          title="Legal & support"
          links={[
            ["Terms", "/legal/terms"],
            ["Privacy", "/legal/privacy"],
            ["Acceptable use", "/legal/acceptable-use"],
            ["Report abuse", "/report"],
            ["Contact", `mailto:${site.supportEmail}`],
            ...site.social.map((u): [string, string] => [socialLabel(u), u]),
          ]}
        />
      </div>
      <div className="border-t border-line">
        <div className="mx-auto flex max-w-6xl px-4 py-6 text-xs text-muted sm:px-6">
          <p>
            © {year} {site.company.name}. {site.name} is a product of{" "}
            <a href={site.company.url} className="underline underline-offset-2 hover:text-ink">
              {site.company.name}
            </a>
            .
          </p>
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

function socialLabel(url: string) {
  const host = new URL(url).hostname.replace(/^www\./, "");
  const names: Record<string, string> = {
    "x.com": "X",
    "twitter.com": "X",
    "instagram.com": "Instagram",
    "facebook.com": "Facebook",
    "linkedin.com": "LinkedIn",
    "youtube.com": "YouTube",
    "tiktok.com": "TikTok",
  };
  return names[host] ?? host;
}

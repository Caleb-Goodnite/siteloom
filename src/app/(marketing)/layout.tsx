import { MarketingHeader } from "@/components/marketing/marketing-header";
import { SiteFooter } from "@/components/marketing/site-footer";

// No cookies are read here, so every marketing page can be prerendered. The header switches to
// the dashboard navigation on the client for signed-in visitors (see MarketingHeader).
export default function MarketingLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <MarketingHeader />
      <main id="main">{children}</main>
      <SiteFooter />
    </>
  );
}

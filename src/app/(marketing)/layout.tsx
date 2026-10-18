import { SiteFooter } from "@/components/marketing/site-footer";
import { SiteHeader } from "@/components/marketing/site-header";
import { AppShell } from "@/components/app/app-shell";
import { getProfile, getSessionUser } from "@/lib/auth";

export default async function MarketingLayout({ children }: { children: React.ReactNode }) {
  // Keep the public pages crawlable, but let signed-in users move between them
  // and the dashboard without the app navigation unexpectedly changing.
  const user = await getSessionUser();
  if (user) {
    const profile = await getProfile(user.id);
    return <AppShell profile={profile}>{children}</AppShell>;
  }

  return (
    <>
      <SiteHeader />
      <main id="main">{children}</main>
      <SiteFooter />
    </>
  );
}

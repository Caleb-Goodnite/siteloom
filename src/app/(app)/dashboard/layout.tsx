import type { Metadata } from "next";
import { AppShell } from "@/components/app/app-shell";
import { getProfile, requireUser } from "@/lib/auth";

export const metadata: Metadata = { title: "Dashboard", robots: { index: false } };

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const user = await requireUser("/dashboard");
  const profile = await getProfile(user.id);
  return <AppShell profile={profile}>{children}</AppShell>;
}

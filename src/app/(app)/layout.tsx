// Everything under (app) is per-user: never prerender or cache it.
export const dynamic = "force-dynamic";

export default function AppGroupLayout({ children }: { children: React.ReactNode }) {
  return children;
}

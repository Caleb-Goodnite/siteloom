import type { Metadata } from "next";
import { Suspense } from "react";
import { ReportForm } from "./report-form";

export const metadata: Metadata = {
  title: "Report abuse",
  description: "Report a website hosted on Curblit that you believe is phishing, a scam, malware or otherwise breaks our rules.",
  alternates: { canonical: "/report" },
  robots: { index: false },
};

export default function ReportPage() {
  return (
    <div className="mx-auto max-w-xl px-4 pt-16 sm:px-6">
      <h1 className="font-display text-5xl text-ink">Report a site</h1>
      <p className="mt-3 text-ink-2">
        If a site hosted on Curblit is impersonating someone, phishing, scamming or distributing malware, tell us. We review every report,
        and serious reports can take a site offline automatically while we investigate.
      </p>
      <Suspense>
        <ReportForm />
      </Suspense>
    </div>
  );
}

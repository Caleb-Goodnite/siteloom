import type { Metadata } from "next";
import { Suspense } from "react";
import { UnsubscribeForm } from "./unsubscribe-form";

export const metadata: Metadata = { title: "Unsubscribe", robots: { index: false } };

export default function UnsubscribePage() {
  return (
    <div className="mx-auto max-w-md px-4 pt-20 text-center sm:px-6">
      <h1 className="font-display text-5xl text-ink">Email preferences</h1>
      <Suspense>
        <UnsubscribeForm />
      </Suspense>
    </div>
  );
}

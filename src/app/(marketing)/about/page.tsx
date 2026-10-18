import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, Check, Download, ReceiptText, Search } from "lucide-react";
import { site } from "@/config/site";

export const metadata: Metadata = {
  title: { absolute: "About Curblit — a simpler way to get your business online" },
  description:
    "Curblit is a website builder from Anchorforge Digital, made to help small businesses launch and improve a useful, search-ready website without needing to code.",
  alternates: { canonical: "/about" },
};

const principles = [
  {
    icon: Search,
    title: "Make the important parts clear",
    body: "A business site should explain what you do, where you work and how a customer can reach you. Curblit helps turn your business details into clear pages and handles common technical SEO setup.",
  },
  {
    icon: ReceiptText,
    title: "Show the cost up front",
    body: "AI requests show their credit cost before you send them. A failed request or one that makes no changes is refunded, and editing text directly is free.",
  },
  {
    icon: Download,
    title: "Let you take your site with you",
    body: "Download a production-ready copy of your static site whenever you want. Your website should not be trapped in the tool you used to make it.",
  },
];

export default function AboutPage() {
  return (
    <div className="px-4 sm:px-6">
      <section className="mx-auto max-w-3xl pt-16 sm:pt-24">
        <p className="text-sm font-semibold text-accent-ink">About Curblit</p>
        <h1 className="mt-3 font-display text-5xl leading-[1.02] text-ink sm:text-7xl">
          A better starting point for your business website.
        </h1>
        <p className="mt-6 text-lg leading-relaxed text-ink-2">
          Curblit is a website builder from {site.company.name}. It helps small businesses get a custom, multi-page site online without having to start with a blank canvas, learn code or figure out every technical SEO setting themselves.
        </p>
        <p className="mt-4 leading-relaxed text-ink-2">
          Tell Curblit what your business does and who it serves. Then refine the result by chatting, clicking text to edit it, or working directly with the code. Hosting, contact forms, analytics and search basics come together in one place.
        </p>
      </section>

      <section className="mx-auto mt-14 grid max-w-5xl gap-4 md:grid-cols-3" aria-label="How Curblit is designed">
        {principles.map(({ icon: Icon, title, body }) => (
          <article key={title} className="rounded-2xl border border-line bg-card p-6">
            <Icon className="size-5 text-accent" aria-hidden="true" />
            <h2 className="mt-4 text-lg font-semibold text-ink">{title}</h2>
            <p className="mt-2 text-sm leading-relaxed text-ink-2">{body}</p>
          </article>
        ))}
      </section>

      <section className="mx-auto mt-14 max-w-3xl rounded-2xl border border-line bg-paper-2/60 p-6 sm:p-8">
        <h2 className="font-display text-3xl text-ink">A real business, with a real way to reach us.</h2>
        <p className="mt-3 leading-relaxed text-ink-2">
          {site.name} is operated under the business name {site.company.name}. If you need help or want to report a problem, contact our support inbox and a person will review your message.
        </p>
        <a className="mt-5 inline-flex items-center gap-2 font-medium text-ink underline underline-offset-4" href={`mailto:${site.supportEmail}`}>
          Contact support <ArrowRight className="size-4" aria-hidden="true" />
        </a>
      </section>

      <section className="mx-auto mb-20 mt-14 max-w-3xl" aria-label="Explore Curblit">
        <h2 className="font-display text-3xl text-ink">See if it fits your business.</h2>
        <div className="mt-5 flex flex-wrap gap-x-6 gap-y-3 text-sm font-medium">
          <Link href="/pricing" className="inline-flex items-center gap-1 text-ink underline underline-offset-4">
            View plans <ArrowRight className="size-4" aria-hidden="true" />
          </Link>
          <Link href="/tools/website-grader" className="inline-flex items-center gap-1 text-ink underline underline-offset-4">
            Grade your current site <ArrowRight className="size-4" aria-hidden="true" />
          </Link>
          <span className="inline-flex items-center gap-1 text-muted"><Check className="size-4" aria-hidden="true" /> Free to try</span>
        </div>
      </section>
    </div>
  );
}

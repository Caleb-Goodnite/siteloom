import { ChevronDown } from "lucide-react";
import { JsonLd } from "./json-ld";

/** Accessible FAQ (native <details>) with FAQPage structured data. */
export function Faq({ items, title = "Frequently asked questions" }: { items: { q: string; a: string }[]; title?: string }) {
  return (
    <section className="mx-auto max-w-3xl" aria-labelledby="faq-title">
      <h2 id="faq-title" className="text-center font-display text-4xl text-ink sm:text-5xl">
        {title}
      </h2>
      <div className="mt-10 divide-y divide-line rounded-2xl border border-line bg-card">
        {items.map((item) => (
          <details key={item.q} className="group px-5 py-4 [&_summary::-webkit-details-marker]:hidden">
            <summary className="flex cursor-pointer list-none items-center justify-between gap-4 text-left font-medium text-ink">
              {item.q}
              <ChevronDown className="size-4 shrink-0 text-muted transition-transform group-open:rotate-180" />
            </summary>
            <p className="mt-3 text-[15px] leading-relaxed text-ink-2">{item.a}</p>
          </details>
        ))}
      </div>
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@type": "FAQPage",
          mainEntity: items.map((i) => ({ "@type": "Question", name: i.q, acceptedAnswer: { "@type": "Answer", text: i.a } })),
        }}
      />
    </section>
  );
}

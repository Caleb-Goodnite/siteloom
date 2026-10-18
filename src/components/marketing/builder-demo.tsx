import { Check, FileCode2, Monitor, MousePointerClick, Sparkles } from "lucide-react";
import { site } from "@/config/site";

/** Static illustration of the builder (pure HTML/CSS, no images) used on the home page. */
export function BuilderDemo() {
  return (
    <div className="relative mx-auto max-w-5xl">
      <div className="absolute -inset-x-10 -top-10 -bottom-6 -z-10 rounded-[48px] bg-[radial-gradient(ellipse_at_top,rgba(255,90,31,0.14),transparent_60%)]" />
      <div className="overflow-hidden rounded-[22px] border border-line-2 bg-card shadow-[0_40px_100px_-40px_rgba(28,25,23,0.45)]">
        <div className="flex items-center gap-2 border-b border-line bg-paper/70 px-4 py-2.5">
          <span className="size-2.5 rounded-full bg-[#ff5f57]" />
          <span className="size-2.5 rounded-full bg-[#febc2e]" />
          <span className="size-2.5 rounded-full bg-[#28c840]" />
          <div className="mx-auto flex items-center gap-2 rounded-full border border-line bg-card px-3 py-1 text-[11px] text-muted">
            <span className="size-1.5 rounded-full bg-ok" /> brightsmile.{site.sitesDomain === "localhost:3000" ? "curblit.site" : site.sitesDomain}
          </div>
        </div>
        <div className="grid md:grid-cols-[300px_1fr]">
          {/* chat */}
          <div className="hidden flex-col gap-3 border-r border-line bg-paper/40 p-4 text-[13px] md:flex">
            <div className="ml-6 rounded-2xl rounded-tr-md bg-ink px-3.5 py-2.5 text-white">
              A site for Bright Smile Dental in Columbus — services, insurance, team and an appointment form. Calm teal.
            </div>
            <div className="rounded-2xl rounded-tl-md border border-line bg-card px-3.5 py-2.5 text-ink-2">
              I&apos;ll build a calm, trustworthy 5-page site with an appointment request form and Dentist structured data.
              <div className="mt-2.5 space-y-1.5">
                {["partials/header.html", "index.html", "services.html", "insurance.html", "contact.html"].map((f, i) => (
                  <div key={f} className="flex items-center gap-2 rounded-lg bg-paper-2/70 px-2 py-1 font-mono text-[11px]">
                    {i < 4 ? <Check className="size-3 text-ok" /> : <span className="size-3 animate-pulse rounded-full bg-accent/70" />}
                    {f}
                  </div>
                ))}
              </div>
            </div>
            <div className="mt-auto rounded-xl border border-line bg-card p-2.5 text-muted">
              <div className="flex items-center gap-1.5 text-[11px]">
                <MousePointerClick className="size-3.5" /> Click any text to edit it — free
              </div>
            </div>
          </div>
          {/* preview */}
          <div className="bg-[#f3f8f7]">
            <div className="flex items-center justify-between border-b border-[#dbe9e6] bg-white px-6 py-3.5">
              <span className="font-display text-lg text-[#0f3d3a]">Bright Smile Dental</span>
              <div className="hidden gap-5 text-[12px] text-[#3c5f5b] sm:flex">
                <span className="font-semibold text-[#0f766e]">Home</span>
                <span>Services</span>
                <span>Team</span>
                <span>Insurance</span>
              </div>
              <span className="rounded-full bg-[#0f766e] px-3 py-1.5 text-[11px] font-semibold text-white">Book a visit</span>
            </div>
            <div className="grid gap-6 px-6 py-8 sm:grid-cols-[1.1fr_1fr] sm:px-10 sm:py-12">
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[#0f766e]">Family dentistry · Columbus, OH</p>
                <p className="mt-3 font-display text-3xl leading-[1.05] text-[#0f3d3a] sm:text-[40px]">
                  Gentle dental care for the whole family
                </p>
                <p className="mt-3 max-w-sm text-[13px] leading-relaxed text-[#3c5f5b]">
                  Same-week appointments, transparent pricing and a team that takes nervous patients seriously.
                </p>
                <div className="mt-5 flex gap-2">
                  <span className="rounded-full bg-[#0f766e] px-4 py-2 text-[12px] font-semibold text-white">Request an appointment</span>
                  <span className="rounded-full border border-[#b9d6d1] bg-white px-4 py-2 text-[12px] text-[#0f3d3a]">
                    <mark className="rounded bg-amber-200 px-1 text-amber-900">[[Phone number]]</mark>
                  </span>
                </div>
              </div>
              <div className="relative min-h-40 overflow-hidden rounded-2xl bg-[linear-gradient(135deg,#cfe7e3,#9cc9c2)]">
                <div className="absolute bottom-3 left-3 right-3 rounded-xl bg-white/90 p-3 text-[11px] text-[#0f3d3a] shadow">
                  <div className="font-semibold">Accepting new patients</div>
                  <div className="text-[#3c5f5b]">Delta Dental · Cigna · Aetna</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      <div className="pointer-events-none absolute -right-2 top-24 hidden rotate-2 rounded-xl border border-line bg-card px-3 py-2 text-xs shadow-lg lg:block">
        <div className="flex items-center gap-1.5 font-medium text-ink">
          <Sparkles className="size-3.5 text-accent" /> SEO score 96
        </div>
        <div className="text-muted">Titles · schema · sitemap ✓</div>
      </div>
      <div className="pointer-events-none absolute -bottom-5 -left-6 hidden -rotate-2 rounded-xl border border-line bg-card px-3 py-2 text-xs shadow-lg lg:block">
        <div className="flex items-center gap-1.5 font-medium text-ink">
          <FileCode2 className="size-3.5 text-accent" /> Plain HTML, 0 KB framework JS
        </div>
        <div className="flex items-center gap-1 text-muted">
          <Monitor className="size-3" /> Loads instantly on any phone
        </div>
      </div>
    </div>
  );
}

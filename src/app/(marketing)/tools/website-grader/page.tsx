import type { Metadata } from "next";
import Link from "next/link";
import { Faq } from "@/components/marketing/faq";
import { JsonLd } from "@/components/marketing/json-ld";
import { WebsiteGrader } from "@/components/marketing/website-grader";
import { site } from "@/config/site";

export const metadata: Metadata = {
  title: "Free Website Grader: SEO Check for Small Business Sites",
  description: "Check your website the way Google and AI search see it. Free instant SEO score with plain-English fixes for titles, speed, mobile, schema and more.",
  alternates: { canonical: "/tools/website-grader" },
};

const FAQS = [
  { q: "Is the website grader really free?", a: "Yes. No sign-up, no email required. Grade as many of your pages as you like (within a fair hourly limit)." },
  { q: "What does it check?", a: "Whether your text is readable without JavaScript, your page title and meta description, headings, word count, structured data, image alt text, HTTPS, mobile viewport, server speed, sitemap.xml, robots.txt, social previews, canonical tags and whether visitors can contact you in one tap." },
  { q: "Why does “readable without JavaScript” matter?", a: "Many modern sites build their content in the browser with JavaScript. Google indexes that slowly in a second pass, and most AI search crawlers don't run JavaScript at all, so that content can be invisible to them. Plain HTML is read instantly by everyone." },
  { q: "My score is low. What now?", a: "Each failed check explains what to fix. If you'd rather not do it by hand, Curblit can rebuild your site with your existing content and every check handled automatically. That's free to try." },
  { q: "Does a perfect score guarantee rankings?", a: "No. These are the technical foundations. Rankings also depend on content quality, reviews, links and competition. But a site that fails these basics is at a real disadvantage." },
];

export default function WebsiteGraderPage() {
  return (
    <div className="px-4 pt-14 sm:px-6">
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@type": "WebApplication",
          name: `${site.name} Website Grader`,
          url: `${site.url}/tools/website-grader`,
          applicationCategory: "BusinessApplication",
          operatingSystem: "Web",
          offers: { "@type": "Offer", price: 0, priceCurrency: "USD" },
        }}
      />
      <div className="mx-auto max-w-3xl text-center">
        <p className="text-sm font-semibold text-accent-ink">Free tool</p>
        <h1 className="mt-3 font-display text-5xl leading-[1] text-ink sm:text-7xl">Is your website invisible to Google?</h1>
        <p className="mx-auto mt-5 max-w-xl text-lg text-ink-2">
          Get an instant score for your site, checked the way search engines and AI assistants actually read it, with plain-English fixes.
        </p>
      </div>
      <div className="mt-10">
        <WebsiteGrader />
      </div>

      <section className="prose-sl mx-auto mt-24 max-w-2xl">
        <h2>What a search engine sees on your site</h2>
        <p>
          When Google, Bing or an AI assistant visits your website, it doesn&apos;t see your design. It reads the HTML your server sends.
          This grader fetches that HTML exactly the way a crawler does, with no JavaScript, and checks the fundamentals that decide whether
          you show up at all.
        </p>
        <h3>The checks that matter most</h3>
        <ul>
          <li><strong>Readable without JavaScript.</strong> If your words only appear after scripts run, many crawlers never see them.</li>
          <li><strong>Title and meta description.</strong> They become your headline and snippet in search results, and they decide whether people click.</li>
          <li><strong>Structured data.</strong> It tells Google you&apos;re a dentist in Columbus open Monday to Friday, not just a page of text.</li>
          <li><strong>Sitemap and robots.txt.</strong> They help new pages get found fast, and a leftover &quot;Disallow: /&quot; can hide your entire site.</li>
          <li><strong>Mobile and speed.</strong> Most local searches happen on phones, and Google indexes the mobile version first.</li>
        </ul>
        <p>
          Want the full walkthrough? Read <Link href="/blog/ai-built-website-not-showing-on-google">why your website isn&apos;t showing up on Google</Link>.
        </p>
      </section>

      <section className="mt-20">
        <Faq items={FAQS} title="Website grader FAQ" />
      </section>
    </div>
  );
}

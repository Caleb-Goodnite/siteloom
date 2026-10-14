/**
 * Cornerstone articles. Each targets a real, recurring search problem our product solves.
 * Write for people first; keep claims verifiable.
 */
export type Post = {
  slug: string;
  title: string;
  description: string;
  date: string;
  author: string;
  readingMinutes: number;
  body: string;
};

export const posts: Post[] = [
  {
    slug: "ai-built-website-not-showing-on-google",
    title: "Why your AI-built website isn't showing up on Google (and how to fix it)",
    description:
      "AI website builders make it easy to launch, but many sites never get indexed. Here are the seven most common causes and the exact fixes, in order of impact.",
    date: "2026-10-14",
    author: "The Siteloom team",
    readingMinutes: 8,
    body: `You described your business, an AI built a good-looking website, you published it… and weeks later, searching for your business name returns nothing. This is one of the most common complaints about AI-built sites, and it's almost always fixable.

Here are the causes we see most often, roughly in order of how much they hurt.

## 1. Your content is rendered by JavaScript

Many AI builders produce single-page applications: the server sends a nearly empty HTML file and JavaScript builds the page in the browser. Google *can* run JavaScript, but it does so in a second, delayed pass — and many other crawlers, including most AI assistants' crawlers, don't run it at all.

**How to check:** open your site, right-click → *View Page Source* (not Inspect). If you can't find your headline and paragraphs in that source, crawlers may not either.

**Fix:** serve real HTML. Use server-side rendering or prerendering, or a builder that outputs static HTML. (Siteloom publishes plain static HTML for exactly this reason.)

## 2. Every page has the same title and description

If every URL says \`<title>Home</title>\`, Google has no idea what each page is about and may treat pages as duplicates.

**Fix:** give each page a unique title of roughly 50–60 characters that names the topic and your location or brand — "Emergency Plumber in Tempe, AZ | Rapid Flow Plumbing" — and a unique 120–160 character meta description.

## 3. There's no sitemap, or Google doesn't know about it

A sitemap.xml lists every page you want indexed. Without one, new sites with few inbound links can wait a long time to be discovered.

**Fix:** generate a sitemap, reference it in robots.txt, and submit it in [Google Search Console](https://search.google.com/search-console). Then use the *URL Inspection* tool on your home page and click *Request indexing*.

## 4. robots.txt or a noindex tag is blocking crawlers

Staging settings sometimes leak into production: a \`Disallow: /\` in robots.txt, or a \`<meta name="robots" content="noindex">\` tag.

**Fix:** check \`yoursite.com/robots.txt\` and your page source for "noindex".

## 5. Thin content

A hero, three icons and a contact button isn't much for a search engine to rank. Pages under about 300 words rarely rank for anything competitive.

**Fix:** write genuinely useful copy: what you offer, who it's for, where you work, what it costs (even a range), and answers to the questions customers actually ask. FAQ sections are especially valuable — search engines and AI assistants quote them directly.

## 6. No structured data

Structured data (JSON-LD) tells search engines, in a machine-readable way, that you're a dentist in Columbus open Monday to Friday. It's what powers rich results.

**Fix:** add the right schema.org type — \`LocalBusiness\` or a more specific one like \`Dentist\`, \`Restaurant\` or \`Plumber\` — with your name, address, phone and hours. Add \`FAQPage\` markup to FAQ sections.

## 7. Your site is brand new and nobody links to it

Even a perfect site needs signals that it exists.

**Fix:** create and verify a Google Business Profile with the *exact* same name, address and phone number as your site. Add your website to your social profiles and any local directories or associations you belong to.

## A five-minute checklist

- View source: is your text in the HTML?
- Unique title and description on every page
- sitemap.xml exists and is submitted in Search Console
- No "noindex" and no \`Disallow: /\`
- 300+ useful words on key pages
- LocalBusiness (or similar) JSON-LD on the home page
- Google Business Profile created and matching

Siteloom handles the technical items automatically on every publish — static HTML, unique titles checked by the built-in SEO panel, sitemap.xml, robots.txt, canonical URLs, structured data and social cards — so you can spend your time on the part only you can do: telling customers why you're the right choice.`,
  },
  {
    slug: "static-html-vs-javascript-apps-for-small-business-websites",
    title: "Static HTML vs. JavaScript apps: what your small business website should be in 2026",
    description:
      "AI tools can now build either a full JavaScript app or a classic static website. For most businesses, the right answer is clear — here's why, and when it isn't.",
    date: "2026-10-14",
    author: "The Siteloom team",
    readingMinutes: 6,
    body: `When you ask an AI to "build me a website," the tool decides something important on your behalf: whether you get a **static website** (HTML files a server simply hands to the browser) or a **JavaScript application** (code that runs in the browser to build the page).

Both can look identical. They behave very differently.

## What a static site is good at

**Speed.** There's nothing to compute: the server sends finished HTML, usually from a CDN close to the visitor. On a mid-range phone over a weak connection, that difference is felt.

**Being read.** Every crawler — Google, Bing, social previews, and the crawlers behind AI assistants — can read static HTML immediately. Many of them do not run JavaScript at all.

**Security and cost.** No database, no server code, no login to break into. Hosting is cheap and nearly impossible to take down with traffic spikes.

**Longevity.** HTML from 2005 still renders today. A static site doesn't need dependency upgrades to keep working.

## What a JavaScript app is good at

**Being software.** Logins, dashboards, real-time data, carts with complex logic, anything personalized per user — that's application territory.

## The rule of thumb

If visitors mostly **read** your site and then **contact** you, call you, book or buy through a link, you want a static site. That covers restaurants, clinics, trades, agencies, consultants, nonprofits, portfolios and most SaaS *marketing* sites.

If visitors **log in and use** your site, you want an app — ideally with a separate static marketing site in front of it.

## "But I need a contact form"

This used to be the reason people reached for a backend. It isn't anymore: modern hosts handle form submissions for static sites. On Siteloom, any form you ask for is delivered to an inbox in your dashboard (and to your email on paid plans), with spam protection built in — no server code needed.

## "But I want it to feel interactive"

Menus, accordions, tabs, carousels and subtle animations don't need an app framework. A few kilobytes of JavaScript sprinkled onto static HTML handle them while keeping all the content crawlable.

## Bottom line

For a business website in 2026, static HTML isn't old-fashioned; it's the fastest, most visible and most durable choice. Choose an app only when you're building software.`,
  },
  {
    slug: "how-to-prompt-an-ai-website-builder",
    title: "How to write a prompt that gets you a great website on the first try",
    description:
      "Most wasted AI credits come from vague first prompts and long chains of fixes. Use this five-part template to get a site you're happy with in one or two messages.",
    date: "2026-10-14",
    author: "The Siteloom team",
    readingMinutes: 5,
    body: `With AI website builders, the first prompt does most of the work. A vague request leads to a generic site, and every "no, not like that" costs time and credits. A specific request lands close on the first try.

Here's the template we recommend.

## The five-part prompt

**1. Who you are and where.** Business name, what you do, city or region.

> Bright Smile Dental, a family dental practice in Columbus, OH.

**2. Who it's for and what they should do.** Your customers and the one action that matters most.

> For families and nervous first-time patients. The main goal is appointment requests.

**3. Pages.** List them. Most businesses need three to five.

> Home, Services, Meet the team, New patients & insurance, Contact.

**4. Must-have content.** The facts only you know — services, areas, hours, insurance, prices (or "prices on request").

> Services: cleanings, whitening, implants, Invisalign, emergency care. We accept Delta Dental, Cigna and Aetna. Open Mon–Fri 8–5.

**5. Style.** A mood, a couple of colors, and a reference if you have one.

> Calm and clean, soft teal and white, friendly but professional.

Put together, that's a short paragraph — and it's the difference between "a dental website" and *your* dental website.

## Tips that save credits

- **Give real details up front.** If you don't, a good builder will leave placeholders like [[Phone number]] rather than inventing them — but you'll have to fill them in later.
- **Fix wording by clicking it, not by prompting.** On Siteloom, click any text in the preview and type. It's free.
- **Use the right model for the job.** Use a fast, cheap model for small tweaks ("make the button say Book now") and the standard model for new pages or redesigns.
- **Point at things.** Select the element you want changed instead of describing where it is.
- **Batch small changes.** "Make the header sticky, change the CTA to Book now, and add our Instagram to the footer" is one message, not three.
- **Use Enhance.** Siteloom's free *Enhance prompt* button turns a one-liner into a structured brief like the one above.

## A complete example

> A website for Casa Lumbre, a modern Mexican restaurant in East Austin, TX. For locals and visitors looking for dinner and weekend brunch; the main goal is reservation requests. Pages: home, menu (tacos, mains, brunch, drinks — prices as placeholders), our story, private events with an inquiry form, and contact with hours and a map link. Warm rustic-modern style: terracotta, cream and deep green, a characterful serif for headings.

That prompt typically produces a complete, publishable site on the first generation.`,
  },
];

export function getPost(slug: string) {
  return posts.find((p) => p.slug === slug);
}

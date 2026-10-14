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
    slug: "best-ai-website-builders-2026",
    title: "The best AI website builders in 2026: an honest comparison",
    description:
      "Lovable, v0, Bolt, Wix, Squarespace, Framer, Durable, Hostinger and Siteloom compared by what each is actually best at, so you can pick the right one for your project.",
    date: "2026-10-14",
    author: "The Siteloom team",
    readingMinutes: 9,
    body: `"AI website builder" now covers very different products. Some build software, some generate a template, and some write and design a complete site. The best one depends on what you're making.

**Disclosure:** we make Siteloom, so weigh our take accordingly. We've tried to say plainly where other tools are the better choice, and products change fast, so check each vendor's site for current features and pricing.

## First, decide what you're building

- **A website** for a business, practice, restaurant, creator or product: visitors read, then call, book, buy or sign up.
- **An app**: users log in, data is stored per user, there are dashboards and custom logic.

Most small businesses need a website. Founders validating software need an app. The tools below split along that line.

## AI app builders

### Lovable
Generates full-stack React applications, typically with Supabase for authentication and data. It's excellent for prototyping SaaS ideas and internal tools. Credit usage varies by request, and users frequently mention paying for "fix loops" on complex projects. **Best for:** founders building an app MVP.

### Bolt.new
An AI-powered development environment in the browser that works across many frameworks. It's powerful if you want to see and steer the code. **Best for:** developers who want AI help inside a real coding workflow.

### v0
Vercel's AI UI generator produces high-quality React and Next.js interfaces, often using shadcn/ui components. **Best for:** front-end developers building app UIs, especially on Vercel.

## Traditional builders with AI features

### Wix
A huge ecosystem: drag-and-drop editing, AI site creation, bookings, stores and an app market. **Best for:** people who want a visual editor and lots of built-in business tools.

### Squarespace
Polished templates, plus commerce, scheduling and email campaigns in one subscription. **Best for:** design-conscious owners happy to pick a template and edit it visually.

### Hostinger and GoDaddy
Budget-friendly builders bundled with hosting, domains and email, with AI that gets a simple site up quickly. **Best for:** the lowest price and one account for everything.

## Design-first and quick-start builders

### Framer
A designer's canvas with great animations and a CMS. **Best for:** designers who want control and motion.

### Durable
Generates a simple business site in seconds and bundles extras like a CRM and invoicing. **Best for:** getting something online immediately.

## Siteloom
Our focus is the site itself for businesses that need to be found: multi-page sites designed and written for your business, published as fast static HTML that Google and AI search can read, with SEO, working forms, analytics and hosting built in. Each AI message shows its price before you send it, you aren't charged when nothing changes, and text edits are free. You can also paste your current website to have it redesigned with your real content. **Best for:** small businesses, local services, restaurants, clinics, freelancers and SaaS marketing sites.

## Quick picks

| If you need… | Consider |
| --- | --- |
| A web app with logins and a database | Lovable, Bolt |
| React UI components for an app | v0 |
| A visual editor plus built-in store or bookings | Wix, Squarespace |
| The lowest monthly price | Hostinger, GoDaddy |
| Pixel-level design and animation | Framer, Webflow |
| A business website that ranks, written for you | Siteloom |

Whatever you choose, check one thing before you commit: open your published site, right-click, choose **View Page Source**, and make sure your text is actually there. If it isn't, search engines may struggle to see it. You can also run any site through our [free website grader](/tools/website-grader).`,
  },
  {
    slug: "how-much-does-a-small-business-website-cost",
    title: "How much does a small business website cost in 2026?",
    description:
      "Realistic price ranges for DIY builders, AI builders, freelancers and agencies, plus the ongoing costs people forget: domain, hosting, email and updates.",
    date: "2026-10-14",
    author: "The Siteloom team",
    readingMinutes: 7,
    body: `The honest answer is anywhere from free to tens of thousands of dollars. What you're really choosing is **who does the work**: you, software, a freelancer or an agency. Here's how the options compare, using typical ranges (quotes vary widely by region and scope).

## The four ways to get a website

### 1. DIY website builder: typically $10–50/month
You pick a template and fill it in yourself. **Pros:** cheap and fast to start. **Cons:** you're the designer and copywriter, and many sites end up looking like their template.

### 2. AI website builder: free to roughly $10–80/month
You describe your business and the software designs and writes the site. The good ones produce multiple pages with real copy, then let you refine by asking for changes. **Pros:** the fastest route to a professional-looking site, at a fraction of the cost of hiring. **Cons:** quality varies a lot between tools, so check that your text is in the page source (search engines need it) and that you can export your site if you leave.

### 3. Freelancer: typically $1,500–8,000 one-time
A designer or developer builds a custom site. **Pros:** a human who understands your goals. **Cons:** quality varies, timelines slip, and every later change means another invoice unless you agree on maintenance.

### 4. Agency: typically $8,000–50,000+
A team handles strategy, design, copy, development and often SEO. **Pros:** the most thorough option. **Cons:** cost and time. Usually only worth it for larger businesses or complex sites.

## Ongoing costs people forget

| Item | Typical cost |
| --- | --- |
| Domain name (.com) | $10–25/year |
| Hosting | $0–30/month (often included in builders) |
| Business email | $6–12 per user/month |
| SSL certificate | Usually free now |
| Updates and changes | Your time, or $50–150/hour from a freelancer |
| Premium plugins/apps | $0–50/month |

## What actually drives the price

- **Number of pages.** A one-page site and a 15-page site with a page per service are different projects.
- **Copywriting.** Writing good, specific copy is often the most time-consuming part.
- **Integrations.** Booking, payments, menus, client portals.
- **E-commerce.** Product catalogs, shipping and tax add real complexity.

## How to spend wisely

1. **Start with what brings customers:** clear services, location, proof you're real, and an easy way to contact or book.
2. **Make sure search engines can read it.** Run your site through a [free website grader](/tools/website-grader) and fix the basics.
3. **Own your domain** in your own name, whoever builds the site.
4. **Make sure you can leave.** Ask whether you can export your site if you switch providers.

For most local businesses, an AI builder that writes real copy and handles SEO basics gets you 90% of an agency site for a few dollars a month. Spend the rest on photos and on collecting reviews.`,
  },
  {
    slug: "local-seo-checklist",
    title: "The local SEO checklist for small businesses (2026)",
    description:
      "A practical, step-by-step checklist to show up in Google Maps and local search: Google Business Profile, your website, reviews, citations and the details that move rankings.",
    date: "2026-10-14",
    author: "The Siteloom team",
    readingMinutes: 8,
    body: `When someone searches "plumber near me" or "best tacos east austin", Google picks a handful of businesses for the map pack and the results below it. Local SEO is how you become one of them. Here's the checklist we'd follow for any local business, in order of impact.

## 1. Google Business Profile (biggest impact)

- [ ] **Claim and verify** your profile at business.google.com.
- [ ] Choose the most specific **primary category** ("Pediatric dentist", not just "Dentist") and add relevant secondary categories.
- [ ] Fill in **every field**: hours (including holiday hours), services, service areas, attributes, booking link.
- [ ] Add **real photos** regularly: exterior, interior, team, work. Profiles with fresh photos tend to get more engagement.
- [ ] Use **Posts** for offers, events and updates.
- [ ] Answer common questions in the **Q&A** section yourself.

## 2. Consistent name, address and phone (NAP)

- [ ] Your business name, address and phone number are **identical** on your website, Google profile, Facebook, Yelp, Apple Maps, Bing Places and industry directories.
- [ ] Use the same format everywhere ("Suite 200", not "Ste 200" in one place and "#200" in another).

## 3. Your website

- [ ] Each **service has its own page** ("Emergency plumbing in Phoenix"), not just a bullet in a list.
- [ ] The home page **title and H1 mention your main service and city**.
- [ ] Your **address and phone are in the footer** of every page, as text, not inside an image.
- [ ] **LocalBusiness structured data** (or a more specific type like Dentist or Restaurant) with your name, address, phone, hours and geo-coordinates.
- [ ] A **page per area you serve**, if you travel to customers, each with genuinely local content.
- [ ] **Fast and mobile-friendly.** Most local searches are on phones.
- [ ] Your content is **readable without JavaScript**. Check with our [free website grader](/tools/website-grader).

## 4. Reviews

- [ ] **Ask every happy customer.** Send a direct review link right after a great experience.
- [ ] **Reply to every review**, good and bad, politely and specifically.
- [ ] Never buy or fake reviews. It violates Google's policies and, in the US, FTC rules.

## 5. Citations and links

- [ ] List your business on major directories (Apple Maps, Bing Places, Yelp, Facebook) and the ones specific to your industry.
- [ ] Get **local links**: chamber of commerce, sponsorships, local news, partner businesses.

## 6. Track it

- [ ] Set up **Google Search Console** and submit your sitemap.
- [ ] Watch **Google Business Profile insights** for calls, direction requests and website clicks.

## The 20-minute version

Short on time? Verify your Google Business Profile, make your name/address/phone identical everywhere, put your city and main service in your home page title, and ask your last ten happy customers for a review. Those four things move the needle more than anything else on this list.`,
  },
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

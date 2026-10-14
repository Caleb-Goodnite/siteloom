# Siteloom launch & growth playbook

What the product does automatically for growth: SEO pages, the free website grader, onboarding emails, referral credits, the "Made with Siteloom" badge on free sites, and the public showcase. This file covers the parts that need you.

---

## 1. Before launch (one afternoon)

- [ ] **Google Search Console** → add `siteloom.app` (Domain property via DNS) → submit `https://siteloom.app/sitemap.xml`.
- [ ] **Bing Webmaster Tools** → import from Search Console (also feeds ChatGPT/Copilot search).
- [ ] **Analytics**: set `NEXT_PUBLIC_PLAUSIBLE_DOMAIN=siteloom.app` (or `NEXT_PUBLIC_GA_ID`). Funnel events already fire: `signup`, `site_created`, `redesign_started`, `grader_used`, `site_published`, `checkout_started`.
- [ ] **Email deliverability**: in Resend, verify your sending domain (SPF + DKIM), add a DMARC record (`v=DMARC1; p=none; rua=mailto:you@…`), set `EMAIL_FROM` and `EMAIL_POSTAL_ADDRESS`.
- [ ] Run `supabase/migrations/0002_lifecycle_emails.sql` in the Supabase SQL editor (onboarding emails).
- [ ] **Stripe live mode**: live keys in Vercel, run `npm run stripe:setup` against production, test a real $12 purchase and refund it.
- [ ] Lawyer review of `/legal/*`; set `NEXT_PUBLIC_LEGAL_ENTITY`.
- [ ] Build and publish 3–5 of your own example sites (dentist, restaurant, plumber, SaaS) and switch on **Show in showcase**. They make `/showcase` real proof.
- [ ] Set `ADMIN_EMAILS` so you get the daily digest and abuse alerts.

## 2. Launch week

### Product Hunt (Tuesday–Thursday, 12:01am PT)
- **Name:** Siteloom
- **Tagline (60 chars):** `AI websites that actually show up on Google`
- **Description:** Describe your business, or paste your current site, and Siteloom designs, writes and publishes a fast multi-page website that Google and AI search can read. Forms, analytics, hosting and SEO are built in. Every message shows its price first, and you're never charged when nothing changes.
- **First comment (as maker):** why you built it. AI app builders are great for apps, but small businesses need *websites* that rank, and most AI-built sites are JavaScript apps that crawlers struggle to read. Mention the free grader: `siteloom.app/tools/website-grader`.
- **Gallery:** 1) the builder mid-generation, 2) before/after of a redesign, 3) the grader result, 4) pricing ("price shown before you send").
- Tell your network the day before; ask people to try it and leave honest feedback (never ask for upvotes; PH penalizes it).

### Show HN
`Show HN: Siteloom – AI website builder that outputs static HTML instead of a React app`. Lead with the technical angle: plan → parallel page writers from one design brief, static output with compiled Tailwind, sandboxed preview, honest placeholders instead of invented facts. Be in the comments all day.

### Communities (give value first; read each sub's self-promotion rules)
- r/SideProject, r/EntrepreneurRideAlong, r/indiehackers: build-in-public story with numbers.
- r/smallbusiness, r/Entrepreneur: **don't post links**; answer "how do I get a website / why isn't my site on Google" questions helpfully, and link the free grader only where genuinely relevant.
- Indie Hackers: launch post + monthly revenue updates.

### Social
- X / LinkedIn thread: "I graded 50 small-business websites. 34 had problems that hide them from Google. Here are the 5 most common →" (run real sites through the grader for this; it's a great recurring content format).

## 3. Directories (list once, earn links + steady traffic)

AI directories: There's An AI For That, Futurepedia, Toolify, Product Hunt.
SaaS directories: AlternativeTo (**list as an alternative to Wix, Squarespace, Lovable, Durable**), SaaSHub, G2, Capterra, BetaList, Uneed, Microlaunch, Indie Hackers products.
Tip: reuse the Product Hunt copy; always link to `/` and `/tools/website-grader`.

## 4. The ongoing growth engine

**SEO content (2 posts/month).** Each targets a question small-business owners actually type. Next topics:
1. How to get your business on Google Maps
2. Restaurant website must-haves (menu SEO)
3. Website vs. Facebook page for a small business
4. How to write a homepage that converts
5. Google Business Profile optimization guide
6. Best website builder for contractors / plumbers / dentists (one per industry, linking the `/for/*` page)
7. How to move from Wix (or Squarespace or GoDaddy) without losing rankings
8. What is schema markup (for non-technical owners)
9. How long does it take to show up on Google?
10. Small business website checklist (printable)
11. AI search (ChatGPT, Perplexity) and your business: how to get mentioned
12. Website accessibility basics for small businesses

Add posts in `src/content/blog.ts`; they're automatically in the sitemap, `llms.txt` and the blog index.

**Comparison pages.** Re-check `src/content/compare.ts` every quarter and bump `site.comparisonsReviewed`. Candidates to add: Weebly, Jimdo, Carrd, Webflow alternatives roundup, Zyro, 10Web.

**Grader-led outreach (the highest-intent channel).** Pick a niche + city (e.g. dentists in Columbus), grade their sites, and email the owners their score with one specific fix. B2B cold email is legal in the US under CAN-SPAM when you identify yourself, include a postal address and honor opt-outs. Keep volume low and personal.

**Agencies & freelancers.** The Business plan (100 sites) is built for them. Offer a partner discount via a Stripe promotion code (checkout already accepts promo codes).

**Referrals.** Every user has a referral link (Billing page), worth 200 credits to them and 100 to the friend when the friend upgrades. Mention it in the "own domain" onboarding email and after a successful publish.

## 5. Numbers to watch (admin dashboard + analytics)

| Metric | Healthy early target |
| --- | --- |
| Signup → site created (same day) | 60%+ |
| Site created → published | 35%+ |
| Free → paid (within 30 days) | 3–6% |
| AI spend ÷ MRR | under 30% |
| Grader → signup | 5%+ |

If "created → published" is low, the onboarding emails and the "Fill in your details" flow are the levers. If AI spend is high, nudge people toward the Fast model for small edits.

## 6. Keyword map (what each page is meant to rank for)

| Page | Primary query |
| --- | --- |
| `/` | AI website builder for small business |
| `/redesign` | AI website redesign, redesign my website |
| `/tools/website-grader` | free website grader, website SEO checker |
| `/for/[industry]` | AI website builder for [dentists, restaurants, …] |
| `/compare/[x]` | [Wix/Squarespace/Lovable…] alternative |
| `/blog/best-ai-website-builders-2026` | best AI website builder 2026 |
| `/blog/how-much-does-a-small-business-website-cost` | small business website cost |
| `/blog/local-seo-checklist` | local SEO checklist |
| `/blog/ai-built-website-not-showing-on-google` | website not showing on Google |

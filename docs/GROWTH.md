# Siteloom growth instructions

These are step-by-step instructions for getting paid and getting customers, written so the business needs about 1–2 hours a week once it's running. Work through the parts in order and check boxes as you go.

**Who does what:** **You** = the founder (14). **Parent** = a parent or legal guardian. Anything that signs a contract or moves money needs the parent.

Facts checked October 2026. Sources are listed at the bottom. Rules change, so re-check anything that looks different when you get there.

---

## Part 1: The rules for a 14-year-old

| Service | Can you hold it at 14? | What to do |
| --- | --- | --- |
| **Stripe** | You can *create* the account (13+), but it can't take payments or pay out until a guardian becomes its owner. | You sign up; the parent adds themselves as owner (Part 2). |
| **Google Ads** | No, it requires 18+ (it checks the age on the Google account). | Use the parent's Google account. Your account can be added later as a user, if Google allows it for your age. |
| **Meta (Facebook/Instagram) ads** | Meta doesn't clearly publish an age rule for ad accounts. | Run ads from the parent's account so nothing gets shut down mid-campaign. |
| **Vercel, Supabase, OpenRouter, Resend, domains** | These bill a card and need terms accepted. | Use the parent's card and let the parent accept the terms. |

**Business setup:** start as a **sole proprietorship in the parent's name** with a DBA ("doing business as") name of "Siteloom". Stripe supports this directly ("Individual / sole proprietor" type). An LLC can come later when revenue is steady.
- Stripe needs the owner's **SSN** (or ITIN). An **EIN** is free from irs.gov in about 10 minutes and is safer to hand out than an SSN.
- Stripe needs a real street address; PO boxes aren't accepted.
- Book **one hour with an accountant** before the first $1,000. The income is taxable, and Stripe reports it on a 1099-K.

In Vercel, set `NEXT_PUBLIC_LEGAL_ENTITY` to the legal name (for example "Jane Doe d/b/a Siteloom") so the Terms and Privacy pages are correct.

---

## Part 2: Stripe, step by step (one evening, you and a parent together)

### 2a. Create and verify the account
- [ ] **You:** sign up at dashboard.stripe.com with the Siteloom email. Enter **your real birthday**: a fake one causes verification problems and frozen money later.
- [ ] **Parent:** add themselves as the account **owner**. Stripe asks for their name, date of birth, last 4 of SSN, address, and their consent to the terms. It may ask for a photo ID.
- [ ] Business type: **Individual / sole proprietor**. Business name: Siteloom. Website: `https://siteloom.app`. Description: "AI website builder subscription for small businesses."
- [ ] **Bank account for payouts:** a checking account the parent owns, or a joint one. Payouts are free. Use the standard schedule; instant payouts cost 1.5%.

### 2b. Settings that make money or prevent losses (Dashboard → Settings)
- [ ] **Statement descriptor:** `SITELOOM`. This is what customers see on their card statement. A name they recognize prevents "I don't know this charge" disputes, and every dispute costs $15.
- [ ] **Billing → Revenue recovery → Smart Retries:** on. **Failed payment emails:** on. Stripe retries failed cards and emails customers to update them, which saves customers you'd otherwise lose.
- [ ] **Billing → Subscriptions → "Send emails about upcoming renewals":** on for yearly plans. It's required in some states and prevents refund requests.
- [ ] **Emails → Successful payments** and **Refunds:** on, so receipts are automatic.
- [ ] **Customer portal → Cancellations → Retention coupon:** create a coupon for **25% off for 3 months** and select it. People who click "Cancel" get offered a discount first. This runs automatically.
- [ ] **Coupons and promotion codes:** create a coupon for 30% off for 3 months, with promotion code **`LAUNCH30`**. Checkout already has a promo-code box. Make a separate code for each place you post (for example `PH30` for Product Hunt, `REDDIT30` for Reddit) to see which one brings customers.
- [ ] **Radar** (fraud protection) is on by default. Leave it on.
- [ ] **Tax:** open **Tax → Registrations** and turn on threshold monitoring. Software subscriptions are taxable in some states (New York, Texas, …) and not in others (California). You usually only have to register in a state after about $100,000 of sales there. Some states also count transaction numbers, so many small monthly subscriptions in one state can trigger it. When Stripe alerts you, ask the accountant, then set `STRIPE_AUTOMATIC_TAX=true`. Stripe Tax costs 0.5% of sales in states where you're registered.

### 2c. Connect Stripe to Siteloom
- [ ] **Developers → API keys:** copy the **live** secret key (`sk_live_…`).
- [ ] In Vercel → Settings → Environment Variables:
  - Set `STRIPE_SECRET_KEY` to the live key.
  - **Delete `STRIPE_API_BASE`.** It points at the mock Stripe and must be empty in live mode.
- [ ] On your computer, put the same live key in `.env.local`, make sure `NEXT_PUBLIC_APP_URL=https://siteloom.app`, then run:
  ```bash
  npm run stripe:setup
  ```
  This creates the plans and credit packs at the new prices, sets up the customer portal, and creates the webhook.
- [ ] The setup command prints a `STRIPE_WEBHOOK_SECRET=whsec_…` value. Put it in Vercel, then **redeploy**.
- [ ] **Now** commit and push the latest code. The new prices only work after `stripe:setup` has run.
- [ ] **Test:** buy Starter monthly with a real card, check that the plan and credits appear on `/dashboard/billing`, then **refund it** in Stripe → Payments.

### What Stripe costs you

| Sale | Stripe fees | You keep (before AI costs) |
| --- | --- | --- |
| Starter monthly, $15 | ~$0.84 (2.9% + 30¢ + 0.7% subscription fee) | ~$14.16 |
| Starter yearly, $144 | ~$5.48 | ~$138.52 |
| Pro monthly, $32 | ~$1.45 | ~$30.55 |
| Business monthly, $85 | ~$3.36 | ~$81.64 |

Cards from outside the US cost 1.5% more, and currency conversion costs 1% more.

**Yearly plans lose the smallest share to fees and pay you up front.** That's why the pricing page opens on Yearly.

---

## Part 3: Safety limits (do before any marketing, 15 minutes)

- [ ] **Vercel Pro ($20/mo):** Vercel's free Hobby plan is for personal, non-commercial projects only. Upgrade (the parent's card) before taking the first real payment.

- [ ] **OpenRouter:** turn on auto top-up **with a monthly limit** (start at $50).
- [ ] **Vercel:** set `DAILY_AI_BUDGET_USD=15`. If AI spend hits that in a day, free users pause first and you get an email.
- [ ] **Vercel:** set `ADMIN_EMAILS` to your email (if not already set) so the daily digest and alerts reach you.
- [ ] **Vercel:** set `EMAIL_POSTAL_ADDRESS` to the business mailing address (US anti-spam law requires one in marketing emails).
- [ ] **Supabase:** run `supabase/migrations/0002_lifecycle_emails.sql` in the SQL editor if you haven't yet.

Monthly costs are about $25–75: Vercel Pro $20, Supabase free then $25, Resend free then $20, domains about $3, plus AI at roughly 20–30% of revenue. **Break-even is about 4–5 paying customers.**

---

## Part 4: Tracking (30 minutes, before any ads)

- [ ] **Vercel Web Analytics** (our main analytics, already in the code): Vercel project → **Analytics** tab → Enable. It's cookie-free, so no cookie banner is needed. Page views work on the free Hobby plan. Signups, new sites, checkouts and purchases also show up as custom events, but only on Vercel Pro.
- [ ] **Only when you start Google Ads**, add Google Analytics 4: create a property for siteloom.app and set `NEXT_PUBLIC_GA_ID` in Vercel. Google Ads can only learn from GA4, not Vercel. GA4 uses cookies, so keep ads US-only (Part 6). In GA4 → Admin → Events, mark **`purchase`** and **`signup`** as key events. They show up after the first one happens.
- [ ] **Meta Pixel (only when you start Meta ads, also uses cookies):** Meta Events Manager → create a Pixel. Set `NEXT_PUBLIC_META_PIXEL_ID` in Vercel. The site already sends:

  | Siteloom event | Meta event |
  | --- | --- |
  | signup | CompleteRegistration |
  | site_created | Lead |
  | checkout_started | InitiateCheckout |
  | purchase | Purchase (with price) |

- [ ] **Google Search Console** (free, the most important one): add `siteloom.app`, verify it with a DNS record in your domain settings, and submit `https://siteloom.app/sitemap.xml`. Do the same in **Bing Webmaster Tools**, which can import from Google in one click.
- [ ] Redeploy, open the site, and check that the Pixel fires using Meta's "Test events" tab.

---

## Part 5: Launch (one weekend, mostly done once)

**Listings** that keep sending visitors. Use the same short description, the logo and 3 screenshots for all of them.
- [ ] There's An AI For That
- [ ] Futurepedia
- [ ] Toolify
- [ ] AlternativeTo: list it as an alternative to Wix, Squarespace, Lovable and Durable.
- [ ] SaaSHub
- [ ] BetaList
- [ ] Indie Hackers: product page plus a short "how I built it" post.

**Product Hunt:**
- [ ] Launch Tuesday–Thursday at 12:01 am Pacific.
- [ ] Use the parent's account if Product Hunt's age rules require it.
- [ ] Put `PH30` in the first comment.
- [ ] Reply to every comment that day.

**Reddit:**
- [ ] Post in r/SideProject and r/InternetIsBeautiful.
- [ ] In r/smallbusiness and r/Entrepreneur, only answer website questions helpfully. Self-promotion there gets banned.

**Short videos** (the best free channel):
- [ ] Screen-record a site being built from one sentence.
- [ ] Speed it up, add captions, and keep it 20–40 seconds.
- [ ] Hook: "AI built a website for a taco truck in 60 seconds."
- [ ] Post to TikTok, YouTube Shorts and Instagram Reels, **one per week**. These videos are also your Meta ads later.

**Your story:** "14-year-old builds an AI website builder" gets attention. Only use it if you and your parents agree. Never share your school, city or last name.

---

## Part 6: Paid ads (optional, only once Siteloom pays for them)

**Ads are not required.** Parts 5 and 7 cost $0. Start there, and only turn on ads once customers are paying for them:

| Stage | Ad budget |
| --- | --- |
| No paying customers yet | **$0.** Do listings, Product Hunt, Reddit and weekly videos. |
| First paying customers | Spend up to **30% of last month's revenue**. For example, $150 revenue → $45/month ≈ **$1.50/day**. |
| Ads are bringing customers for under $40 each | Raise the budget 20% per month, still paid for by revenue. |

The money then never comes out of anyone's pocket. Two things to know:
- **Small budgets learn slowly.** Clicks on these keywords cost about $2–6 each, so $2/day is about one click a day. Expect a month before you know whether it works.
- **New-advertiser credits:** Google often offers new accounts a credit when they spend a certain amount. Check for one when the parent creates the account.

The setup below works the same at any budget; just use your number instead of $12.


### Google Search ads: start here (the parent's account)

**Setup**
- **Campaign type:** Search only. Untick Display Network and Search Partners. Location: United States. Language: English.
- **Budget:** whatever the table above allows. Bidding: **Maximize conversions**.
- **Conversions:** in Google Ads → Goals, import GA4's `purchase` (primary) and `signup` (secondary). Link GA4 to Google Ads first, under GA4 Admin → Product links.

**Ad groups**, each with its own landing page (all already exist):

| Ad group | Example keywords | Landing page |
| --- | --- | --- |
| Plumbers | `"plumber website"`, `"website for plumbing business"`, `"plumbing website builder"` | `/for/plumbers` |
| Dentists, restaurants, … | the same pattern, one group per industry | `/for/<industry>` |
| General | `"ai website builder for small business"`, `"make a website for my business"`, `"small business website builder"` | `/` |
| Redesign | `"website redesign"`, `"update my business website"`, `"modernize my website"` | `/redesign` |

Start with the 5 industries you think have the most small businesses, not all 21.

**Negative keywords** (whole campaign): free, jobs, job, salary, course, tutorial, how to code, html, css, wordpress, template download, login, internship.

**Ads**
- Headlines: "AI Website Builder for Plumbers" · "Live in Minutes, Free to Start" · "Hosting, Forms & SEO Included" · "From $12/mo".
- Descriptions:
  - "Describe your business, get a complete multi-page website. Edit by chatting. Publish in one click."
  - "Built for Google: fast pages, structured data and sitemap on every site. Try free, no card needed."

**Rules** (check once a week, 15 minutes):

| Situation after ~$250 total spend | Do this |
| --- | --- |
| Clicks but few signups (under 1 in 15) | The landing page isn't convincing. Try a different headline on that industry page before spending more. |
| Signups but **0 purchases** | Don't increase spend. Watch where people stop: do they create a site? Publish? Hit the paywall? Fix that first. |
| Cost per purchase **under $40** | Working. A yearly Starter pays $144 up front. Raise the budget 20% per week. |
| Cost per purchase $40–$80 | Pause the worst ad groups and keep the best ones. |
| Cost per purchase over $80 after $500 total | Stop ads. Focus on videos and listings, then try again later. |

- After about 30 purchases, switch bidding to **Target CPA** at your average cost per purchase.
- Search terms report (weekly): add anything irrelevant as a negative keyword.

### Meta ads: second
- Wait until the Pixel has recorded about 100 site visits.
- **Retargeting first:**
  - Audience: website visitors in the last 30 days, excluding purchasers.
  - Budget: $2–5/day, paid for by revenue.
  - Creative: your best short build video. Text: "Still need a website? Yours is one sentence away."
  - Goal: Sales → Purchase.
- After about 50 total purchases, test a broad US audience aged 25–65 with the same videos.

### Skip for now
Display ads, YouTube ads, influencers and paid press. They're harder to measure and burn money early.

---

## Budget marketing plan

Pick the row that matches what you can spend. Every row includes the ones above it.

| Monthly budget | What to do | Why |
| --- | --- | --- |
| **$0** | Search Console + Bing Webmaster; directory listings (Part 5); free social profiles; one build video a week; answer website questions on Reddit; Product Hunt launch | Gets the first backlinks (an SEO audit on 2026-10-14 found **0**), the first visitors and the first proof |
| **~$10** | One-time paid directory listings that include a backlink (some AI directories charge $10–50 once) | Backlinks are the main thing holding siteloom.app's own Google rankings back |
| **~$30** | Google Search ads at $1/day on the 2–3 best industry pages only | Learns which industries convert, slowly but cheaply |
| **30% of revenue** | Raise ads only from revenue (Part 6 rules) | Ads never come out of anyone's pocket |

### Free social profiles (one afternoon)
Create **Instagram, TikTok, YouTube, LinkedIn and Facebook** pages named Siteloom (a parent may need to own some of them). Use the same logo and one-line bio, and post the weekly build video to all of them.

Then put the profile links in `NEXT_PUBLIC_SOCIAL_LINKS` (comma-separated) in Vercel. They appear in the footer and in the site's structured data, which helps Google connect the brand. When you own the X handle, set `NEXT_PUBLIC_TWITTER_HANDLE`.

### Email trust records (15 minutes, free)
SEO audits flag a missing SPF and DMARC on siteloom.app, and the same records stop your emails from landing in spam.

In Vercel → Domains → siteloom.app → DNS records:
1. Add the records Resend shows under **Domains** for siteloom.app. These are SPF and DKIM, usually on a `send` subdomain.
2. Add a TXT record named `_dmarc` with the value `v=DMARC1; p=none; rua=mailto:YOUR_EMAIL`.

### Content that ranks (free, about 1 hour a month)
- Each month, add one guide that answers a real question small businesses search for, for example "how much does a website cost for a plumber".
- Put a link to the free website grader in every guide.
- Ask Claude for a draft, then fact-check it. Never invent statistics.

---

## Part 7: What already runs by itself

- **The "Made with Siteloom" badge** on every free site is free advertising.
- **Upgrade pressure:** custom domains, removing the badge and more published sites all need a paid plan.
- **Free website grader** (`/tools/website-grader`): businesses see their own bad score and are offered a rebuild.
- **Search pages:** 21 industry pages, comparison pages, guides, `/seo` and `llms.txt`. They grow slowly and stay free.
- **Referrals:** 200 credits to the referrer and 100 to the friend when the friend upgrades.
- **Emails:** sent automatically after the first site and after publishing, plus SEO tips and a nudge to connect a domain.
- **Billing:** plan changes, renewals, failed-card retries, the cancellation discount and credit top-ups.
- **Daily digest email:** MRR, signups, AI spend, and anything that needs you.

---

## Part 8: Weekly routine (about 1–2 hours)

- **Daily, 2 min:** read the digest email. Act only if something is flagged.
- **Weekly:**
  - 30 min: record and post one build video.
  - 15 min: check `/admin` for reports or held sites.
  - 15 min: Google Ads (use the rules table, add negative keywords).
- **Monthly, 30 min:**
  - Stripe → Billing overview: MRR, churn, failed payments.
  - Check Stripe Tax alerts.
  - Check the OpenRouter bill against revenue. AI should stay under about 30% of revenue; if it's higher, lower the daily budget or the free credits in `src/config/plans.ts`.
- **Every 3 months:**
  - Re-check competitor prices in `src/content/compare.ts`.
  - Run `npm run eval:generate` before changing any SEO numbers on the site.

## Part 9: Once you have ~50 paying customers

- **Affiliate program:** pay 30% recurring commission to freelancers and YouTubers who send customers (for example with Rewardful, which works with Stripe). The parent signs up.
- **Agencies:** the Business plan ($85/mo) is built for freelancers who make sites for local businesses. Post in freelancer communities offering an agency trial with a promo code.
- **More industry pages and ad groups** for whatever converts best.

---

## Sources

- [Stripe: age requirement to create a Stripe account](https://support.stripe.com/questions/age-requirement-to-create-a-stripe-account)
- [Stripe: sole proprietorship tax ID requirements](https://support.stripe.com/questions/business-rep-owner-tax-id-requirements-for-us-companies-sole-proprietorship-accounts)
- [Stripe: requirements for a US Stripe account](https://support.stripe.com/questions/requirements-for-having-a-us-stripe-account)
- [Stripe pricing](https://stripe.com/pricing)
- [Stripe: customer portal cancellation page and retention coupons](https://docs.stripe.com/customer-management/cancellation-page)
- [Stripe: retention rules](https://docs.stripe.com/billing/retention/rules)
- [Stripe Tax: registering](https://docs.stripe.com/tax/registering)
- [Stripe: when to charge sales tax on services in the US](https://stripe.com/en-ee/resources/more/when-to-charge-sales-tax-on-services-in-the-us)
- [Google Ads: age requirement](https://support.google.com/google-ads/answer/1664276)

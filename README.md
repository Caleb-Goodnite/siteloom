# Curblit — the AI website builder for sites that get found

Describe a business in a sentence; Curblit designs, writes and publishes a fast, multi-page website with SEO, working forms, analytics, hosting and custom domains built in.

Stack: **Next.js 16** (App Router) · **Supabase** (auth, Postgres, storage) · **OpenRouter** (AI) · **Stripe** (billing) · **Vercel** (hosting) · optional **Resend** (email).

---

## Positioning (why this can win)

Market research (Oct 2026) on Lovable, Bolt.new, v0, Orchids, Wix, Framer and Durable found the same complaints again and again:

| Problem users report | What Curblit does instead |
| --- | --- |
| **Unpredictable credit burn**, especially "fix loops" where the AI breaks something and charges to fix it | Flat credit price **shown on the send button**. Automatic refund when a generation fails, is stopped, or changes nothing. Free text edits, code edits and version restores. |
| AI-built React SPAs **don't get indexed** well (content rendered by JS, identical titles, no sitemap) | Output is **static HTML + compiled CSS**. Every publish adds canonical URLs, Open Graph/Twitter tags, a generated social image, `sitemap.xml`, `robots.txt`, `llms.txt`, a favicon and JSON-LD. A built-in **SEO panel** scores every page. |
| Forms and analytics need a backend or third-party tools | **Forms work on publish** (inbox, email alerts, spam protection). Privacy-friendly **analytics** built in. |
| Generic "AI template" designs and **invented facts** (fake reviews, phone numbers) | The prompt bans fabricated testimonials, stats and contact details, and missing facts become highlighted `[[placeholders]]`. Optional **AI photography**; no stock-photo URLs. |
| Lock-in | **Download** a production-ready static site anytime. |
| AI builders get abused to host **phishing** | Publish-time moderation (hard rules + an AI check), abuse reports, auto-suspension of reported free sites, separate domain for customer sites. |

App builders target people building *apps*. Curblit targets the much larger group that needs a *website*: local services, restaurants, clinics, freelancers, creators and SaaS marketing sites.

## Models (via OpenRouter)

Model IDs live in [`src/config/models.ts`](src/config/models.ts) and can be overridden with env vars. Prices are a snapshot and may change. Each tier has fallbacks, so a provider outage doesn't take the builder down.

| Tier | Model (fallbacks) | Cost to you (per M tokens) | Credits per message |
| --- | --- | --- | --- |
| Fast | `openai/gpt-6-luna` (GLM 5.3 Flash, Claude Haiku 5.5) | $0.10 in / $0.50 out | 1 |
| Standard | `x-ai/grok-4.7` (Claude Sonnet 5.5) | $2 / $6 | 4 |
| Max (Pro+) | `openai/gpt-6.1-sol` (Grok 4.7) | $2 / $10 | 10 |
| Utility (naming, prompt enhancer, moderation) | `qwen/qwen3.8-flash` (GLM 5.3 Flash, Haiku 5.5) | $0.15 / $0.47 | free |
| Photos | `bytedance-seed/seedream-5-0-flash` (FLUX.2 Klein, Recraft 4.1 Flash) | ≈ $0.018 / image | 1 per photo |

The system prompt is static and marked for **prompt caching**, so cache reads cost about 10% of normal input price. The project's files are a second cache breakpoint, which makes consecutive edits cheap.

## Pricing & unit economics

Configured in [`src/config/plans.ts`](src/config/plans.ts) (Stripe prices are generated from it):

| Plan | Price | Credits | Sites | Custom domains |
| --- | --- | --- | --- | --- |
| Free | $0 | 5/day + 20 welcome bonus | 1 (with badge) | — |
| Starter | $15/mo ($144/yr = $12/mo) | 250/mo | 3 | 1 |
| Pro | $32/mo ($312/yr = $26/mo) | 700/mo | 15 | 15 |
| Business | $85/mo ($816/yr = $68/mo) | 1,800/mo | 100 | 100 |

Top-ups: 250 credits for $10 and 1,000 for $35; these never expire. At Pro pricing a Standard message brings in ~$0.145 and typically costs ~$0.05–0.10 in tokens. The admin dashboard shows MRR against AI spend so you can tune this.

---

## Local setup

```bash
npm install
cp .env.example .env.local   # already done for you; fill in the values
npm run dev                  # http://localhost:3000
```

### 1. Supabase
1. Create a project at supabase.com.
2. **SQL editor → run [`supabase/migrations/0001_init.sql`](supabase/migrations/0001_init.sql), then [`0002_lifecycle_emails.sql`](supabase/migrations/0002_lifecycle_emails.sql).** They create tables, row-level security, the credit functions, the `site-assets` storage bucket and the lifecycle-email log.
3. **Authentication → URL configuration:** set *Site URL* to your app URL and add `http://localhost:3000/auth/callback` and `https://YOUR_APP_DOMAIN/auth/callback` to *Redirect URLs*.
4. **Authentication → Providers:** enable Email, plus Google/GitHub if you want them (`NEXT_PUBLIC_AUTH_PROVIDERS`).
5. Recommended: enable **CAPTCHA protection** (Turnstile) under Auth → Attack protection to stop bulk sign-ups for free credits.
6. Copy the URL, the publishable key and the secret key into `.env.local`.

### 2. OpenRouter
Create a key at openrouter.ai, set `OPENROUTER_API_KEY`, and turn on **auto top-up** with a monthly limit. `DAILY_AI_BUDGET_USD` is a separate in-app circuit breaker: when it trips, free users pause first, and you get an email.

### 3. Stripe
```bash
npm run stripe:setup     # creates products, prices (by lookup key), the customer portal and, in production, the webhook
stripe listen --forward-to localhost:3000/api/stripe/webhook   # local webhooks → copy whsec_… to STRIPE_WEBHOOK_SECRET
```
To use a Stripe **mock or simulator**, set `STRIPE_API_BASE` (e.g. `http://localhost:12111`); both the app and the setup script will use it. In the Stripe dashboard, turn on **failed-payment emails and Smart Retries** (Billing → Revenue recovery).

### 4. Try it
Sign up at `/signup`, describe a site, and publish it. Locally, published sites are served at `http://<slug>.localhost:3000`. Add your email to `ADMIN_EMAILS` to see `/admin`.

There's also a no-backend **builder playground** at `/dev/builder` (development only) for working on the editor UI.

---

## Deploying (Vercel)

1. **Use Vercel Pro.** Hobby is non-commercial and caps functions at 300 s; generations can run longer (`maxDuration = 800`).
2. **Two domains** (required for security):
   - App: `curblit.com` (marketing, dashboard, builder)
   - Sites: `curblit.site` with a **wildcard** `*.curblit.site` (needs Vercel nameservers on that domain)

   Customer sites run arbitrary JavaScript, so they must never share the app's registrable domain or they could read users' auth cookies. The proxy routes any non-app host to the hosted-site handler, and that handler refuses requests on the app host.
3. Add every variable from `.env.example` in Vercel → Settings → Environment Variables, with `NEXT_PUBLIC_APP_URL=https://curblit.com` and `NEXT_PUBLIC_SITES_DOMAIN=curblit.site`.
4. Set `VERCEL_TOKEN` + `VERCEL_PROJECT_ID` (+ `VERCEL_TEAM_ID`) so customer custom domains are attached automatically, with SSL.
5. Re-run `npm run stripe:setup` with the production URL and live key to create the webhook; copy the printed secret.
6. Verify a sending domain in **Resend** and set `RESEND_API_KEY` + `EMAIL_FROM`.
7. Set `CRON_SECRET`. [`vercel.json`](vercel.json) schedules the daily maintenance job.
8. Add `curblit.com` to **Google Search Console** and submit `/sitemap.xml`.

---

## What runs by itself

- **Billing:** Stripe Checkout, plan upgrades/downgrades with proration, cancellations, monthly credit resets, top-ups and dunning are all handled by webhooks (idempotent, retried automatically) plus the Stripe portal.
- **Credits:** free allowances refill daily and paid allowances monthly (yearly plans included), on demand. Failed, stopped or no-op generations are refunded automatically, and interrupted ones are refunded by the daily job.
- **Growth loops:** a "Made with" badge on free sites, an opt-in public showcase, referral credits (200 for the referrer, 100 for the friend, paid on upgrade), 21 industry landing pages, 6 comparison pages, guides, `llms.txt`, and OG images for every page.
- **Trust & safety:** publish-time moderation, auto-suspension after 3 distinct serious reports on free sites, and email alerts for reports and held sites.
- **Cost control:** a daily AI budget circuit breaker, per-user rate limits, model fallbacks, and an email alert if your OpenRouter balance runs out.
- **SEO, measured:** every page is graded by the same 15-check auditor as the free website grader (`/tools/website-grader`) on publish (score shown in the publish dialog, dashboard and SEO tab; owners can re-check the live site). Once 10+ sites are published, the homepage and `/seo` show the real average instead of the benchmark in [`src/content/proof.ts`](src/content/proof.ts).
- **Lifecycle emails:** first-site, publish, SEO-tips and own-domain emails, sent once each by the daily job, with one-click unsubscribe (set `EMAIL_POSTAL_ADDRESS`, required by CAN-SPAM).
- **Ops:** a daily job unlocks stuck generations, prunes history (keeps 50 versions per site), re-checks pending custom domains, and emails you a **one-screen digest**: MRR, signups, AI spend, open reports.

## Things only you can do

- Have a lawyer review [`src/content/legal.ts`](src/content/legal.ts) and set `NEXT_PUBLIC_LEGAL_ENTITY` / `NEXT_PUBLIC_GOVERNING_LAW`.
- Check that the **name "Curblit"** and both domains are available and clear to trademark. Rename in [`src/config/site.ts`](src/config/site.ts).
- Re-check the comparison pages ([`src/content/compare.ts`](src/content/compare.ts)) every few months; competitors change quickly.
- Configure Stripe Tax if you need to collect sales tax or VAT (`STRIPE_AUTOMATIC_TAX=true`).
- Watch `/admin` and the daily digest; handle the occasional abuse report or held site.

---

## How it works

```
Browser (builder) ──POST /api/projects/:id/generate──▶ prepareGeneration: plan + rate limit + budget check,
        ▲                                               lock project, charge credits (atomic SQL)
        │  NDJSON stream (deltas, file events, status)            │
        └──────────────────────── runGeneration ◀─────────────────┘
                                     │ OpenRouter stream (cached system prompt + files)
                                     │ parse <sl-file>/<sl-edit> ops → apply (fuzzy SEARCH/REPLACE, auto-repair)
                                     │ save version → AI photos → refund if nothing changed
Preview: sandboxed srcdoc iframe (no allow-same-origin) + bridge script
         → click-to-select, free inline text edits, link navigation, error reporting
Publish: moderation → compile Tailwind (lightningcss) → inline Lucide SVGs → clean URLs
         → canonical/OG/Twitter/JSON-LD → sitemap/robots/llms.txt/favicon → stored as published_files
Hosting: proxy maps slug.<sites domain> / custom domains → /hosted/[host]/… (cached, edge-friendly)
         + /__sl/form (inbox + email), /__sl/a (analytics beacon), /__sl/og.png (social image)
```

Key files:

| Area | File |
| --- | --- |
| Brand, plans, models | `src/config/{site,plans,models}.ts` |
| AI prompt + protocol | `src/lib/ai/prompts.ts`, `src/lib/ai/protocol.ts` |
| Generation job | `src/lib/ai/generate.ts`, `src/app/api/projects/[id]/generate/route.ts` |
| Preview + click-to-edit | `src/lib/site/render.ts`, `src/components/builder/preview.tsx` |
| Publish pipeline | `src/lib/site/{publish,tailwind,icons,deploy}.ts` |
| Hosting | `src/proxy.ts`, `src/app/hosted/[host]/[[...path]]/route.ts` |
| Billing | `src/lib/billing.ts`, `src/app/api/stripe/webhook/route.ts`, `scripts/stripe-setup.ts` |
| Staged builds (brief → parallel pages → QA) | `src/lib/ai/{brief,build,design}.ts` |
| Integrations, theme, redesign import | `src/lib/site/{blocks,theme,import}.ts` |
| SEO auditor + proof | `src/lib/site/grade.ts`, `src/content/proof.ts`, `src/components/marketing/seo-proof.tsx` |
| Database | `supabase/migrations/*.sql` |
| Builder UI | `src/components/builder/*` |
| SEO content | `src/content/{industries,compare,blog,legal}.ts` |

## Checks

```bash
npm run check   # typecheck + lint + 70 tests (protocol, renderer, click-to-edit, publish pipeline, SEO audit,
                # and the real SQL migration in an in-process Postgres: credits, refunds, RLS)
npm run build
npm run eval:generate   # real end-to-end builds via OpenRouter (costs ~$0.60 per site); re-measure before changing proof.ts
```

## Ideas for later

- GitHub export and Shopify blocks
- Multi-language sites (hreflang)
- Scheduled "SEO coach" emails using Search Console data
- Team seats on the Business plan

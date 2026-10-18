/**
 * Comparison pages (/compare/[slug]). Keep these fair and factual: they rank for
 * "[competitor] alternative" searches, and honesty ("choose them if…") is what earns trust.
 * Avoid quoting competitor prices — they change often. Re-check before updating
 * site.comparisonsReviewed in src/config/site.ts.
 */
export type Competitor = {
  slug: string;
  name: string;
  url: string;
  category: string;
  summary: string;
  theyreGreatFor: string[];
  chooseCurblitIf: string[];
  rows: { label: string; curblit: string; them: string }[];
  faqs: { q: string; a: string }[];
};

export const competitors: Competitor[] = [
  {
    slug: "lovable",
    name: "Lovable",
    url: "https://lovable.dev",
    category: "AI app builder",
    summary:
      "Lovable is an AI app builder that generates full-stack React applications, typically paired with Supabase for auth and data. It's excellent when you're building an app. Curblit is built for a different job: websites for businesses — pages that load instantly, read cleanly to search engines and AI assistants, and come with hosting, forms and analytics already working.",
    theyreGreatFor: [
      "Prototyping web apps with logins, databases and dashboards",
      "Founders validating a SaaS or internal tool idea",
      "Projects that need custom app logic beyond a website",
    ],
    chooseCurblitIf: [
      "You need a marketing or business website, not an app",
      "Ranking on Google and appearing in AI answers matters to you",
      "You want a flat, visible price per message, with no charge when nothing changes",
      "You'd like to fix copy by clicking the text, for free",
    ],
    rows: [
      { label: "What it builds", curblit: "Multi-page business websites and landing pages", them: "Full-stack web applications" },
      { label: "Output", curblit: "Static HTML with compiled CSS — no framework JavaScript", them: "React application code" },
      { label: "SEO defaults", curblit: "Titles, descriptions, canonical URLs, sitemap, JSON-LD, social cards and llms.txt on every publish", them: "Depends on project setup and rendering mode" },
      { label: "Pricing model", curblit: "Flat credits per message, shown before you send; refunded if nothing changes", them: "Credit-based; usage varies by request" },
      { label: "Editing text", curblit: "Click any text in the preview — free", them: "Chat, visual edits or code" },
      { label: "Contact forms", curblit: "Built in: inbox, email alerts, spam protection", them: "Build with your backend (e.g. Supabase)" },
      { label: "Analytics", curblit: "Built in, privacy-friendly", them: "Add a third-party tool" },
      { label: "Code export", curblit: "Download a production-ready static site", them: "GitHub sync of app code" },
    ],
    faqs: [
      { q: "Is Curblit a Lovable alternative?", a: "For websites, yes. If you're building an app with user accounts and a database, Lovable is the better fit; if you need a fast, search-friendly business website, Curblit is purpose-built for that." },
      { q: "Can I move a site from Lovable to Curblit?", a: "Describe your current site (or paste its copy) and Curblit will rebuild it as a fast static site. Upload your logo and photos so they're reused." },
      { q: "Does Curblit support databases or logins?", a: "No — by design. Curblit sites are static, which makes them fast, secure and cheap to host. Forms and analytics are handled for you." },
    ],
  },
  {
    slug: "bolt",
    name: "Bolt.new",
    url: "https://bolt.new",
    category: "AI coding environment",
    summary:
      "Bolt.new by StackBlitz runs a full development environment in your browser and lets AI build apps in many frameworks. It's powerful for developers who want to see and steer every file. Curblit hides the toolchain entirely and focuses on one outcome: a finished, hosted website that ranks.",
    theyreGreatFor: [
      "Developers who want a browser IDE with AI assistance",
      "Building apps across frameworks (React, Vue, Svelte, Expo and more)",
      "Running and debugging code in the browser",
    ],
    chooseCurblitIf: [
      "You don't want to think about frameworks, builds or deploys",
      "You need hosting, forms, analytics and a custom domain included",
      "You want predictable per-message pricing instead of token budgets",
      "You care about SEO defaults out of the box",
    ],
    rows: [
      { label: "Audience", curblit: "Business owners, marketers, freelancers", them: "Developers and technical builders" },
      { label: "Output", curblit: "Static HTML + compiled CSS", them: "Framework project code (many stacks)" },
      { label: "Pricing model", curblit: "Flat credits per message; refunded when nothing changes", them: "Token-based usage" },
      { label: "Hosting", curblit: "Included, with custom domains on paid plans", them: "Deploy integrations" },
      { label: "Forms & analytics", curblit: "Built in", them: "Build or integrate yourself" },
      { label: "Editing text", curblit: "Click-to-edit in preview, free", them: "Chat or edit code" },
    ],
    faqs: [
      { q: "Is Curblit good for developers?", a: "Developers use it to ship client sites fast: you get clean, readable HTML, a code editor, version history and a ZIP export. For complex apps, use a coding environment like Bolt." },
      { q: "Why static HTML?", a: "It's the fastest thing to load, the easiest for crawlers to read and has almost no attack surface — ideal for business websites." },
      { q: "Can I edit the code?", a: "Yes. Every file is editable in the built-in editor, and edits are free." },
    ],
  },
  {
    slug: "v0",
    name: "v0",
    url: "https://v0.app",
    category: "AI UI generator",
    summary:
      "v0 by Vercel generates high-quality React and Next.js interfaces, often with shadcn/ui components — loved by front-end developers. Curblit targets people who want a complete website live today, without a React project, a repo or a deploy pipeline.",
    theyreGreatFor: [
      "Generating React/Next.js UI components and screens",
      "Teams already building on Next.js and Vercel",
      "Developers who want polished UI code to drop into an app",
    ],
    chooseCurblitIf: [
      "You want a whole multi-page website, published, in one place",
      "You'd rather not manage a React/Next.js codebase",
      "Working forms, analytics and SEO setup should come included",
    ],
    rows: [
      { label: "Output", curblit: "Complete static website", them: "React / Next.js components and apps" },
      { label: "Best for", curblit: "Business websites and landing pages", them: "UI for web apps" },
      { label: "Hosting", curblit: "Included; custom domains on paid plans", them: "Deploy to Vercel" },
      { label: "Forms", curblit: "Built in, delivered to your inbox", them: "Implement in your app" },
      { label: "Pricing model", curblit: "Flat credits per message, shown up front", them: "Credit-based" },
    ],
    faqs: [
      { q: "Can I use Curblit output in a Next.js app?", a: "You can export the HTML and adapt it, but Curblit is designed to host the site for you. For components inside an app, v0 is the better tool." },
      { q: "Does Curblit use shadcn/ui?", a: "No. Sites use Tailwind CSS compiled to a small stylesheet, plus tiny bits of JavaScript only where needed." },
      { q: "Which is better for SEO?", a: "Both can produce crawlable pages. Curblit applies SEO defaults automatically on every publish, so non-developers get them without configuration." },
    ],
  },
  {
    slug: "wix",
    name: "Wix",
    url: "https://www.wix.com",
    category: "Website builder",
    summary:
      "Wix is one of the largest website builders, with a drag-and-drop editor, AI site creation and a huge app market for bookings, stores and more. Curblit takes a different approach: you describe changes in plain language (or click text to edit), and you can download your site and leave anytime.",
    theyreGreatFor: [
      "People who want a visual drag-and-drop editor",
      "Online stores and bookings using Wix's built-in apps",
      "Businesses that want everything in one big ecosystem",
    ],
    chooseCurblitIf: [
      "You'd rather describe changes than drag boxes around",
      "You want lightweight pages that load fast on mobile",
      "Owning your code matters: export a static site whenever you want",
      "You want a genuinely custom design, not a template",
    ],
    rows: [
      { label: "How you edit", curblit: "Chat with AI + click-to-edit text", them: "Drag-and-drop editor + AI tools" },
      { label: "Design", curblit: "Generated for your business from scratch", them: "Templates and AI-generated layouts" },
      { label: "Code ownership", curblit: "Download a static site anytime", them: "Sites stay on Wix's platform" },
      { label: "E-commerce", curblit: "Link to Stripe/Shopify/Square checkout", them: "Built-in store" },
      { label: "Page weight", curblit: "Static HTML, compiled CSS, no framework JS", them: "Platform runtime" },
    ],
    faqs: [
      { q: "Can Curblit replace my Wix site?", a: "For most service-business sites, yes. Describe your business (or paste your current copy), connect your domain and publish. If you rely on Wix Stores or Bookings, keep those or link to an alternative." },
      { q: "Is there a drag-and-drop editor?", a: "No. You describe changes in plain English, click text to edit it directly, or edit code if you like." },
      { q: "Can I keep my domain?", a: "Yes — point your domain's DNS to Curblit on a paid plan." },
    ],
  },
  {
    slug: "framer",
    name: "Framer",
    url: "https://www.framer.com",
    category: "Design-first website builder",
    summary:
      "Framer is a design-first website builder with a canvas editor, rich animations and a CMS — a favorite of designers. Curblit is for people who want great design without designing: you describe the business and the AI handles layout, copy and SEO.",
    theyreGreatFor: [
      "Designers who want pixel-level control on a canvas",
      "Highly animated marketing sites",
      "Teams that want a visual CMS",
    ],
    chooseCurblitIf: [
      "You're not a designer and don't want to become one",
      "You want copy, structure and SEO written for you",
      "Exporting your site as plain HTML matters",
    ],
    rows: [
      { label: "How you build", curblit: "Describe it; AI designs and writes it", them: "Design on a visual canvas (with AI assists)" },
      { label: "Copywriting", curblit: "Written for your business and location", them: "You write it" },
      { label: "Code export", curblit: "Download static HTML anytime", them: "Hosted on Framer" },
      { label: "Forms & analytics", curblit: "Built in", them: "Built in" },
    ],
    faqs: [
      { q: "Is Curblit as flexible as Framer?", a: "Not for pixel-level design work. It's faster for getting a complete, well-written site live, and you can still edit any code." },
      { q: "Does Curblit support animations?", a: "Yes — tasteful transitions and hover effects, respecting reduced-motion settings. Ask for specific effects in chat." },
      { q: "Can I switch from Framer?", a: "Paste your current copy and describe the look you like; Curblit rebuilds it." },
    ],
  },
  {
    slug: "durable",
    name: "Durable",
    url: "https://durable.co",
    category: "AI website builder for small business",
    summary:
      "Durable generates small-business websites in seconds and bundles business tools like a CRM and invoicing. Curblit focuses on depth for the website itself: multi-page sites with custom design, real SEO structure and conversational editing.",
    theyreGreatFor: [
      "Getting a basic site up in under a minute",
      "Solo businesses that want website + CRM + invoicing in one",
    ],
    chooseCurblitIf: [
      "You want a more custom, distinctive design",
      "You need multiple well-structured pages that rank",
      "You want to iterate by chatting (\"add a pricing page\") and own the code",
    ],
    rows: [
      { label: "Site depth", curblit: "Multi-page sites with structured content", them: "Fast, simpler sites" },
      { label: "Editing", curblit: "Conversational AI + click-to-edit + code", them: "Section editor + AI" },
      { label: "Extras", curblit: "Forms inbox, analytics, AI photos", them: "CRM, invoicing and more" },
      { label: "Code export", curblit: "Yes, static site download", them: "Hosted on Durable" },
    ],
    faqs: [
      { q: "Is Curblit as fast as Durable?", a: "A first draft takes about a minute or two because Curblit writes complete, multi-page sites with custom copy." },
      { q: "Does Curblit include a CRM?", a: "Form submissions go to an inbox in your dashboard (and email on paid plans). For a full CRM, connect your favorite tool via links." },
      { q: "Can I use my own domain?", a: "Yes, on any paid plan." },
    ],
  },
  {
    slug: "squarespace",
    name: "Squarespace",
    url: "https://www.squarespace.com",
    category: "Website builder",
    summary:
      "Squarespace is known for polished templates and an all-in-one platform with commerce, scheduling and email marketing. Curblit skips templates entirely: you describe your business and get a site designed and written for it, which you can change by chatting, edit by clicking the text, or download as code.",
    theyreGreatFor: [
      "People who like choosing a template and dragging sections around",
      "Online stores, appointment scheduling and email campaigns in one subscription",
      "Creatives who want a very polished, opinionated design system",
    ],
    chooseCurblitIf: [
      "You'd rather describe what you want than design it yourself",
      "You want copy written for your business, services and location",
      "You want to change things in plain English (\"add a pricing page\")",
      "You want the option to download your site and host it anywhere",
    ],
    rows: [
      { label: "How you build", curblit: "Describe it; AI designs and writes it", them: "Pick a template, edit visually (AI assists available)" },
      { label: "Copywriting", curblit: "Written for your business and location", them: "Mostly yours to write" },
      { label: "Changing things", curblit: "Chat, click-to-edit text, or code", them: "Visual editor" },
      { label: "Code ownership", curblit: "Download a static site anytime", them: "Hosted on Squarespace" },
      { label: "E-commerce & booking", curblit: "Link Stripe, Square, Calendly and similar", them: "Built in" },
    ],
    faqs: [
      { q: "Is Curblit a Squarespace alternative?", a: "For service businesses, restaurants, clinics, trades and portfolios, yes. If your site is mainly an online store or you rely on Squarespace Scheduling or Email Campaigns, Squarespace's built-in tools may suit you better." },
      { q: "Can I move my Squarespace site to Curblit?", a: "Yes. Paste your Squarespace address on our redesign page and we'll import your content and rebuild it. Then point your domain at Curblit." },
      { q: "Is it hard to switch?", a: "No. Most of the work is updating two DNS records for your domain, and we walk you through it." },
    ],
  },
  {
    slug: "webflow",
    name: "Webflow",
    url: "https://webflow.com",
    category: "Visual development platform",
    summary:
      "Webflow is a professional visual development tool with fine-grained control over layout, interactions and a CMS, which makes it a favorite of designers and agencies. It has a learning curve to match. Curblit is for people who want a great site without learning a design tool.",
    theyreGreatFor: [
      "Designers and agencies who want pixel-level control",
      "Complex CMS-driven sites with custom interactions",
      "Teams with a dedicated web designer",
    ],
    chooseCurblitIf: [
      "You don't want to learn a design tool",
      "You need a complete, well-written site today",
      "SEO basics should be handled without configuration",
    ],
    rows: [
      { label: "Learning curve", curblit: "None: describe it in plain English", them: "Significant; built for designers" },
      { label: "Content", curblit: "Written for you", them: "You write it" },
      { label: "Control", curblit: "Chat, click-to-edit, full code access", them: "Granular visual control" },
      { label: "SEO setup", curblit: "Automatic on every publish", them: "Powerful, configured by you" },
    ],
    faqs: [
      { q: "Is Curblit as flexible as Webflow?", a: "Not for detailed interaction design. Curblit trades fine-grained control for speed: a complete, well-structured site in minutes that you refine by chatting." },
      { q: "Can agencies use Curblit?", a: "Yes. The Business plan covers up to 100 published sites with custom domains, which works well for agencies building sites for local clients." },
      { q: "Can I export my site?", a: "Yes, as a production-ready static site." },
    ],
  },
  {
    slug: "godaddy",
    name: "GoDaddy Website Builder",
    url: "https://www.godaddy.com/websites/website-builder",
    category: "Website builder bundled with domains",
    summary:
      "GoDaddy's website builder is convenient if you already buy your domain and email there, and its AI can put up a simple site quickly. Curblit focuses on the quality of the site itself: custom design, multiple well-structured pages, and SEO that's built in rather than added on.",
    theyreGreatFor: [
      "Getting a basic one-page site up alongside a GoDaddy domain",
      "Keeping domain, email and website under one account",
    ],
    chooseCurblitIf: [
      "You want a distinctive design, not a template look",
      "You need several pages that each rank for your services",
      "You want to keep changing your site by just asking for it",
    ],
    rows: [
      { label: "Design", curblit: "Custom-generated for your business", them: "Template-based sections" },
      { label: "Pages & structure", curblit: "Multi-page with SEO structure by default", them: "Often a simple site you extend manually" },
      { label: "Editing", curblit: "Chat, click-to-edit, code", them: "Section editor" },
      { label: "Code export", curblit: "Yes", them: "Hosted on GoDaddy" },
    ],
    faqs: [
      { q: "Can I keep my GoDaddy domain?", a: "Yes. Keep the domain at GoDaddy and point its DNS records at Curblit; we show you exactly which ones to change." },
      { q: "Can I import my GoDaddy site?", a: "Yes. Paste its address on our redesign page and we'll rebuild it with your content." },
      { q: "What about email?", a: "Your GoDaddy or Google email keeps working. Changing a website's DNS records doesn't affect email records." },
    ],
  },
  {
    slug: "hostinger",
    name: "Hostinger Website Builder",
    url: "https://www.hostinger.com/website-builder",
    category: "Budget website builder",
    summary:
      "Hostinger's website builder is one of the cheapest ways to get a site online, bundling hosting and a domain with an AI-assisted template builder. Curblit costs a little more and gives you a custom-designed, fully written site you can change conversationally.",
    theyreGreatFor: [
      "The lowest possible price for a basic site",
      "People who also want traditional web hosting from the same provider",
    ],
    chooseCurblitIf: [
      "Design quality and written content matter more than the lowest price",
      "You want to make changes by describing them",
      "You want built-in forms, analytics and SEO checks without extra setup",
    ],
    rows: [
      { label: "Price", curblit: "Free plan; paid plans with your own domain", them: "Very low, especially on long prepaid terms" },
      { label: "Design", curblit: "Custom-generated for your business", them: "AI-assisted templates" },
      { label: "Editing", curblit: "Chat, click-to-edit, code", them: "Drag-and-drop editor" },
      { label: "Code export", curblit: "Yes", them: "Hosted on Hostinger" },
    ],
    faqs: [
      { q: "Why pay more than Hostinger?", a: "You're paying for the site to be designed and written for you, and to keep improving it by just asking. If you're happy building from a template yourself, a budget builder is a fine choice." },
      { q: "Can I move from Hostinger?", a: "Yes. Paste your current site's address on the redesign page and we'll rebuild it." },
      { q: "Is there a free plan?", a: "Yes. Build and publish one site free on a Curblit subdomain." },
    ],
  },
];

export function getCompetitor(slug: string) {
  return competitors.find((c) => c.slug === slug);
}

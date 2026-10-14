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
  chooseSiteloomIf: string[];
  rows: { label: string; siteloom: string; them: string }[];
  faqs: { q: string; a: string }[];
};

export const competitors: Competitor[] = [
  {
    slug: "lovable",
    name: "Lovable",
    url: "https://lovable.dev",
    category: "AI app builder",
    summary:
      "Lovable is an AI app builder that generates full-stack React applications, typically paired with Supabase for auth and data. It's excellent when you're building an app. Siteloom is built for a different job: websites for businesses — pages that load instantly, read cleanly to search engines and AI assistants, and come with hosting, forms and analytics already working.",
    theyreGreatFor: [
      "Prototyping web apps with logins, databases and dashboards",
      "Founders validating a SaaS or internal tool idea",
      "Projects that need custom app logic beyond a website",
    ],
    chooseSiteloomIf: [
      "You need a marketing or business website, not an app",
      "Ranking on Google and appearing in AI answers matters to you",
      "You want a flat, visible price per message, with no charge when nothing changes",
      "You'd like to fix copy by clicking the text, for free",
    ],
    rows: [
      { label: "What it builds", siteloom: "Multi-page business websites and landing pages", them: "Full-stack web applications" },
      { label: "Output", siteloom: "Static HTML with compiled CSS — no framework JavaScript", them: "React application code" },
      { label: "SEO defaults", siteloom: "Titles, descriptions, canonical URLs, sitemap, JSON-LD, social cards and llms.txt on every publish", them: "Depends on project setup and rendering mode" },
      { label: "Pricing model", siteloom: "Flat credits per message, shown before you send; refunded if nothing changes", them: "Credit-based; usage varies by request" },
      { label: "Editing text", siteloom: "Click any text in the preview — free", them: "Chat, visual edits or code" },
      { label: "Contact forms", siteloom: "Built in: inbox, email alerts, spam protection", them: "Build with your backend (e.g. Supabase)" },
      { label: "Analytics", siteloom: "Built in, privacy-friendly", them: "Add a third-party tool" },
      { label: "Code export", siteloom: "Download a production-ready static site", them: "GitHub sync of app code" },
    ],
    faqs: [
      { q: "Is Siteloom a Lovable alternative?", a: "For websites, yes. If you're building an app with user accounts and a database, Lovable is the better fit; if you need a fast, search-friendly business website, Siteloom is purpose-built for that." },
      { q: "Can I move a site from Lovable to Siteloom?", a: "Describe your current site (or paste its copy) and Siteloom will rebuild it as a fast static site. Upload your logo and photos so they're reused." },
      { q: "Does Siteloom support databases or logins?", a: "No — by design. Siteloom sites are static, which makes them fast, secure and cheap to host. Forms and analytics are handled for you." },
    ],
  },
  {
    slug: "bolt",
    name: "Bolt.new",
    url: "https://bolt.new",
    category: "AI coding environment",
    summary:
      "Bolt.new by StackBlitz runs a full development environment in your browser and lets AI build apps in many frameworks. It's powerful for developers who want to see and steer every file. Siteloom hides the toolchain entirely and focuses on one outcome: a finished, hosted website that ranks.",
    theyreGreatFor: [
      "Developers who want a browser IDE with AI assistance",
      "Building apps across frameworks (React, Vue, Svelte, Expo and more)",
      "Running and debugging code in the browser",
    ],
    chooseSiteloomIf: [
      "You don't want to think about frameworks, builds or deploys",
      "You need hosting, forms, analytics and a custom domain included",
      "You want predictable per-message pricing instead of token budgets",
      "You care about SEO defaults out of the box",
    ],
    rows: [
      { label: "Audience", siteloom: "Business owners, marketers, freelancers", them: "Developers and technical builders" },
      { label: "Output", siteloom: "Static HTML + compiled CSS", them: "Framework project code (many stacks)" },
      { label: "Pricing model", siteloom: "Flat credits per message; refunded when nothing changes", them: "Token-based usage" },
      { label: "Hosting", siteloom: "Included, with custom domains on paid plans", them: "Deploy integrations" },
      { label: "Forms & analytics", siteloom: "Built in", them: "Build or integrate yourself" },
      { label: "Editing text", siteloom: "Click-to-edit in preview, free", them: "Chat or edit code" },
    ],
    faqs: [
      { q: "Is Siteloom good for developers?", a: "Developers use it to ship client sites fast: you get clean, readable HTML, a code editor, version history and a ZIP export. For complex apps, use a coding environment like Bolt." },
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
      "v0 by Vercel generates high-quality React and Next.js interfaces, often with shadcn/ui components — loved by front-end developers. Siteloom targets people who want a complete website live today, without a React project, a repo or a deploy pipeline.",
    theyreGreatFor: [
      "Generating React/Next.js UI components and screens",
      "Teams already building on Next.js and Vercel",
      "Developers who want polished UI code to drop into an app",
    ],
    chooseSiteloomIf: [
      "You want a whole multi-page website, published, in one place",
      "You'd rather not manage a React/Next.js codebase",
      "Working forms, analytics and SEO setup should come included",
    ],
    rows: [
      { label: "Output", siteloom: "Complete static website", them: "React / Next.js components and apps" },
      { label: "Best for", siteloom: "Business websites and landing pages", them: "UI for web apps" },
      { label: "Hosting", siteloom: "Included; custom domains on paid plans", them: "Deploy to Vercel" },
      { label: "Forms", siteloom: "Built in, delivered to your inbox", them: "Implement in your app" },
      { label: "Pricing model", siteloom: "Flat credits per message, shown up front", them: "Credit-based" },
    ],
    faqs: [
      { q: "Can I use Siteloom output in a Next.js app?", a: "You can export the HTML and adapt it, but Siteloom is designed to host the site for you. For components inside an app, v0 is the better tool." },
      { q: "Does Siteloom use shadcn/ui?", a: "No. Sites use Tailwind CSS compiled to a small stylesheet, plus tiny bits of JavaScript only where needed." },
      { q: "Which is better for SEO?", a: "Both can produce crawlable pages. Siteloom applies SEO defaults automatically on every publish, so non-developers get them without configuration." },
    ],
  },
  {
    slug: "wix",
    name: "Wix",
    url: "https://www.wix.com",
    category: "Website builder",
    summary:
      "Wix is one of the largest website builders, with a drag-and-drop editor, AI site creation and a huge app market for bookings, stores and more. Siteloom takes a different approach: you describe changes in plain language (or click text to edit), and you can download your site and leave anytime.",
    theyreGreatFor: [
      "People who want a visual drag-and-drop editor",
      "Online stores and bookings using Wix's built-in apps",
      "Businesses that want everything in one big ecosystem",
    ],
    chooseSiteloomIf: [
      "You'd rather describe changes than drag boxes around",
      "You want lightweight pages that load fast on mobile",
      "Owning your code matters: export a static site whenever you want",
      "You want a genuinely custom design, not a template",
    ],
    rows: [
      { label: "How you edit", siteloom: "Chat with AI + click-to-edit text", them: "Drag-and-drop editor + AI tools" },
      { label: "Design", siteloom: "Generated for your business from scratch", them: "Templates and AI-generated layouts" },
      { label: "Code ownership", siteloom: "Download a static site anytime", them: "Sites stay on Wix's platform" },
      { label: "E-commerce", siteloom: "Link to Stripe/Shopify/Square checkout", them: "Built-in store" },
      { label: "Page weight", siteloom: "Static HTML, compiled CSS, no framework JS", them: "Platform runtime" },
    ],
    faqs: [
      { q: "Can Siteloom replace my Wix site?", a: "For most service-business sites, yes. Describe your business (or paste your current copy), connect your domain and publish. If you rely on Wix Stores or Bookings, keep those or link to an alternative." },
      { q: "Is there a drag-and-drop editor?", a: "No. You describe changes in plain English, click text to edit it directly, or edit code if you like." },
      { q: "Can I keep my domain?", a: "Yes — point your domain's DNS to Siteloom on a paid plan." },
    ],
  },
  {
    slug: "framer",
    name: "Framer",
    url: "https://www.framer.com",
    category: "Design-first website builder",
    summary:
      "Framer is a design-first website builder with a canvas editor, rich animations and a CMS — a favorite of designers. Siteloom is for people who want great design without designing: you describe the business and the AI handles layout, copy and SEO.",
    theyreGreatFor: [
      "Designers who want pixel-level control on a canvas",
      "Highly animated marketing sites",
      "Teams that want a visual CMS",
    ],
    chooseSiteloomIf: [
      "You're not a designer and don't want to become one",
      "You want copy, structure and SEO written for you",
      "Exporting your site as plain HTML matters",
    ],
    rows: [
      { label: "How you build", siteloom: "Describe it; AI designs and writes it", them: "Design on a visual canvas (with AI assists)" },
      { label: "Copywriting", siteloom: "Written for your business and location", them: "You write it" },
      { label: "Code export", siteloom: "Download static HTML anytime", them: "Hosted on Framer" },
      { label: "Forms & analytics", siteloom: "Built in", them: "Built in" },
    ],
    faqs: [
      { q: "Is Siteloom as flexible as Framer?", a: "Not for pixel-level design work. It's faster for getting a complete, well-written site live, and you can still edit any code." },
      { q: "Does Siteloom support animations?", a: "Yes — tasteful transitions and hover effects, respecting reduced-motion settings. Ask for specific effects in chat." },
      { q: "Can I switch from Framer?", a: "Paste your current copy and describe the look you like; Siteloom rebuilds it." },
    ],
  },
  {
    slug: "durable",
    name: "Durable",
    url: "https://durable.co",
    category: "AI website builder for small business",
    summary:
      "Durable generates small-business websites in seconds and bundles business tools like a CRM and invoicing. Siteloom focuses on depth for the website itself: multi-page sites with custom design, real SEO structure and conversational editing.",
    theyreGreatFor: [
      "Getting a basic site up in under a minute",
      "Solo businesses that want website + CRM + invoicing in one",
    ],
    chooseSiteloomIf: [
      "You want a more custom, distinctive design",
      "You need multiple well-structured pages that rank",
      "You want to iterate by chatting (\"add a pricing page\") and own the code",
    ],
    rows: [
      { label: "Site depth", siteloom: "Multi-page sites with structured content", them: "Fast, simpler sites" },
      { label: "Editing", siteloom: "Conversational AI + click-to-edit + code", them: "Section editor + AI" },
      { label: "Extras", siteloom: "Forms inbox, analytics, AI photos", them: "CRM, invoicing and more" },
      { label: "Code export", siteloom: "Yes, static site download", them: "Hosted on Durable" },
    ],
    faqs: [
      { q: "Is Siteloom as fast as Durable?", a: "A first draft takes about a minute or two because Siteloom writes complete, multi-page sites with custom copy." },
      { q: "Does Siteloom include a CRM?", a: "Form submissions go to an inbox in your dashboard (and email on paid plans). For a full CRM, connect your favorite tool via links." },
      { q: "Can I use my own domain?", a: "Yes, on any paid plan." },
    ],
  },
];

export function getCompetitor(slug: string) {
  return competitors.find((c) => c.slug === slug);
}

/**
 * Programmatic SEO: one landing page per industry at /for/[slug]
 * ("AI website builder for dentists", etc.). Each entry has genuinely specific copy —
 * thin, templated pages don't rank, so add industries only with real detail.
 */
export type Industry = {
  slug: string;
  name: string; // "Dentists"
  singular: string; // "dental practice"
  headline: string;
  intro: string;
  pages: string[];
  mustHaves: { title: string; body: string }[];
  prompt: string;
  seoTips: string[];
  faqs: { q: string; a: string }[];
  schemaType: string;
};

export const industries: Industry[] = [
  {
    slug: "restaurants",
    name: "Restaurants",
    singular: "restaurant",
    headline: "A restaurant website that fills tables, not just space",
    intro:
      "Diners decide in seconds: Is it open? What's on the menu? Can I book? Curblit builds a fast restaurant site that answers all three above the fold, with a real HTML menu Google can read, opening hours in structured data, and a reservation request form that lands in your inbox.",
    pages: ["Home", "Menu", "About / Our story", "Private events", "Contact & hours"],
    mustHaves: [
      { title: "A text menu, not a PDF", body: "Menus as real HTML rank for dish searches (\"best birria tacos near me\") and load instantly on phones. PDFs do neither." },
      { title: "Hours and location everywhere", body: "Opening hours, address and a map link in the header or footer, plus Restaurant schema so Google shows them in search." },
      { title: "One-tap actions", body: "Call, directions and reserve buttons sized for thumbs — most restaurant traffic is mobile and in a hurry." },
      { title: "Private-events inquiries", body: "A separate form for parties and catering captures your highest-value bookings with the details you need to quote." },
    ],
    prompt:
      "A website for Casa Lumbre, a modern Mexican restaurant in Austin, TX. Warm, rustic-modern style. Pages: home, menu (tacos, mains, drinks with prices as placeholders), our story, private events with an inquiry form, and contact with hours and a reservation request form.",
    seoTips: [
      "Put your neighborhood and cuisine in the home page title, e.g. \"Mexican Restaurant in East Austin | Casa Lumbre\".",
      "Keep hours identical on your site and Google Business Profile — mismatches cost rankings.",
      "Give every signature dish a short description; those words are what people search.",
    ],
    faqs: [
      { q: "Can customers book a table?", a: "Yes. Curblit adds a reservation request form that emails you each request. If you already use OpenTable or Resy, ask the AI to add your booking link instead." },
      { q: "How do I update the menu?", a: "Click any dish or price in the preview and type — text edits are free and don't use credits. Then press Publish." },
      { q: "Will my menu show up on Google?", a: "Menus are published as real HTML with Restaurant structured data, which search engines and AI assistants can read directly." },
    ],
    schemaType: "Restaurant",
  },
  {
    slug: "dentists",
    name: "Dentists",
    singular: "dental practice",
    headline: "A dental practice website that turns searches into booked appointments",
    intro:
      "New patients compare two or three practices before calling. Curblit builds a calm, trustworthy dental site that answers their real questions — insurance, emergencies, what a first visit is like — and makes requesting an appointment effortless.",
    pages: ["Home", "Services", "Meet the team", "New patients & insurance", "Contact / Book"],
    mustHaves: [
      { title: "Insurance clarity", body: "A plain list of accepted plans and payment options answers the #1 question that stops new patients from calling." },
      { title: "Service pages that rank", body: "Separate sections for cleanings, implants, Invisalign and emergencies so you can rank for each treatment people search." },
      { title: "Appointment request form", body: "Name, phone, preferred times and reason for visit — delivered to your front desk's inbox." },
      { title: "Real faces", body: "Team bios with photos build trust. Curblit leaves clear placeholders so you never publish made-up credentials." },
    ],
    prompt:
      "A website for Bright Smile Dental, a family dental practice in Columbus, OH. Calm and clean style with soft teal. Pages: home, services (cleanings, whitening, implants, Invisalign, emergency care), meet the team, new patients & insurance, and contact with an appointment request form.",
    seoTips: [
      "Use \"Dentist in [City]\" in your home page title and H1 — it's the highest-intent search you can win.",
      "Answer common questions (\"Does a filling hurt?\") in an FAQ; Google and AI assistants quote these directly.",
      "Add your practice to Google Business Profile with the exact same name, address and phone number as the site.",
    ],
    faqs: [
      { q: "Is the appointment form HIPAA compliant?", a: "The built-in form is meant for appointment requests, not medical records. Don't collect detailed health information through it; for that, link to your practice-management system's patient portal." },
      { q: "Can I list the insurance plans we accept?", a: "Yes — tell the AI your list, or click into the insurance section and edit the text for free." },
      { q: "Do I need a developer?", a: "No. Describe your practice, review the preview, click to fix any wording, and publish. You can connect your existing domain on paid plans." },
    ],
    schemaType: "Dentist",
  },
  {
    slug: "plumbers",
    name: "Plumbers",
    singular: "plumbing business",
    headline: "A plumbing website that makes the phone ring",
    intro:
      "When a pipe bursts, people call the first plumber that looks legit and loads fast. Curblit builds a mobile-first plumbing site with a sticky call button, clear service areas and emergency availability — the things that win the call.",
    pages: ["Home", "Services", "Service areas", "About", "Contact / Free quote"],
    mustHaves: [
      { title: "Click-to-call everywhere", body: "A sticky call button on mobile and your number in the header. Every extra tap loses emergency jobs." },
      { title: "Service-area content", body: "A section per town or neighborhood you serve helps you rank in each one, not just your home city." },
      { title: "Quote request form", body: "Job type, address and urgency — so you can triage and call back fast." },
      { title: "Licensing and guarantees", body: "Placeholders for license numbers and warranty terms keep claims accurate and build trust." },
    ],
    prompt:
      "A website for Rapid Flow Plumbing in Phoenix, AZ — 24/7 emergency plumbing, water heaters, drain cleaning, leak detection. Bold, trustworthy style with navy and orange. Sticky call button on mobile. Pages: home, services, service areas (Phoenix, Tempe, Mesa, Scottsdale), about, and a free quote form.",
    seoTips: [
      "Mention each city you serve in its own paragraph — Google matches local searches to on-page text.",
      "List specific services (\"tankless water heater installation\") rather than just \"plumbing\".",
      "Ask happy customers for Google reviews and link to your review profile from the site.",
    ],
    faqs: [
      { q: "Can people request a quote from the site?", a: "Yes. A quote form is built in and sends each request to your email (paid plans) and your dashboard inbox." },
      { q: "Will it work well on phones?", a: "Every site is mobile-first, with large tap targets and a call button that stays on screen." },
      { q: "Can I show the areas I serve?", a: "Ask the AI for a service-areas page with a section per city — great for local SEO." },
    ],
    schemaType: "Plumber",
  },
  {
    slug: "law-firms",
    name: "Law firms",
    singular: "law firm",
    headline: "A law firm website that earns trust before the first consultation",
    intro:
      "People looking for a lawyer are often stressed and comparing options carefully. Curblit builds a composed, credible firm website with clear practice areas, attorney profiles and a confidential consultation request — and it never invents case results or testimonials.",
    pages: ["Home", "Practice areas", "Attorneys", "Results & FAQ", "Contact / Consultation"],
    mustHaves: [
      { title: "One section per practice area", body: "Personal injury, family law and estate planning each deserve their own copy — that's how firms rank for each." },
      { title: "Attorney bios", body: "Education, bar admissions and focus areas, with placeholders until you fill in verified details." },
      { title: "Consultation request", body: "A short, respectful form with a note not to share confidential details until engagement." },
      { title: "Compliant by default", body: "No fabricated verdicts or reviews — important for bar advertising rules." },
    ],
    prompt:
      "A website for Hartwell & Reyes, a two-attorney family law and estate planning firm in Denver, CO. Refined, editorial style with deep green and serif headings. Pages: home, practice areas, attorneys, FAQ, and a consultation request form.",
    seoTips: [
      "Target \"[practice area] lawyer in [city]\" in titles and headings for each practice page.",
      "Write genuinely helpful FAQ answers; they rank and they show expertise.",
      "Check your state bar's advertising rules before adding results or testimonials.",
    ],
    faqs: [
      { q: "Will the AI write fake case results?", a: "No. Curblit never invents results, reviews or credentials — it leaves highlighted placeholders like [[Bar admission]] for you to fill." },
      { q: "Can I add a disclaimer?", a: "Yes — ask for an attorney-advertising disclaimer in the footer, or edit the footer text directly." },
      { q: "Can I use my existing domain?", a: "Paid plans can connect a custom domain like yourfirm.com." },
    ],
    schemaType: "LegalService",
  },
  {
    slug: "real-estate-agents",
    name: "Real estate agents",
    singular: "real estate business",
    headline: "A real estate website that makes you the local expert",
    intro:
      "Buyers and sellers pick agents who clearly know the neighborhood. Curblit builds a polished agent site with neighborhood guides, a home-valuation request form and a strong personal brand — so you stop renting your audience from portals.",
    pages: ["Home", "Buy", "Sell / Home valuation", "Neighborhoods", "About & contact"],
    mustHaves: [
      { title: "Home valuation form", body: "Your best seller lead magnet: address, timeline and contact details straight to your inbox." },
      { title: "Neighborhood guides", body: "Short, specific guides to the areas you work rank for \"living in [neighborhood]\" searches." },
      { title: "Personal brand", body: "Your story, photo and approach front and center — people hire agents, not logos." },
      { title: "Listing links", body: "Link out to your MLS/IDX search or brokerage page rather than duplicating listings." },
    ],
    prompt:
      "A website for Maya Chen, a real estate agent in Seattle focused on Ballard, Fremont and Queen Anne. Modern, airy style. Pages: home, buy, sell with a home valuation request form, neighborhood guides for the three areas, and about/contact.",
    seoTips: [
      "Write a neighborhood guide per area with schools, parks and commute notes — they rank and get shared.",
      "Use \"[Neighborhood] real estate agent\" in titles.",
      "Keep your brokerage's required disclosures in the footer.",
    ],
    faqs: [
      { q: "Can I show my listings?", a: "Link your MLS/IDX or brokerage listings page from the site. Embedding live IDX feeds isn't built in yet." },
      { q: "How do seller leads reach me?", a: "The home-valuation form sends each request to your email on paid plans, and every submission is saved in your dashboard." },
      { q: "Can I add more neighborhoods later?", a: "Yes — ask the AI to add a guide for any area." },
    ],
    schemaType: "RealEstateAgent",
  },
  {
    slug: "photographers",
    name: "Photographers",
    singular: "photography business",
    headline: "A photography portfolio that books shoots",
    intro:
      "Your work should do the talking, but clients also need to know what you shoot, what it costs and how to book. Curblit builds an image-forward portfolio with galleries, packages and an inquiry form that captures date, location and budget.",
    pages: ["Home", "Portfolio", "Packages", "About", "Inquire"],
    mustHaves: [
      { title: "Fast, image-led galleries", body: "Upload your photos and they're converted to compressed WebP automatically, so galleries stay fast." },
      { title: "Packages with clear starting prices", body: "Even \"from\" pricing filters out poor-fit inquiries." },
      { title: "Inquiry form with the right fields", body: "Date, location, type of shoot and budget — everything you need to reply with a quote." },
      { title: "Descriptive alt text", body: "Image SEO brings in searches like \"Joshua Tree elopement photographer\"." },
    ],
    prompt:
      "A portfolio website for Noor Haddad Photography — wedding and elopement photography in Southern California. Minimal, editorial, lots of white space. Pages: home, portfolio, packages (starting prices as placeholders), about, and an inquiry form with date, location and budget.",
    seoTips: [
      "Upload your real photos and describe each one — alt text is how images rank.",
      "Write a short story for each featured shoot (location, season, vibe).",
      "Use \"[type] photographer in [region]\" in your page titles.",
    ],
    faqs: [
      { q: "Can I use my own photos?", a: "Yes — upload them in the builder and tell the AI where to use them. They're optimized automatically." },
      { q: "Will AI-generated photos appear in my portfolio?", a: "Only if you ask. For a portfolio, upload your real work; AI photos are best for decorative backgrounds." },
      { q: "Can clients pay a deposit?", a: "Add a link to your Stripe, Square or HoneyBook payment page and the AI will place it as a button." },
    ],
    schemaType: "ProfessionalService",
  },
  {
    slug: "hair-salons",
    name: "Hair salons",
    singular: "salon",
    headline: "A salon website as polished as your work",
    intro:
      "Clients want to see your style, your prices and an easy way to book. Curblit builds a stylish salon site with a service menu, stylist profiles and a booking button that links to the scheduler you already use.",
    pages: ["Home", "Services & prices", "Stylists", "Gallery", "Book / Contact"],
    mustHaves: [
      { title: "A clear service menu", body: "Cuts, color, treatments and \"from\" prices — the page clients check most." },
      { title: "Stylist profiles", body: "Specialties and personality help clients choose who to book." },
      { title: "Booking button", body: "Link to Square, Vagaro, Fresha or your scheduler; or use the built-in request form." },
      { title: "Before & after gallery", body: "Your best transformations, with alt text describing the style." },
    ],
    prompt:
      "A website for Atelier Rose, a boutique hair salon in Brooklyn specializing in lived-in color and curly cuts. Chic, warm style with blush and charcoal. Pages: home, services & prices, stylists, gallery, and contact with a booking button.",
    seoTips: [
      "Name your specialties explicitly (\"balayage\", \"curly cuts\") — that's how clients search.",
      "Include your neighborhood in the title and footer.",
      "Link to your Instagram, but keep key info on the site where Google can read it.",
    ],
    faqs: [
      { q: "Can it connect to my booking app?", a: "Yes. Give the AI your booking link (Vagaro, Square, Fresha, etc.) and it'll add booking buttons throughout." },
      { q: "Can I change prices myself?", a: "Click any price in the preview and type. Text edits are always free." },
      { q: "Does it look good on Instagram's in-app browser?", a: "Sites are lightweight and mobile-first, so they load quickly from social links." },
    ],
    schemaType: "HairSalon",
  },
  {
    slug: "personal-trainers",
    name: "Personal trainers",
    singular: "fitness coaching business",
    headline: "A personal trainer website that converts followers into clients",
    intro:
      "Social media gets you noticed; a website gets you hired. Curblit builds a high-energy coaching site with your programs, a free consultation form and a clear path from \"interested\" to \"signed up\".",
    pages: ["Home", "Programs", "About / Approach", "Results & FAQ", "Free consultation"],
    mustHaves: [
      { title: "Programs with outcomes", body: "1:1, small group and online coaching, each with who it's for and what's included." },
      { title: "Consultation form", body: "Goals, experience and availability, so your first call is productive." },
      { title: "Honest results", body: "Placeholders for real client stories — never invented transformations." },
      { title: "Fast on mobile", body: "Most of your traffic arrives from Instagram and TikTok on phones." },
    ],
    prompt:
      "A website for Coach Dani Ortiz, a strength coach in Miami offering 1:1 training, small-group sessions and online programs for busy professionals. Bold, energetic style with black and electric lime. Pages: home, programs, approach, FAQ, and a free consultation form.",
    seoTips: [
      "Use \"personal trainer in [city]\" and the specific type of training you offer.",
      "Answer pricing and schedule questions in an FAQ.",
      "Add real client testimonials (with permission) once you have them.",
    ],
    faqs: [
      { q: "Can I sell online programs?", a: "Link a Stripe Payment Link or your coaching app for checkout — the AI will add buy buttons." },
      { q: "Will it make up client results?", a: "No. It uses clear placeholders until you add real, permitted testimonials." },
      { q: "How fast can I launch?", a: "Most people publish their first version the same day." },
    ],
    schemaType: "HealthClub",
  },
  {
    slug: "coffee-shops",
    name: "Coffee shops",
    singular: "coffee shop",
    headline: "A coffee shop website with as much character as your café",
    intro:
      "Your website should feel like walking in: the smell of fresh espresso, the playlist, the regulars. Curblit builds a characterful café site with your menu, hours, events and wholesale inquiries — fast enough to load on a spotty phone connection in line.",
    pages: ["Home", "Menu", "Our beans / Story", "Events", "Visit & contact"],
    mustHaves: [
      { title: "Menu with personality", body: "Drinks, pastries and seasonal specials in real HTML, easy to update for free." },
      { title: "Hours and map", body: "Front and center, with CafeOrCoffeeShop structured data." },
      { title: "Events and community", body: "Open mics, cuppings and workshops give people a reason to come back." },
      { title: "Wholesale inquiries", body: "A form for offices and restaurants that want your beans." },
    ],
    prompt:
      "A website for Driftwood Coffee Co., a neighborhood café and micro-roaster in Portland, ME. Cozy, coastal style with sand and deep blue. Pages: home, menu, our beans, events, and visit/contact with hours and a wholesale inquiry form.",
    seoTips: [
      "Put \"coffee shop in [neighborhood]\" in the title — that's how people find cafés.",
      "Mention signature drinks and pastries by name.",
      "Keep seasonal hours updated (it's free to edit).",
    ],
    faqs: [
      { q: "Can I sell beans online?", a: "Link a Shopify, Square Online or Stripe store and the AI will add shop buttons. A full storefront isn't built in yet." },
      { q: "Can I post events?", a: "Ask the AI for an events section, then edit dates and details directly in the preview." },
      { q: "Is there a free plan?", a: "Yes — publish one site free on a Curblit subdomain, and upgrade when you want your own domain." },
    ],
    schemaType: "CafeOrCoffeeShop",
  },
  {
    slug: "contractors",
    name: "Contractors",
    singular: "contracting business",
    headline: "A contractor website that wins bigger jobs",
    intro:
      "Homeowners hiring for a remodel want proof: past projects, licensing, a clear process. Curblit builds a solid, professional contractor site with a project gallery, services, service areas and an estimate request form.",
    pages: ["Home", "Services", "Projects", "Our process", "Request an estimate"],
    mustHaves: [
      { title: "Project gallery", body: "Before/after photos with short write-ups (scope, timeline, neighborhood)." },
      { title: "Clear process", body: "Consultation → estimate → build → walkthrough sets expectations and reduces tire-kickers." },
      { title: "Licensing & insurance", body: "Placeholders for license numbers and coverage so details are accurate." },
      { title: "Estimate request", body: "Project type, budget range, timeline and address in one form." },
    ],
    prompt:
      "A website for Northline Builders, a residential remodeling contractor in Minneapolis focused on kitchens, bathrooms and basements. Sturdy, modern style with slate and warm wood tones. Pages: home, services, projects, our process, and an estimate request form.",
    seoTips: [
      "Create a section for each service (\"kitchen remodeling in Minneapolis\").",
      "Describe each project with the neighborhood name for local relevance.",
      "Show your license number in the footer.",
    ],
    faqs: [
      { q: "Can I upload project photos?", a: "Yes. Upload them in the builder; they're compressed automatically for fast loading." },
      { q: "Can I get notified of estimate requests?", a: "Paid plans email every submission to you; all plans keep them in your dashboard." },
      { q: "Can I add service areas?", a: "Ask the AI to add a service-areas section listing the towns you cover." },
    ],
    schemaType: "HomeAndConstructionBusiness",
  },
  {
    slug: "therapists",
    name: "Therapists",
    singular: "therapy practice",
    headline: "A therapy practice website that feels safe from the first click",
    intro:
      "Reaching out to a therapist takes courage. Curblit builds a gentle, reassuring practice website that explains your approach, specialties, fees and insurance, and offers a low-pressure way to request a consultation.",
    pages: ["Home", "Approach & specialties", "About me", "Fees & insurance", "Contact"],
    mustHaves: [
      { title: "Warm, plain language", body: "Clear descriptions of who you help and how, without clinical jargon." },
      { title: "Fees and insurance upfront", body: "Reduces anxiety and saves you unnecessary calls." },
      { title: "Privacy-conscious contact", body: "A short form that asks people not to share sensitive details until you connect." },
      { title: "Crisis note", body: "A footer line pointing to emergency resources (e.g. 988 in the US)." },
    ],
    prompt:
      "A website for Clearwater Counseling — Jamie Patel, LMFT, offering therapy for anxiety, couples and life transitions in Sacramento and online in California. Calm, soft style with sage green. Pages: home, approach & specialties, about, fees & insurance, and a consultation request form. Include a crisis resources note in the footer.",
    seoTips: [
      "Use \"therapist for [specialty] in [city]\" phrasing in titles and headings.",
      "Write about each specialty in its own section.",
      "Mention telehealth availability and which states you're licensed in.",
    ],
    faqs: [
      { q: "Is the contact form secure for clinical information?", a: "Use it for consultation requests only and ask clients not to share clinical details there. For intake, link to your HIPAA-compliant EHR portal." },
      { q: "Can I list my credentials?", a: "Yes — the AI adds placeholders like [[License number]] so you fill in verified details." },
      { q: "Can I link to Psychology Today?", a: "Of course. Give the AI the link and it'll add it where you like." },
    ],
    schemaType: "MedicalBusiness",
  },
  {
    slug: "accountants",
    name: "Accountants",
    singular: "accounting firm",
    headline: "An accounting firm website that brings in the right clients",
    intro:
      "Businesses choose accountants who understand their world. Curblit builds a sharp, credible firm website that speaks to your niche — whether that's restaurants, creators or startups — and turns visitors into discovery calls.",
    pages: ["Home", "Services", "Who we help", "About", "Book a call"],
    mustHaves: [
      { title: "Niche positioning", body: "A \"who we help\" page that names your ideal clients beats a generic service list." },
      { title: "Service packages", body: "Bookkeeping, tax prep, fractional CFO — with what's included." },
      { title: "Discovery call form", body: "Revenue range, entity type and needs so you can qualify leads." },
      { title: "Deadline content", body: "Tax deadline reminders and FAQs attract search traffic every season." },
    ],
    prompt:
      "A website for Ledgerline Advisors, an accounting firm in Chicago serving restaurants and hospitality businesses: bookkeeping, tax preparation, payroll and fractional CFO services. Professional, modern style with navy and gold. Pages: home, services, who we help, about, and a discovery call form.",
    seoTips: [
      "Combine your niche and location: \"restaurant accountant in Chicago\".",
      "Publish an FAQ about deadlines and common questions in your niche.",
      "List credentials (CPA, EA) accurately.",
    ],
    faqs: [
      { q: "Can I link to my client portal?", a: "Yes — ask the AI to add a \"Client login\" link to your portal in the header." },
      { q: "Can I schedule calls through the site?", a: "Use the built-in form or link your Calendly/SavvyCal for instant booking." },
      { q: "Can I change copy without credits?", a: "Yes. Clicking any text in the preview to edit it is always free." },
    ],
    schemaType: "AccountingService",
  },
  {
    slug: "wedding-planners",
    name: "Wedding planners",
    singular: "wedding planning business",
    headline: "A wedding planner website as beautiful as your events",
    intro:
      "Couples fall for a feeling before they read a word. Curblit builds an elegant, image-led planner site that shows your style, explains your packages and makes inquiring feel exciting, not transactional.",
    pages: ["Home", "Services", "Weddings", "About", "Inquire"],
    mustHaves: [
      { title: "Story-driven galleries", body: "Real weddings with venue, season and a few lines about the couple." },
      { title: "Packages", body: "Full planning, partial planning and month-of coordination with \"starting at\" prices." },
      { title: "Inquiry form", body: "Date, venue, guest count and budget — everything for a quick, confident reply." },
      { title: "Venue mentions", body: "Naming venues you've worked at brings in searches from couples who booked them." },
    ],
    prompt:
      "A website for Golden Hour Events, a wedding planner in Charleston, SC specializing in intimate destination weddings. Romantic, elegant style with champagne and deep green, serif headings. Pages: home, services, featured weddings, about, and an inquiry form with date, venue, guest count and budget.",
    seoTips: [
      "Name the venues and towns you work in.",
      "Write a short story for each featured wedding.",
      "Use \"wedding planner in [city]\" in your title and H1.",
    ],
    faqs: [
      { q: "Can I upload photos from my photographers?", a: "Yes (with their permission). Upload them and credit the photographer in the caption." },
      { q: "Can couples pay a retainer online?", a: "Add your payment or contract link (HoneyBook, Dubsado, Stripe) as a button." },
      { q: "Can I add a blog later?", a: "Yes — ask the AI to add a journal page and new posts any time." },
    ],
    schemaType: "ProfessionalService",
  },
  {
    slug: "landscapers",
    name: "Landscapers",
    singular: "landscaping business",
    headline: "A landscaping website that grows your client list",
    intro:
      "Homeowners shop for landscapers by looking at work. Curblit builds a fresh, photo-forward landscaping site with services, seasonal offers, service areas and a quote request form.",
    pages: ["Home", "Services", "Projects", "Service areas", "Get a quote"],
    mustHaves: [
      { title: "Seasonal services", body: "Spring cleanups, maintenance plans, hardscaping and snow removal each get their own copy." },
      { title: "Project photos", body: "Before/after transformations sell bigger design-build jobs." },
      { title: "Quote form", body: "Property size, services wanted and address for fast estimates." },
      { title: "Maintenance plans", body: "Recurring revenue packages explained simply." },
    ],
    prompt:
      "A website for Evergreen Grounds, a landscaping and hardscaping company in Raleigh, NC: lawn maintenance, landscape design, patios and retaining walls, seasonal cleanups. Fresh, earthy style with forest green and stone. Pages: home, services, projects, service areas, and a quote request form.",
    seoTips: [
      "Mention each town you serve.",
      "Write specific service descriptions (\"paver patio installation\").",
      "Update seasonal offers — fresh content helps.",
    ],
    faqs: [
      { q: "Can I add seasonal promotions?", a: "Yes. Ask the AI for a banner or section, then edit dates for free whenever they change." },
      { q: "Do I get notified of quote requests?", a: "Yes — instantly by email on paid plans, and always in your dashboard." },
      { q: "Can I use my domain?", a: "Connect any domain you own on a paid plan." },
    ],
    schemaType: "HomeAndConstructionBusiness",
  },
  {
    slug: "yoga-studios",
    name: "Yoga studios",
    singular: "yoga studio",
    headline: "A yoga studio website that fills your classes",
    intro:
      "New students want to know which class to start with and how to book it. Curblit builds a serene studio site with class descriptions, teachers, pricing and a clear \"first class\" path that links to your booking platform.",
    pages: ["Home", "Classes", "Schedule & pricing", "Teachers", "New students"],
    mustHaves: [
      { title: "Beginner path", body: "A \"start here\" page reduces the intimidation that stops first visits." },
      { title: "Class descriptions", body: "Vinyasa, yin, prenatal — what to expect, level and duration." },
      { title: "Booking links", body: "Connect Mindbody, Momence or Walla for schedules and payments." },
      { title: "Intro offer", body: "A prominent new-student offer is your best conversion lever." },
    ],
    prompt:
      "A website for Still Point Yoga, a community yoga studio in Boulder, CO offering vinyasa, yin, prenatal and beginner classes. Serene style with warm neutrals and terracotta. Pages: home, classes, schedule & pricing (link to booking), teachers, and a new students page with an intro offer.",
    seoTips: [
      "Use \"yoga classes in [city]\" and name class styles.",
      "Answer beginner questions (what to bring, what to wear) in an FAQ.",
      "Keep your intro offer consistent everywhere.",
    ],
    faqs: [
      { q: "Can I embed my class schedule?", a: "Link to your booking platform's schedule from prominent buttons. Embedded widgets can be added by pasting their code in the code editor." },
      { q: "Can teachers have bios?", a: "Yes — the AI creates teacher cards you can edit directly." },
      { q: "Is there a free plan?", a: "Yes. Build and publish your first site free." },
    ],
    schemaType: "ExerciseGym",
  },
  {
    slug: "auto-repair",
    name: "Auto repair shops",
    singular: "auto repair shop",
    headline: "An auto repair website that drivers trust",
    intro:
      "Drivers worry about being overcharged. Curblit builds a straightforward auto shop site with services, warranties, certifications and an appointment request form — clear, honest and easy to use from the side of the road.",
    pages: ["Home", "Services", "Why us", "Reviews", "Book service"],
    mustHaves: [
      { title: "Service list", body: "Brakes, oil changes, diagnostics, tires, AC — the exact terms people search." },
      { title: "Trust signals", body: "Warranty terms and certifications (ASE etc.) as placeholders until verified." },
      { title: "Appointment request", body: "Vehicle make/model/year, issue and preferred time." },
      { title: "Hours and location", body: "AutoRepair structured data so Google shows them." },
    ],
    prompt:
      "A website for Precision Auto Care, an independent auto repair shop in Dallas, TX: brakes, diagnostics, oil changes, AC repair, tires. Clean, honest style with charcoal and red. Pages: home, services, why us, reviews (placeholders for real reviews), and a book service form.",
    seoTips: [
      "Name the makes you specialize in (\"Honda and Toyota repair\").",
      "Include your neighborhood or nearby landmarks.",
      "Link to your Google reviews.",
    ],
    faqs: [
      { q: "Can customers book online?", a: "Yes, via the built-in appointment request form — or link your shop management system's booking page." },
      { q: "Will it invent reviews?", a: "Never. It adds placeholders so you can paste real reviews." },
      { q: "Does it work on phones?", a: "Yes, with click-to-call and directions buttons." },
    ],
    schemaType: "AutoRepair",
  },
  {
    slug: "consultants",
    name: "Consultants",
    singular: "consulting business",
    headline: "A consultant website that positions you as the obvious choice",
    intro:
      "Consulting clients buy expertise and fit. Curblit builds a crisp, authoritative site that names the problem you solve, shows how you work and makes booking a discovery call simple.",
    pages: ["Home", "Services", "Approach", "Case studies", "Book a call"],
    mustHaves: [
      { title: "Sharp positioning", body: "Who you help and the outcome you deliver, in one sentence above the fold." },
      { title: "Engagement models", body: "Workshops, retainers, projects — with what's included." },
      { title: "Case study structure", body: "Challenge → approach → result, with placeholders for real numbers." },
      { title: "Discovery call", body: "A form or calendar link that pre-qualifies leads." },
    ],
    prompt:
      "A website for Northstar Ops, a fractional COO consultancy helping 10–50 person startups build operations and hiring systems. Confident, minimal style with black, white and one accent color. Pages: home, services, approach, case studies (placeholders), and a book a call page.",
    seoTips: [
      "Target the problem you solve (\"startup operations consultant\").",
      "Publish case studies with real (permitted) numbers.",
      "Write a few in-depth articles on your niche.",
    ],
    faqs: [
      { q: "Can I add a newsletter signup?", a: "Yes — a Newsletter form collects emails into your dashboard, or link your ConvertKit/beehiiv form." },
      { q: "Can I link Calendly?", a: "Yes, give the AI your link." },
      { q: "Can I export my site?", a: "Download it as a static site anytime — no lock-in." },
    ],
    schemaType: "ProfessionalService",
  },
  {
    slug: "nonprofits",
    name: "Nonprofits",
    singular: "nonprofit",
    headline: "A nonprofit website that turns visitors into supporters",
    intro:
      "Donors and volunteers need to understand your mission, see your impact and know exactly how to help. Curblit builds a moving, clear nonprofit site with programs, impact, volunteer sign-ups and a donate button linked to your giving platform.",
    pages: ["Home", "Our work", "Impact", "Get involved", "Donate"],
    mustHaves: [
      { title: "Mission in one line", body: "Clear and emotional, right at the top." },
      { title: "Impact with real numbers", body: "Placeholders until you add verified figures from your reports." },
      { title: "Volunteer form", body: "Interests and availability, saved to your dashboard." },
      { title: "Donate button", body: "Links to Givebutter, Donorbox, PayPal Giving or Stripe." },
    ],
    prompt:
      "A website for Open Shelf, a nonprofit that builds free little libraries and literacy programs in Detroit neighborhoods. Hopeful, bright style. Pages: home, our work, impact (placeholders for real stats), get involved with a volunteer form, and donate (link to giving platform).",
    seoTips: [
      "Describe programs with the neighborhoods you serve.",
      "Publish impact stories — they earn links and shares.",
      "Add Organization/NGO structured data (the AI does this).",
    ],
    faqs: [
      { q: "Do you offer nonprofit discounts?", a: "Contact us from your nonprofit email — we're happy to help." },
      { q: "Can people donate on the site?", a: "Link your donation platform; the AI adds donate buttons throughout." },
      { q: "Can volunteers sign up?", a: "Yes — a volunteer form saves every sign-up to your dashboard." },
    ],
    schemaType: "NGO",
  },
  {
    slug: "saas-startups",
    name: "SaaS startups",
    singular: "SaaS startup",
    headline: "A SaaS landing page that ranks and converts",
    intro:
      "Your marketing site doesn't need to be a React app — it needs to load instantly, explain the product and rank. Curblit builds sharp SaaS landing pages with features, pricing, FAQ and a waitlist or demo form, as clean static HTML search engines love.",
    pages: ["Home", "Features", "Pricing", "Changelog / Blog", "Contact / Demo"],
    mustHaves: [
      { title: "Crisp hero", body: "Who it's for, the outcome and a single CTA — no jargon soup." },
      { title: "Feature deep-dives", body: "Use-case sections that target what buyers search." },
      { title: "Pricing table", body: "Plans with clear differences and an FAQ that handles objections." },
      { title: "Waitlist / demo form", body: "Captured to your dashboard; export as CSV anytime." },
    ],
    prompt:
      "A landing site for Tracepoint, a SaaS tool that monitors cron jobs and background tasks and alerts teams on Slack when they fail. Crisp, technical style with dark navy, mint accent and monospace details. Pages: home, features, pricing (three tiers, prices as placeholders), changelog, and a demo request form.",
    seoTips: [
      "Write one section per use case your buyers search for.",
      "Add a comparison page against the tool people switch from.",
      "Keep the marketing site separate from your app for speed.",
    ],
    faqs: [
      { q: "Is static HTML enough for a SaaS site?", a: "For the marketing site, yes — it's the fastest, most crawlable option. Your actual app can live on its own subdomain." },
      { q: "Can I collect waitlist emails?", a: "Yes, with a built-in form; export submissions as CSV." },
      { q: "Can I put it on my domain?", a: "Connect yourproduct.com on any paid plan." },
    ],
    schemaType: "SoftwareApplication",
  },
  {
    slug: "cleaning-services",
    name: "Cleaning services",
    singular: "cleaning business",
    headline: "A cleaning service website that books recurring clients",
    intro:
      "Recurring clients are the heart of a cleaning business. Curblit builds a bright, trustworthy site with service packages, what's included, service areas and an instant quote request that captures home size and frequency.",
    pages: ["Home", "Services", "What's included", "Service areas", "Get a quote"],
    mustHaves: [
      { title: "Packages by frequency", body: "Weekly, biweekly, monthly and deep cleans with what's included." },
      { title: "Checklists", body: "Room-by-room lists set expectations and justify pricing." },
      { title: "Trust", body: "Insurance, background checks and guarantees as placeholders for accurate details." },
      { title: "Quote form", body: "Bedrooms, bathrooms, frequency and address." },
    ],
    prompt:
      "A website for Sparkle & Co. Cleaning, a residential cleaning service in Charlotte, NC offering recurring and deep cleans and move-out cleaning. Bright, friendly style with fresh blue and white. Pages: home, services, what's included checklist, service areas, and a quote request form.",
    seoTips: [
      "Target \"house cleaning in [city]\" and \"move-out cleaning [city]\".",
      "List neighborhoods you serve.",
      "Encourage Google reviews and link to them.",
    ],
    faqs: [
      { q: "Can customers get an instant quote?", a: "They can request one with home details; you reply with pricing. Fixed-price calculators can be added with a follow-up prompt." },
      { q: "Can I edit my checklists?", a: "Click any text to edit it for free." },
      { q: "Can I add online payment?", a: "Link a Stripe Payment Link or your booking software." },
    ],
    schemaType: "HouseCleaningService",
  },
  {
    slug: "bakeries",
    name: "Bakeries",
    singular: "bakery",
    headline: "A bakery website that sells out the case",
    intro:
      "People search for bakeries with their stomachs. Curblit builds a mouth-watering bakery site with daily favorites, custom cake orders, hours and a pre-order form — so the inbox fills while you're at the oven.",
    pages: ["Home", "Menu", "Custom cakes", "About", "Visit & order"],
    mustHaves: [
      { title: "Custom order form", body: "Date, servings, flavors and design notes for celebration cakes." },
      { title: "Daily menu", body: "Breads, pastries and specials, easy to update for free." },
      { title: "Hours & pickup info", body: "Clear pickup windows and order lead times." },
      { title: "Allergen notes", body: "Placeholders for accurate allergen information." },
    ],
    prompt:
      "A website for Butter & Rye, an artisan bakery in Madison, WI known for sourdough, croissants and custom celebration cakes. Warm, handmade style with cream and rust. Pages: home, menu, custom cakes with an order request form, about, and visit/contact with hours.",
    seoTips: [
      "Name your specialties (\"sourdough bread\", \"custom birthday cakes\") with your city.",
      "Add an FAQ about lead times and allergens.",
      "Keep hours current — it's free to edit.",
    ],
    faqs: [
      { q: "Can customers order cakes online?", a: "Yes — a custom order request form collects all the details and emails you on paid plans." },
      { q: "Can I take payments?", a: "Link Square or Stripe for deposits; the AI adds pay buttons." },
      { q: "Will my food photos look good?", a: "Upload your photos and they're optimized automatically. AI-generated photos are available for decorative images." },
    ],
    schemaType: "Bakery",
  },
];

export function getIndustry(slug: string) {
  return industries.find((i) => i.slug === slug);
}

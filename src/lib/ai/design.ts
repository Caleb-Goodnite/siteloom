/**
 * Design vocabulary for generated sites. The planner picks a direction and fonts from
 * these curated lists, so every site gets a deliberate look and every font URL is valid
 * (each Google Fonts parameter below was checked against fonts.googleapis.com).
 */

export type FontRole = "display" | "body" | "mono" | "accent";

export const FONTS: Record<string, { param: string; fallback: string; roles: FontRole[] }> = {
  Fraunces: { param: "Fraunces:ital,opsz,wght@0,9..144,300..900;1,9..144,300..900", fallback: "serif", roles: ["display"] },
  "Playfair Display": { param: "Playfair+Display:ital,wght@0,400..900;1,400..900", fallback: "serif", roles: ["display"] },
  "DM Serif Display": { param: "DM+Serif+Display:ital@0;1", fallback: "serif", roles: ["display"] },
  "Instrument Serif": { param: "Instrument+Serif:ital@0;1", fallback: "serif", roles: ["display"] },
  "Cormorant Garamond": { param: "Cormorant+Garamond:ital,wght@0,300..700;1,300..700", fallback: "serif", roles: ["display"] },
  Newsreader: { param: "Newsreader:ital,opsz,wght@0,6..72,200..800;1,6..72,200..800", fallback: "serif", roles: ["display", "body"] },
  "Young Serif": { param: "Young+Serif", fallback: "serif", roles: ["display"] },
  "Libre Caslon Text": { param: "Libre+Caslon+Text:ital,wght@0,400;0,700;1,400", fallback: "serif", roles: ["display", "body"] },
  "Bodoni Moda": { param: "Bodoni+Moda:ital,opsz,wght@0,6..96,400..900;1,6..96,400..900", fallback: "serif", roles: ["display"] },
  Gloock: { param: "Gloock", fallback: "serif", roles: ["display"] },
  "IBM Plex Serif": { param: "IBM+Plex+Serif:ital,wght@0,400;0,500;0,600;1,400", fallback: "serif", roles: ["display", "body"] },
  Inter: { param: "Inter:wght@100..900", fallback: "sans-serif", roles: ["body"] },
  "Inter Tight": { param: "Inter+Tight:wght@100..900", fallback: "sans-serif", roles: ["display", "body"] },
  Manrope: { param: "Manrope:wght@200..800", fallback: "sans-serif", roles: ["display", "body"] },
  "Plus Jakarta Sans": { param: "Plus+Jakarta+Sans:ital,wght@0,200..800;1,200..800", fallback: "sans-serif", roles: ["display", "body"] },
  "DM Sans": { param: "DM+Sans:ital,opsz,wght@0,9..40,100..1000;1,9..40,100..1000", fallback: "sans-serif", roles: ["body"] },
  Outfit: { param: "Outfit:wght@100..900", fallback: "sans-serif", roles: ["display", "body"] },
  Sora: { param: "Sora:wght@100..800", fallback: "sans-serif", roles: ["display", "body"] },
  "Space Grotesk": { param: "Space+Grotesk:wght@300..700", fallback: "sans-serif", roles: ["display"] },
  Archivo: { param: "Archivo:wdth,wght@62..125,100..900", fallback: "sans-serif", roles: ["display", "body"] },
  "Bricolage Grotesque": { param: "Bricolage+Grotesque:opsz,wdth,wght@12..96,75..100,200..800", fallback: "sans-serif", roles: ["display"] },
  Syne: { param: "Syne:wght@400..800", fallback: "sans-serif", roles: ["display"] },
  "Work Sans": { param: "Work+Sans:wght@100..900", fallback: "sans-serif", roles: ["body"] },
  Figtree: { param: "Figtree:wght@300..900", fallback: "sans-serif", roles: ["body"] },
  Geist: { param: "Geist:wght@100..900", fallback: "sans-serif", roles: ["display", "body"] },
  Unbounded: { param: "Unbounded:wght@200..900", fallback: "sans-serif", roles: ["display"] },
  Lexend: { param: "Lexend:wght@100..900", fallback: "sans-serif", roles: ["body"] },
  Nunito: { param: "Nunito:wght@200..1000", fallback: "sans-serif", roles: ["display", "body"] },
  Karla: { param: "Karla:wght@200..800", fallback: "sans-serif", roles: ["body"] },
  "IBM Plex Sans": { param: "IBM+Plex+Sans:ital,wght@0,300;0,400;0,500;0,600;0,700;1,400", fallback: "sans-serif", roles: ["display", "body"] },
  Onest: { param: "Onest:wght@100..900", fallback: "sans-serif", roles: ["body"] },
  "Hanken Grotesk": { param: "Hanken+Grotesk:wght@100..900", fallback: "sans-serif", roles: ["display", "body"] },
  Epilogue: { param: "Epilogue:wght@100..900", fallback: "sans-serif", roles: ["display", "body"] },
  "Libre Franklin": { param: "Libre+Franklin:wght@100..900", fallback: "sans-serif", roles: ["body"] },
  "Familjen Grotesk": { param: "Familjen+Grotesk:wght@400..700", fallback: "sans-serif", roles: ["display"] },
  "JetBrains Mono": { param: "JetBrains+Mono:wght@100..800", fallback: "monospace", roles: ["mono"] },
  Caveat: { param: "Caveat:wght@400..700", fallback: "cursive", roles: ["accent"] },
};

export type Direction = {
  id: string;
  name: string;
  fits: string;
  fonts: { display: string; body: string };
  palette: string;
  layout: string;
};

export const DIRECTIONS: Direction[] = [
  {
    id: "editorial-warm",
    name: "Warm editorial",
    fits: "restaurants, bakeries, cafés, wineries, wedding & lifestyle brands",
    fonts: { display: "Fraunces", body: "Inter Tight" },
    palette: "cream/paper surface, near-black ink, one earthy accent (terracotta, olive or burgundy)",
    layout: "magazine-like asymmetric splits, large serif headlines with italic emphasis, generous whitespace, full-bleed photography bands, thin rules",
  },
  {
    id: "clinical-calm",
    name: "Calm & clinical",
    fits: "dentists, clinics, therapists, physio, pharmacies, senior care",
    fonts: { display: "Plus Jakarta Sans", body: "Plus Jakarta Sans" },
    palette: "white and very light tinted surfaces, one soft trustworthy hue (teal, sky or sage) with a deep ink version for text",
    layout: "rounded cards (rounded-2xl/3xl), reassuring icon rows, clear service grids, prominent booking CTA, lots of breathing room",
  },
  {
    id: "bold-trades",
    name: "Bold & dependable",
    fits: "plumbers, electricians, roofers, contractors, auto repair, cleaning, moving",
    fonts: { display: "Archivo", body: "Inter" },
    palette: "deep navy or charcoal with a high-visibility accent (safety orange, yellow or red), white surfaces",
    layout: "strong blocky sections, wide-condensed uppercase headlines, sticky call bar on mobile, trust strip (licensed / insured / response time placeholders), service-area chips",
  },
  {
    id: "luxe-minimal",
    name: "Refined luxury",
    fits: "spas, salons, boutique hotels, jewelry, high-end real estate, interior design",
    fonts: { display: "Cormorant Garamond", body: "Manrope" },
    palette: "ivory, black and a muted metallic (champagne, bronze), very restrained",
    layout: "airy, centered hero with small caps eyebrow, thin borders, large imagery, slow elegant hover transitions, few but considered sections",
  },
  {
    id: "modern-saas",
    name: "Modern product",
    fits: "SaaS, startups, apps, developer tools, AI products",
    fonts: { display: "Geist", body: "Geist" },
    palette: "near-white or near-black base, neutral grays, one vivid accent (electric blue, violet-free alternatives like lime, coral or cyan)",
    layout: "crisp hero with product mock (CSS-drawn UI card), logo-less social proof placeholder, bento feature grid, pricing table, FAQ accordion, monospace details",
  },
  {
    id: "playful-bright",
    name: "Playful & bright",
    fits: "kids, toys, events, creative studios, food trucks, pet businesses",
    fonts: { display: "Bricolage Grotesque", body: "DM Sans" },
    palette: "two or three saturated friendly colors on a light base, high contrast",
    layout: "rounded blobs and pill buttons, slightly rotated sticker-like badges, chunky cards with colored backgrounds, bouncy hover states",
  },
  {
    id: "organic-natural",
    name: "Organic & grounded",
    fits: "landscaping, yoga, wellness, farms, outdoor, nonprofits, florists",
    fonts: { display: "Young Serif", body: "Karla" },
    palette: "sage, forest or moss greens with sand/oat neutrals and a warm clay accent",
    layout: "soft organic shapes, layered photography, textured section backgrounds via subtle gradients, earthy calm rhythm",
  },
  {
    id: "corporate-trust",
    name: "Structured & trustworthy",
    fits: "accounting, law firms, consulting, finance, insurance, B2B services",
    fonts: { display: "IBM Plex Serif", body: "IBM Plex Sans" },
    palette: "navy or slate with white, a measured accent (gold, teal or burgundy)",
    layout: "grid-aligned, clear hierarchy, credentials row (placeholders), practice-area cards, process timeline, conservative motion",
  },
  {
    id: "dark-tech",
    name: "Dark & technical",
    fits: "agencies, studios, gaming, crypto-free web3 alternatives, cybersecurity, hardware",
    fonts: { display: "Space Grotesk", body: "Inter" },
    palette: "near-black base, layered dark grays, one neon-ish accent (lime, cyan or amber)",
    layout: "grid-line backgrounds, glowing accent borders, big numbers, terminal-style details in monospace, high-contrast CTAs",
  },
  {
    id: "portfolio-gallery",
    name: "Gallery portfolio",
    fits: "photographers, artists, architects, designers, makers",
    fonts: { display: "Instrument Serif", body: "Inter Tight" },
    palette: "mostly white or off-black, imagery provides the color",
    layout: "image-led masonry/columns, minimal chrome, oversized name, project cards with captions, quiet typography",
  },
  {
    id: "heritage-craft",
    name: "Heritage craft",
    fits: "barbers, breweries, butchers, tailors, woodworkers, family businesses",
    fonts: { display: "DM Serif Display", body: "Work Sans" },
    palette: "deep green, oxblood or navy with cream and brass",
    layout: "badge/emblem motifs, framed sections with double rules, 'est. [[Year]]' style details, menu/price-list layouts",
  },
  {
    id: "energetic-sport",
    name: "High energy",
    fits: "gyms, coaches, sports clubs, martial arts, dance studios",
    fonts: { display: "Unbounded", body: "Outfit" },
    palette: "black or deep charcoal with an electric accent (lime, red or orange) and white",
    layout: "huge uppercase headlines, diagonal or angled section breaks, schedule tables, program cards, bold stat strips",
  },
];

export function directionById(id: string | undefined) {
  return DIRECTIONS.find((d) => d.id === id);
}

export function fontNames(role?: FontRole) {
  return Object.entries(FONTS)
    .filter(([, f]) => !role || f.roles.includes(role))
    .map(([name]) => name);
}

/** Google Fonts stylesheet URL for the given families (unknown names are dropped). */
export function googleFontsHref(families: string[]) {
  const params = [...new Set(families)]
    .map((f) => FONTS[f]?.param)
    .filter(Boolean)
    .map((p) => `family=${p}`);
  return params.length ? `https://fonts.googleapis.com/css2?${params.join("&")}&display=swap` : null;
}

export function directionsForPrompt() {
  return DIRECTIONS.map(
    (d) => `- ${d.id} ("${d.name}"): for ${d.fits}. Fonts ${d.fonts.display} + ${d.fonts.body}. Palette: ${d.palette}. Layout: ${d.layout}.`,
  ).join("\n");
}

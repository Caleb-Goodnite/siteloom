import { describe, expect, it } from "vitest";
import { expandBlocks, listBlocks, setBlockValue } from "@/lib/site/blocks";
import { buildPublishedSite } from "@/lib/site/publish";
import { applyTheme, readTheme } from "@/lib/site/theme";
import { site } from "./fixtures";

const page = `<main>
<div data-sl-block="map" data-address="900 E 11th St, Austin, TX" class="h-80"></div>
<div data-sl-block="booking" data-url="https://calendly.com/acme/consult" class="min-h-[700px]">Loading…</div>
<div data-sl-block="video" data-url="https://youtu.be/dQw4w9WgXcQ"></div>
<a data-sl-block="pay" href="https://buy.stripe.com/test_123" class="btn">Pay deposit</a>
<a data-sl-block="pay" href="[[Payment link]]">Pay</a>
<div data-sl-block="booking" data-url="javascript:alert(1)"></div>
</main>`;

describe("integration blocks", () => {
  it("expands into safe embeds", () => {
    const html = expandBlocks(page);
    expect(html).toContain('<div data-sl-block="map" data-address="900 E 11th St, Austin, TX" class="h-80"><iframe title="Map: 900 E 11th St, Austin, TX" src="https://www.google.com/maps?q=900%20E%2011th%20St%2C%20Austin%2C%20TX&output=embed"');
    expect(html).toContain('src="https://calendly.com/acme/consult?hide_gdpr_banner=1"');
    expect(html).not.toContain("Loading…"); // fallback content replaced
    expect(html).toContain("https://www.youtube-nocookie.com/embed/dQw4w9WgXcQ");
    expect(html).toContain('href="https://buy.stripe.com/test_123" class="btn" target="_blank" rel="noopener">');
    expect(html).toContain('title="Add your payment link in Integrations"');
    expect(html).not.toMatch(/(src|href)="javascript:/); // non-https booking links never become a link or frame
    expect(html).toContain("Booking: add your Calendly");
  });

  it("lists blocks and edits their links in place", () => {
    const files = { "contact.html": page };
    const blocks = listBlocks(files);
    expect(blocks.map((b) => [b.kind, b.value])).toEqual([
      ["map", "900 E 11th St, Austin, TX"],
      ["booking", "https://calendly.com/acme/consult"],
      ["video", "https://youtu.be/dQw4w9WgXcQ"],
      ["pay", "https://buy.stripe.com/test_123"],
      ["pay", "[[Payment link]]"],
      ["booking", "javascript:alert(1)"],
    ]);
    const next = setBlockValue(files, { file: "contact.html", index: 4 }, "https://square.link/u/abc");
    expect(next).toContain('<a data-sl-block="pay" href="https://square.link/u/abc">Pay</a>');
    expect(next!.replace("https://square.link/u/abc", "[[Payment link]]")).toBe(page);
  });

  it("are expanded on publish too", async () => {
    const files = { ...site, "contact.html": site["contact.html"].replace("<h1>Contact us</h1>", `<h1>Contact us</h1><div data-sl-block="map" data-address="Columbus, OH"></div>`) };
    const { files: out } = await buildPublishedSite({ files, siteUrl: "https://x.test", siteName: "X", settings: { gaId: "G-ABC1234", metaPixelId: "not-a-pixel" }, badge: false });
    expect(out["contact.html"]).toContain("https://www.google.com/maps?q=Columbus%2C%20OH&output=embed");
    expect(out["index.html"]).toContain("googletagmanager.com/gtag/js?id=G-ABC1234");
    expect(out["index.html"]).not.toContain("fbevents.js"); // invalid pixel id ignored
  });
});

describe("theme editor", () => {
  it("reads and updates brand colors and fonts", () => {
    const files = {
      "partials/head.html": `<link href="https://fonts.googleapis.com/css2?family=Old&display=swap" rel="stylesheet">
<style type="text/tailwindcss">
  @theme {
    --color-brand: #0f766e;
    --color-ink: #111;
    --font-display: "Fraunces", serif;
    --font-sans: "Inter Tight", sans-serif;
  }
</style>`,
    };
    const t = readTheme(files)!;
    expect(t.colors).toEqual([
      { name: "brand", value: "#0f766e" },
      { name: "ink", value: "#111" },
    ]);
    expect(t.fonts).toEqual({ display: "Fraunces", body: "Inter Tight" });

    const next = applyTheme(files, { colors: { brand: "#B4532A", ink: "nope" }, display: "Young Serif" })!;
    expect(next.content).toContain("--color-brand: #b4532a;");
    expect(next.content).toContain("--color-ink: #111;");
    expect(next.content).toContain('--font-display: "Young Serif", serif;');
    expect(next.content).toContain("family=Young+Serif&family=Inter+Tight");
    expect(applyTheme(files, { display: "Comic Sans" })).toBeNull();
  });
});

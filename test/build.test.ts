import { describe, expect, it } from "vitest";
import { headPartial, normalizeBrief } from "@/lib/ai/brief";
import { findBuildErrors } from "@/lib/ai/build";
import { FONTS, googleFontsHref } from "@/lib/ai/design";
import { fillPlaceholders, listPlaceholders } from "@/lib/site/placeholders";
import { brandFromHtml, placeholderSrc } from "@/lib/site/render";
import { site } from "./fixtures";

describe("normalizeBrief", () => {
  it("repairs a messy brief into something every writer can rely on", () => {
    const b = normalizeBrief(
      {
        siteName: "Casa Lumbre",
        direction: "nonsense",
        colors: { brand: "#b4532a", ink: "not-a-color" },
        fonts: { display: "Comic Sans", body: "Karla" },
        recipes: { btnPrimary: "rounded-none bg-brand px-8 py-4 uppercase" },
        nav: [{ label: "Menu", href: "menu.html" }, { label: "Ghost", href: "ghost.html" }],
        pages: [
          { file: "Menu.HTML", navLabel: "Menu", sections: [{ name: "Dishes" }] },
          { file: "home.html", title: "Casa Lumbre | Austin" },
          { file: "../evil.html" },
          { file: "menu.html" },
        ],
      },
      "Fallback",
    )!;
    expect(b.pages.map((p) => p.file)).toEqual(["index.html", "menu.html"]);
    expect(b.direction).toBe("editorial-warm"); // unknown direction → default
    expect(b.colors.brand).toBe("#b4532a");
    expect(b.colors.ink).toMatch(/^#[0-9a-f]{6}$/i); // invalid color → default
    expect(b.fonts).toEqual({ display: "Fraunces", body: "Karla" }); // unknown font → direction's font
    expect(b.recipes.btnPrimary).toBe("rounded-none bg-brand px-8 py-4 uppercase");
    expect(b.recipes.card).toBeTruthy(); // defaults filled in
    expect(b.nav).toEqual([{ label: "Menu", href: "menu.html" }]); // links to missing pages dropped
  });

  it("rejects briefs without pages", () => {
    expect(normalizeBrief({ siteName: "X", pages: [] }, "X")).toBeNull();
    expect(normalizeBrief("not json", "X")).toBeNull();
  });

  it("writes a head partial with valid fonts and theme tokens", () => {
    const b = normalizeBrief({ pages: [{ file: "index.html" }], fonts: { display: "Fraunces", body: "Inter Tight" }, colors: { brand: "#0f766e" } }, "X")!;
    const head = headPartial(b);
    expect(head).toContain(`href="https://fonts.googleapis.com/css2?family=${FONTS.Fraunces.param}&family=${FONTS["Inter Tight"].param}&display=swap"`);
    expect(head).toContain("--color-brand: #0f766e;");
    expect(head).toContain('--font-display: "Fraunces", serif;');
    expect(head).toContain('type="text/tailwindcss"');
    expect(googleFontsHref(["Nope"])).toBeNull();
  });
});

describe("findBuildErrors", () => {
  it("passes a well-formed site", () => {
    expect(findBuildErrors(site)).toEqual([]);
  });

  it("flags concrete problems the fixer can repair", () => {
    const broken = {
      ...site,
      "services.html": site["services.html"].replace("<!-- @include partials/footer.html -->", "").replace("<h1>Services</h1>", "<h2>Services</h2>"),
      "contact.html": site["contact.html"].replace('data-sl-form="Appointment request" ', "").replace("<h1>", '<a href="pricing.html">x</a><img src="https://images.unsplash.com/a.jpg"><h1>'),
    };
    const errors = findBuildErrors(broken).join("\n");
    expect(errors).toContain("services.html: does not include partials/footer.html");
    expect(errors).toContain("services.html: has 0 <h1>");
    expect(errors).toContain('contact.html: link to missing page "pricing.html"');
    expect(errors).toContain("contact.html: <img> without alt");
    expect(errors).toContain("external stock image");
    expect(errors).toContain("missing data-sl-form");
  });
});

describe("placeholders", () => {
  const files = {
    "index.html": `<a href="tel:[[Phone number]]">[[Phone number]]</a><p>[[Opening hours]]</p><a href="mailto:[[Email]]">[[Email]]</a>`,
    "partials/footer.html": `<p>Call [[Phone number]] · [[Street address]]</p>`,
  };

  it("lists each distinct fact once, most important first", () => {
    expect(listPlaceholders(files).map((p) => [p.key, p.count])).toEqual([
      ["Phone number", 3],
      ["Email", 2],
      ["Street address", 1],
      ["Opening hours", 1],
    ]);
  });

  it("fills every occurrence and keeps tel/mailto links valid", () => {
    const changed = fillPlaceholders(files, { "Phone number": "(614) 555-0100", Email: "hi@bright.com", "Opening hours": "<b>Mon–Fri</b>" });
    expect(changed["index.html"]).toBe(
      `<a href="tel:6145550100">(614) 555-0100</a><p>&lt;b&gt;Mon–Fri&lt;/b&gt;</p><a href="mailto:hi@bright.com">hi@bright.com</a>`,
    );
    expect(changed["partials/footer.html"]).toBe(`<p>Call (614) 555-0100 · [[Street address]]</p>`);
  });
});

describe("image placeholders", () => {
  it("are tinted with the site's brand color", () => {
    expect(brandFromHtml(`<style>@theme { --color-brand: #0f766e; }</style>`)).toBe("#0f766e");
    const teal = decodeURIComponent(placeholderSrc("x", "16:9", "#0f766e"));
    expect(teal).toMatch(/hsl\((1[5-9]\d|16\d|17\d) /); // teal-ish hue, not a random one
  });
});

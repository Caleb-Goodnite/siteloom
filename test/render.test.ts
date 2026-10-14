import { describe, expect, it } from "vitest";
import {
  annotate,
  applyImageUrls,
  applyTextEdit,
  buildPreviewDocument,
  elementSource,
  enumerateElements,
  fillImagePlaceholders,
  hrefToPage,
  markCurrentNav,
  pageForPath,
  pendingImages,
  resolveIncludes,
  rewriteLinksForPublish,
  stripManagedScripts,
} from "@/lib/site/render";
import { site } from "./fixtures";

describe("includes and links", () => {
  it("resolves partials recursively and flags missing ones", () => {
    const out = resolveIncludes(`<!-- @include partials/a.html -->|<!-- @include nope.html -->`, {
      "partials/a.html": "A<!-- @include partials/b.html -->",
      "partials/b.html": "B",
    });
    expect(out).toBe("AB|<!-- missing include: nope.html -->");
  });

  it.each([
    ["about.html", { page: "about.html", hash: "" }],
    ["./about.html#team", { page: "about.html", hash: "team" }],
    ["/about", { page: "about.html", hash: "" }],
    ["/", { page: "index.html", hash: "" }],
    ["#top", null],
    ["https://x.com/a.html", null],
    ["mailto:a@b.co", null],
    ["logo.png", null],
  ])("hrefToPage(%s)", (href, expected) => expect(hrefToPage(href)).toEqual(expected));

  it("maps URL paths to pages", () => {
    expect(pageForPath("/", site)).toBe("index.html");
    expect(pageForPath("/services", site)).toBe("services.html");
    expect(pageForPath("/services.html", site)).toBe("services.html");
    expect(pageForPath("/missing", site)).toBeNull();
    expect(pageForPath("/partials/head", site)).toBeNull();
  });

  it("marks the current page's nav link only", () => {
    const html = markCurrentNav(`<a href="services.html">S</a><a href="index.html">H</a><a href="services.html#x">X</a>`, "services.html");
    expect(html).toBe(`<a href="services.html" aria-current="page">S</a><a href="index.html">H</a><a href="services.html#x">X</a>`);
  });

  it("rewrites links to clean URLs for publishing", () => {
    expect(rewriteLinksForPublish(`<a href="index.html">H</a><a href="contact.html#form">C</a><script src="assets/site.js"></script><a href="https://x.co">x</a>`)).toBe(
      `<a href="/">H</a><a href="/contact#form">C</a><script src="/assets/site.js"></script><a href="https://x.co">x</a>`,
    );
  });

  it("strips library scripts the platform manages", () => {
    const html = stripManagedScripts(
      `<script src="https://cdn.tailwindcss.com"></script><script src="https://unpkg.com/lucide@latest"></script><script>lucide.createIcons();</script><script src="assets/site.js"></script>`,
    );
    expect(html).toBe(`<script src="assets/site.js"></script>`);
  });
});

describe("images", () => {
  it("finds pending AI images and fills them in", () => {
    const pending = pendingImages(site);
    expect(pending).toEqual([{ prompt: "a bright modern dental office reception with plants", aspect: "16:9" }]);
    const updated = applyImageUrls(site, new Map([[pending[0].prompt, "https://cdn.example/x.webp"]]));
    expect(updated["index.html"]).toContain('<img src="https://cdn.example/x.webp" data-ai-image=');
    expect(pendingImages(updated)).toEqual([]);
  });

  it("gives placeholder images a data URI", () => {
    expect(fillImagePlaceholders(`<img data-ai-image="sunset" alt="">`)).toMatch(/^<img src="data:image\/svg\+xml/);
  });
});

describe("click-to-edit", () => {
  it("annotates elements and maps edits back to the exact source", () => {
    const source = site["index.html"];
    const annotated = annotate(source, "index.html");
    const h1 = annotated.match(/<h1 data-sl="index\.html#(\d+)"/);
    expect(h1).not.toBeNull();
    const id = `index.html#${h1![1]}`;
    expect(elementSource(site, id)).toBe(`<h1 class="font-display text-5xl px-[13px]">Gentle care for the whole family</h1>`);

    const edited = applyTextEdit(site, id, "Kind care for <em>every</em> smile");
    expect(edited!["index.html"]).toContain(`<h1 class="font-display text-5xl px-[13px]">Kind care for <em>every</em> smile</h1>`);
    // Nothing else changed.
    expect(edited!["index.html"].replace("Kind care for <em>every</em> smile", "Gentle care for the whole family")).toBe(source);
  });

  it("annotates partials with their own file ids and edits them in place", () => {
    const annotated = annotate(site["partials/footer.html"], "partials/footer.html");
    expect(annotated).toContain('<p data-sl="partials/footer.html#1">');
    const edited = applyTextEdit(site, "partials/footer.html#1", "Call us: (614) 555-0100");
    expect(edited!["partials/footer.html"]).toBe(`<footer class="bg-brand text-white p-8"><p>Call us: (614) 555-0100</p></footer>`);
  });

  it("refuses to edit void elements and strips scripts/handlers from edits", () => {
    const els = enumerateElements(site["index.html"]);
    const imgIndex = els.findIndex((e) => e.tag === "img");
    expect(applyTextEdit(site, `index.html#${imgIndex}`, "x")).toBeNull();
    const h1Index = els.findIndex((e) => e.tag === "h1");
    const edited = applyTextEdit(site, `index.html#${h1Index}`, `Hi<script>alert(1)</script><b onclick="x()">!</b>`);
    expect(edited!["index.html"]).toContain(`>Hi<b>!</b></h1>`);
  });
});

describe("preview document", () => {
  it("inlines assets, injects runtimes and the bridge", () => {
    const doc = buildPreviewDocument(site, "index.html", { annotate: true });
    expect(doc.startsWith("<!doctype html>")).toBe(true);
    expect(doc).toContain("@tailwindcss/browser@4");
    expect(doc).toContain("alpinejs@3"); // header uses x-data
    expect(doc).toContain("lucide@");
    expect(doc).toContain('data-sl-src="assets/site.js"');
    expect(doc).not.toContain("<!-- @include");
    expect(doc).toContain('aria-current="page"');
    expect(doc).toContain('data-sl="index.html#');
    expect(doc).toContain('data-sl="partials/header.html#');
    expect(doc).toContain("parent.postMessage");
  });

  it("shows a friendly message for a missing page", () => {
    expect(buildPreviewDocument(site, "nope.html")).toContain("Page not found");
  });
});

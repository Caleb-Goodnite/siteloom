import { describe, expect, it } from "vitest";
import { buildPublishedSite } from "@/lib/site/publish";
import { siteRuntimeJs } from "@/lib/site/runtime";
import { auditSite } from "@/lib/site/seo";
import { extractCandidates } from "@/lib/site/tailwind";
import { site } from "./fixtures";

describe("buildPublishedSite", () => {
  it("produces a fast, crawlable, SEO-complete static site", async () => {
    const { files, warnings, brand } = await buildPublishedSite({
      files: site,
      siteUrl: "https://bright.siteloom.site",
      siteName: "Bright Smile Dental",
      settings: { googleVerification: "abc123" },
      badge: true,
    });

    // Compiled CSS replaces the Tailwind runtime, including custom theme tokens and arbitrary values.
    const css = files["assets/site.css"];
    expect(css).toBeTruthy();
    expect(css).toContain("--color-brand:#0f766e");
    expect(css).toMatch(/\.bg-brand\{/);
    expect(css).toContain(".px-\\[13px\\]");
    expect(css).toMatch(/aria-\\\[current\\=page\\\]\\:text-brand/);
    expect(css).toContain("opacity:.9"); // class only referenced from JS
    expect(brand).toBe("#0f766e");

    const home = files["index.html"];
    expect(home).not.toContain("text/tailwindcss");
    expect(home).not.toContain("@tailwindcss/browser");
    expect(home).toMatch(/<link rel="stylesheet" href="\/assets\/site\.css\?v=[a-z0-9]+">/);
    // Icons are inline SVG, no icon script.
    expect(home).toContain('class="lucide lucide-menu size-5"');
    expect(home).not.toContain("data-lucide=\"menu\"></i>");
    expect(home).not.toContain("lucide.min.js");
    // Alpine only because the header uses x-data.
    expect(home).toContain("alpinejs@3");
    // Clean URLs + current page marking.
    expect(home).toContain('href="/contact#form"');
    expect(home).toMatch(/<a href="\/" class="[^"]*" aria-current="page">Bright Smile<\/a>/);
    // SEO tags.
    expect(home).toContain('<link rel="canonical" href="https://bright.siteloom.site/">');
    expect(home).toContain('<meta property="og:title" content="Family Dentist in Columbus, OH | Bright Smile Dental">');
    expect(home).toContain('<meta property="og:image" content="https://bright.siteloom.site/__sl/og.png?t=');
    expect(home).toContain('<meta name="twitter:card" content="summary_large_image">');
    expect(home).toContain('<meta name="google-site-verification" content="abc123">');
    expect(home).toContain('<script defer src="/__sl/sl.js" data-badge="1"></script>');
    expect(home).not.toContain("<!-- @include");
    // Placeholder image got a data URI so the layout doesn't break.
    expect(home).toMatch(/<img src="data:image\/svg\+xml/);

    expect(files["services.html"]).toContain('<link rel="canonical" href="https://bright.siteloom.site/services">');
    expect(files["sitemap.xml"]).toContain("<loc>https://bright.siteloom.site/contact</loc>");
    expect(files["robots.txt"]).toContain("Sitemap: https://bright.siteloom.site/sitemap.xml");
    expect(files["llms.txt"]).toContain("# Bright Smile Dental");
    expect(files["favicon.svg"]).toContain('fill="#0f766e"');
    expect(files["assets/site.js"]).toBe(site["assets/site.js"]);
    expect(Object.keys(files).some((p) => p.startsWith("partials/"))).toBe(false);

    expect(warnings.join(" ")).toContain("placeholder");
    expect(warnings.join(" ")).toContain("image");
  });

  it("omits the badge for paid plans", async () => {
    const { files } = await buildPublishedSite({ files: site, siteUrl: "https://x.test", siteName: "X", settings: {}, badge: false });
    expect(files["index.html"]).toContain('<script defer src="/__sl/sl.js"></script>');
  });
});

describe("site runtime", () => {
  it("is valid JavaScript", () => {
    expect(() => new Function(siteRuntimeJs())).not.toThrow();
  });
});

describe("extractCandidates", () => {
  it("keeps arbitrary values and variant syntax intact", () => {
    const c = extractCandidates([`<div class="px-[13px] md:grid-cols-3 aria-[current=page]:underline" :class="{ 'hidden': open }">`]);
    expect(c).toEqual(expect.arrayContaining(["px-[13px]", "md:grid-cols-3", "aria-[current=page]:underline", "hidden"]));
  });
});

describe("auditSite", () => {
  it("scores a reasonable site and flags real issues", () => {
    const report = auditSite(site);
    expect(report.pages.map((p) => p.page)).toEqual(["index.html", "contact.html", "services.html"]);
    expect(report.placeholders).toBe(1);
    const messages = report.issues.map((i) => i.message).join("\n");
    expect(messages).toContain("words of content");
    expect(messages).not.toContain("Missing <title>");
    expect(messages).not.toContain("Broken link");
    expect(report.score).toBeGreaterThan(30);
    expect(report.score).toBeLessThan(100);
  });

  it("catches missing titles, h1s, alt text and broken links", () => {
    const report = auditSite({ "index.html": `<html><body><img src="a.png"><a href="nope.html">x</a></body></html>` });
    const messages = report.issues.map((i) => i.message).join("\n");
    expect(messages).toContain("Missing <title>");
    expect(messages).toContain("No <h1>");
    expect(messages).toContain("without alt text");
    expect(messages).toContain('Broken link to "nope.html"');
  });
});

describe("buildMessages", () => {
  it("sends strictly alternating turns with cached system prompt and files", async () => {
    const { buildMessages } = await import("@/lib/ai/prompts");
    const msgs = buildMessages({
      projectName: "X",
      files: { "index.html": "<h1>x</h1>" },
      history: [
        { role: "assistant", content: "orphan" },
        { role: "user", content: "a" },
        { role: "user", content: "b" },
        { role: "assistant", content: "done" },
        { role: "user", content: "unanswered" },
      ],
      prompt: "make it blue",
      imagesEnabled: true,
    });
    expect(msgs.map((m) => m.role)).toEqual(["system", "user", "assistant", "user", "assistant", "user"]);
    expect(msgs[3].content).toBe("a\n\nb");
    const sys = msgs[0].content as { cache_control?: unknown }[];
    expect(sys[0].cache_control).toEqual({ type: "ephemeral" });
  });
});

describe("export build", () => {
  it("omits the platform runtime", async () => {
    const { files } = await buildPublishedSite({ files: site, siteUrl: "https://x.test", siteName: "X", settings: {}, badge: true, runtime: false });
    expect(files["index.html"]).not.toContain("/__sl/sl.js");
  });
});

/**
 * Quality harness: runs a real generation against OpenRouter (no database) and writes
 * the source + published build to disk so the output can be inspected in a browser.
 *
 *   pnpm eval:generate --prompt "A website for …" --tier standard --out /tmp/site-eval
 *   pnpm eval:generate --import example.com --prompt "Redesign my website" --out /tmp/site-eval
 *
 * Costs real OpenRouter credits (roughly $0.10–0.30 per Standard build).
 */
import fs from "node:fs";
import path from "node:path";
import { config } from "dotenv";

config({ path: ".env.local" });
config();

function arg(name: string, fallback?: string) {
  const i = process.argv.indexOf(`--${name}`);
  return i !== -1 ? process.argv[i + 1] : fallback;
}

async function main() {
  const { TIERS } = await import("../src/config/models");
  const { generateSite } = await import("../src/lib/ai/build");
  const { buildPublishedSite } = await import("../src/lib/site/publish");
  const { auditSite } = await import("../src/lib/site/seo");
  const { importWebsite } = await import("../src/lib/site/import");

  const prompt = arg("prompt", "A website for Bright Smile Dental, a family dental practice in Columbus, OH.")!;
  const tier = (arg("tier", "standard") as keyof typeof TIERS) ?? "standard";
  const out = path.resolve(arg("out", "/tmp/siteloom-eval")!);
  const started = Date.now();
  let lastLog = 0;

  const importUrl = arg("import");
  const source = importUrl ? await importWebsite(importUrl) : null;
  if (source) console.log(`imported ${source.url}: ${source.pages} pages, ${source.dossier.length} chars`);

  const result = await generateSite({
    sourceContent: source?.dossier,
    prompt,
    tier: TIERS[tier],
    projectName: arg("name", "Eval site")!,
    userId: "eval",
    onEvent: (e) => {
      if (e.type === "status") console.log(`[${((Date.now() - started) / 1000).toFixed(0)}s] ${e.message}`);
      if (e.type === "text" && Date.now() - lastLog > 15000) {
        lastLog = Date.now();
        console.log(`[${((Date.now() - started) / 1000).toFixed(0)}s] streaming…`);
      }
    },
  });

  fs.rmSync(out, { recursive: true, force: true });
  for (const [p, c] of Object.entries(result.files)) {
    fs.mkdirSync(path.dirname(path.join(out, "source", p)), { recursive: true });
    fs.writeFileSync(path.join(out, "source", p), c);
  }
  const build = await buildPublishedSite({ files: result.files, siteUrl: "http://localhost:4400", siteName: "Eval", settings: {}, badge: false, runtime: false });
  for (const [p, c] of Object.entries(build.files)) {
    fs.mkdirSync(path.dirname(path.join(out, "site", p)), { recursive: true });
    fs.writeFileSync(path.join(out, "site", p), c);
  }
  fs.writeFileSync(path.join(out, "response.md"), result.transcript);

  const audit = auditSite(result.files);
  console.log("\n=== result");
  console.log(`time: ${((Date.now() - started) / 1000).toFixed(1)}s   cost: $${result.costUsd.toFixed(4)}   models: ${result.models.join(", ")}`);
  console.log(`files: ${Object.keys(result.files).join(", ")}`);
  console.log(`failures: ${result.failures.length ? JSON.stringify(result.failures) : "none"}`);
  console.log(`seo score: ${audit.score}  placeholders: ${audit.placeholders}`);
  for (const i of audit.issues.slice(0, 12)) console.log(`  ${i.severity.padEnd(7)} ${i.page.padEnd(16)} ${i.message}`);
  console.log(`\nwritten to ${out}/site (published build) and ${out}/source`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});

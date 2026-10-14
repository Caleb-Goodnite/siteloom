import "server-only";
import { parse } from "node-html-parser";
import { UTILITY_MODELS } from "@/config/models";
import { complete, parseJsonLoose } from "@/lib/ai/openrouter";
import { listPages } from "@/lib/ai/protocol";
import { resolveIncludes } from "@/lib/site/render";
import type { FileMap } from "@/lib/types";

export type ModerationResult = {
  verdict: "allow" | "block" | "review";
  categories: string[];
  reason: string;
};

const BRANDS =
  /\b(microsoft|office ?365|outlook|onedrive|sharepoint|paypal|apple ?id|icloud|netflix|amazon|wells fargo|chase bank|bank of america|citibank|coinbase|metamask|binance|trust wallet|ledger live|docusign|dropbox|adobe sign|irs|usps|dhl|fedex|ups|google workspace|gmail|facebook|instagram|whatsapp|steam|roblox)\b/i;
const CREDENTIAL_WORDS = /\b(sign ?in|log ?in|verify your (account|identity)|account (suspended|locked)|update (your )?payment|seed phrase|recovery phrase|private key|wallet connect|connect wallet|claim (your )?(airdrop|reward))\b/i;

/** Hard rules that never need a model: these inputs have no legitimate use on our sites. */
function heuristics(html: string): ModerationResult | null {
  if (/<input\b[^>]*type\s*=\s*["']?password/i.test(html)) {
    return { verdict: "block", categories: ["credential_harvesting"], reason: "Sites hosted here can't collect passwords." };
  }
  if (/autocomplete\s*=\s*["']cc-(number|csc|exp)/i.test(html) || /name\s*=\s*["'](card[_-]?number|cc[_-]?num|cvv|cvc)["']/i.test(html)) {
    return { verdict: "block", categories: ["payment_harvesting"], reason: "Sites hosted here can't collect card numbers. Use a payment link (e.g. Stripe) instead." };
  }
  if (/\b(seed|recovery|mnemonic) phrase\b/i.test(html) && /<(input|textarea)\b/i.test(html)) {
    return { verdict: "block", categories: ["crypto_scam"], reason: "Sites hosted here can't collect wallet recovery phrases." };
  }
  return null;
}

function siteDigest(files: FileMap) {
  const parts: string[] = [];
  for (const page of listPages(files)) {
    const root = parse(resolveIncludes(files[page], files), { blockTextElements: { script: true, style: true } });
    const title = root.querySelector("title")?.text ?? "";
    root.querySelectorAll("script,style,svg").forEach((n) => n.remove());
    const fields = root
      .querySelectorAll("input,textarea,select")
      .map((i) => `${i.getAttribute("type") ?? i.tagName.toLowerCase()}:${i.getAttribute("name") ?? ""}`)
      .join(", ");
    const links = root
      .querySelectorAll("a[href]")
      .map((a) => a.getAttribute("href"))
      .filter((h) => h && /^https?:/i.test(h))
      .slice(0, 15)
      .join(" ");
    const text = root.text.replace(/\s+/g, " ").trim().slice(0, 2500);
    parts.push(`## ${page}\nTitle: ${title}\nForm fields: ${fields || "none"}\nExternal links: ${links || "none"}\nText: ${text}`);
  }
  return parts.join("\n\n").slice(0, 12000);
}

const MODERATION_PROMPT = `You review websites before they are published on a website-hosting platform. Decide if the site may be published.
Block: phishing or impersonation of a real company, bank, government agency, or person (e.g. a fake Microsoft/PayPal/bank login, fake delivery notice); collecting credentials, payment card data, or crypto wallet secrets; scams (fake giveaways, crypto doubling, advance-fee, fake stores); malware or download lures; illegal goods or services; sexual content involving minors; sexually explicit content; content promoting violence or terrorism.
Allow: ordinary businesses, portfolios, events, nonprofits, blogs, landing pages — including ones that mention or integrate with well-known companies (e.g. "we fix Microsoft 365 email", "find us on Instagram").
Use "review" only when genuinely unsure.
Respond with JSON only: {"verdict":"allow"|"block"|"review","categories":["…"],"reason":"one short sentence shown to the site owner"}`;

export async function moderateSite(files: FileMap): Promise<ModerationResult> {
  const allHtml = Object.entries(files)
    .filter(([p]) => p.endsWith(".html"))
    .map(([, c]) => c)
    .join("\n");
  const hard = heuristics(allHtml);
  if (hard) return hard;

  // Every publish gets a model check (~$0.001 with Haiku); brand + login wording raises the stakes.
  const suspicious = BRANDS.test(allHtml) && CREDENTIAL_WORDS.test(allHtml);

  try {
    const { text } = await complete({
      models: UTILITY_MODELS,
      json: true,
      maxTokens: 300,
      temperature: 0,
      messages: [
        { role: "system", content: MODERATION_PROMPT },
        { role: "user", content: siteDigest(files) },
      ],
    });
    const parsed = parseJsonLoose<ModerationResult>(text);
    if (parsed && ["allow", "block", "review"].includes(parsed.verdict)) {
      return { verdict: parsed.verdict, categories: parsed.categories ?? [], reason: parsed.reason ?? "" };
    }
  } catch (err) {
    console.error("moderation call failed", err);
  }
  // Fail open for ordinary sites; hold suspicious ones for review.
  return suspicious
    ? { verdict: "review", categories: ["unverified"], reason: "This site needs a quick manual review before it goes live." }
    : { verdict: "allow", categories: [], reason: "" };
}

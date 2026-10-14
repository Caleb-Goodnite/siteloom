import { ImageResponse } from "next/og";
import { site } from "@/config/site";

export const OG_SIZE = { width: 1200, height: 630 };

/** Fetches a Google font subset as TTF for Satori. Falls back to the default font on failure. */
async function loadFont(family: string, text: string): Promise<ArrayBuffer | null> {
  try {
    const css = await fetch(`https://fonts.googleapis.com/css2?family=${encodeURIComponent(family)}&text=${encodeURIComponent(text)}`, {
      headers: { "User-Agent": "Mozilla/5.0 (Macintosh; U; Intel Mac OS X 10_6_8; de-at) AppleWebKit/533.21.1 (KHTML, like Gecko) Version/5.0.5 Safari/533.21.1" },
    }).then((r) => r.text());
    const url = css.match(/src: url\((.+?)\) format\('(opentype|truetype)'\)/)?.[1];
    if (!url) return null;
    return await fetch(url).then((r) => r.arrayBuffer());
  } catch {
    return null;
  }
}

/** Branded 1200×630 social card used across marketing pages. */
export async function ogCard({ title, eyebrow }: { title: string; eyebrow?: string }) {
  const font = await loadFont("Instrument Serif", `${title}${eyebrow ?? ""}${site.name}`);
  return new ImageResponse(
    (
      <div style={{ width: "100%", height: "100%", display: "flex", flexDirection: "column", justifyContent: "space-between", background: "#f6f3ee", padding: 72, fontFamily: "sans-serif" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
          <svg width="52" height="52" viewBox="0 0 32 32">
            <rect width="32" height="32" rx="9" fill="#1c1917" />
            <path d="M11 7v18M21 7v18" stroke="#f6f3ee" strokeWidth="3" strokeLinecap="round" />
            <path d="M6 16c3.5-4 6.5-4 10 0s6.5 4 10 0" stroke="#ff5a1f" strokeWidth="3" fill="none" strokeLinecap="round" />
          </svg>
          <span style={{ fontSize: 34, fontWeight: 700, color: "#1c1917" }}>{site.name}</span>
        </div>
        <div style={{ display: "flex", flexDirection: "column" }}>
          {eyebrow ? <span style={{ fontSize: 28, color: "#c2410c", marginBottom: 16 }}>{eyebrow}</span> : null}
          <span style={{ fontSize: title.length > 48 ? 76 : 92, lineHeight: 1.0, color: "#1c1917", fontFamily: font ? "Instrument Serif" : "serif", letterSpacing: -1 }}>
            {title}
          </span>
        </div>
        <div style={{ display: "flex", height: 10, width: 220, background: "#ff5a1f", borderRadius: 999 }} />
      </div>
    ),
    { ...OG_SIZE, fonts: font ? [{ name: "Instrument Serif", data: font, weight: 400, style: "normal" }] : undefined },
  );
}

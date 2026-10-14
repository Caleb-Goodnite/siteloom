import { ImageResponse } from "next/og";

/** Auto-generated 1200×630 social card for a published page. */
export function siteOgImage(opts: { title: string; siteName: string; host: string; brand: string | null }) {
  const bg = opts.brand ?? "#1c1917";
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          padding: "72px",
          background: bg,
          color: "#ffffff",
          fontFamily: "sans-serif",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 18, fontSize: 34, fontWeight: 700, opacity: 0.95 }}>
          <div
            style={{
              width: 56,
              height: 56,
              borderRadius: 14,
              background: "rgba(255,255,255,0.18)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: 30,
            }}
          >
            {opts.siteName.trim()[0]?.toUpperCase() ?? "S"}
          </div>
          {opts.siteName}
        </div>
        <div style={{ display: "flex", fontSize: opts.title.length > 60 ? 58 : 72, fontWeight: 800, lineHeight: 1.08, letterSpacing: -1.5 }}>
          {opts.title}
        </div>
        <div style={{ display: "flex", fontSize: 26, opacity: 0.75 }}>{opts.host}</div>
      </div>
    ),
    {
      width: 1200,
      height: 630,
      headers: { "Cache-Control": "public, max-age=86400, s-maxage=604800, stale-while-revalidate=604800" },
    },
  );
}

import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono, Instrument_Serif } from "next/font/google";
import { Toaster } from "sonner";
import { site } from "@/config/site";
import { Analytics } from "@/components/marketing/analytics";
import { ThemeProvider } from "@/components/ui/theme-provider";
import "./globals.css";

const geistSans = Geist({ variable: "--font-geist-sans", subsets: ["latin"] });
const geistMono = Geist_Mono({ variable: "--font-geist-mono", subsets: ["latin"] });
const instrumentSerif = Instrument_Serif({
  variable: "--font-instrument-serif",
  subsets: ["latin"],
  weight: "400",
  style: ["normal", "italic"],
});

export const metadata: Metadata = {
  metadataBase: new URL(site.url),
  title: {
    default: `${site.name}: AI Website Builder for Small Businesses That Rank`,
    template: `%s | ${site.name}`,
  },
  description: site.description,
  applicationName: site.name,
  keywords: [
    "AI website builder",
    "website generator",
    "small business website",
    "SEO website builder",
    "Lovable alternative",
    "AI landing page builder",
  ],
  openGraph: {
    type: "website",
    siteName: site.name,
    url: site.url,
    title: `${site.name}: AI Website Builder for Small Businesses That Rank`,
    description: site.description,
    images: [{ url: "/curblit-social.jpg", width: 1200, height: 1200, alt: "Curblit" }],
  },
  twitter: {
    card: "summary_large_image",
    images: ["/curblit-social.jpg"],
    ...(site.twitter ? { site: site.twitter, creator: site.twitter } : {}),
  },
  robots: { index: true, follow: true },
  alternates: { canonical: "/" },
};

export const viewport: Viewport = {
  themeColor: "#102e24",
  width: "device-width",
  initialScale: 1,
};

// Runs in <head> before first paint: applies the saved theme, and marks whether a Supabase auth
// cookie exists so static marketing pages show the right header without a flash (UI hint only).
const headInitScript = `(()=>{const d=document.documentElement;try{const s=localStorage.getItem("curblit-theme");const t=s==="light"||s==="dark"?s:matchMedia("(prefers-color-scheme: dark)").matches?"dark":"light";d.dataset.theme=t;document.querySelector('meta[name="theme-color"]')?.setAttribute("content",t==="dark"?"#11100f":"#102e24")}catch{d.dataset.theme="light"}d.dataset.auth=/(?:^|;\\s*)sb-[^=]+-auth-token(?:\\.0)?=/.test(document.cookie)?"in":"out"})()`;

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning className={`${geistSans.variable} ${geistMono.variable} ${instrumentSerif.variable} antialiased`}>
      <head>
        <script dangerouslySetInnerHTML={{ __html: headInitScript }} />
      </head>
      <body className="min-h-dvh">
        <ThemeProvider>
          {children}
          <Toaster position="bottom-center" toastOptions={{ className: "!rounded-xl !border-line !font-sans" }} />
        </ThemeProvider>
        <Analytics />
      </body>
    </html>
  );
}

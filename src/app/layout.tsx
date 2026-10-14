import type { Metadata, Viewport } from "next";
import Script from "next/script";
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
    default: `${site.name} — AI website builder for sites that rank`,
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
    title: `${site.name} — AI website builder for sites that rank`,
    description: site.description,
  },
  twitter: { card: "summary_large_image", site: site.twitter, creator: site.twitter },
  robots: { index: true, follow: true },
  alternates: { canonical: "/" },
};

export const viewport: Viewport = {
  themeColor: "#f6f3ee",
  width: "device-width",
  initialScale: 1,
};

const themeInitScript = `(()=>{try{const saved=localStorage.getItem("siteloom-theme");const dark=saved==="light"||saved==="dark"?saved==="dark":window.matchMedia("(prefers-color-scheme: dark)").matches;document.documentElement.dataset.theme=dark?"dark":"light";document.querySelector('meta[name="theme-color"]')?.setAttribute("content",dark?"#11100f":"#f6f3ee")}catch{document.documentElement.dataset.theme="light"}})()`;

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning className={`${geistSans.variable} ${geistMono.variable} ${instrumentSerif.variable} antialiased`}>
      <body className="min-h-dvh">
        <Script id="theme-init" strategy="beforeInteractive">
          {themeInitScript}
        </Script>
        <ThemeProvider>
          {children}
          <Toaster position="bottom-center" toastOptions={{ className: "!rounded-xl !border-line !font-sans" }} />
        </ThemeProvider>
        <Analytics />
      </body>
    </html>
  );
}

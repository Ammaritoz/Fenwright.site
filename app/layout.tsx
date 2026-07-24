import type { Metadata, Viewport } from "next";
import { Bricolage_Grotesque, Hanken_Grotesk } from "next/font/google";
import { site } from "@/config/site";
import "./globals.css";

// Display: characterful, confident grotesque. Carries the headlines with weight
// and a touch of human warmth, without the AI-default serif/geometric look.
const display = Bricolage_Grotesque({
  subsets: ["latin"],
  variable: "--font-display",
  display: "swap",
  weight: ["500", "600", "700", "800"],
});

// Body/UI: clean, friendly humanist grotesk. Highly legible at text sizes.
const sans = Hanken_Grotesk({
  subsets: ["latin"],
  variable: "--font-sans",
  display: "swap",
  weight: ["400", "500", "600", "700"],
});

export const metadata: Metadata = {
  metadataBase: new URL("https://fenwright.ie"),
  title: {
    default: `${site.brand.name} | ${site.brand.tagline}`,
    template: `%s | ${site.brand.name}`,
  },
  description: site.hero.subhead,
  openGraph: {
    title: `${site.brand.name} | ${site.brand.tagline}`,
    description: site.hero.subhead,
    url: "https://fenwright.ie",
    siteName: site.brand.name,
    locale: "en_IE",
    type: "website",
  },
  robots: { index: true, follow: true },
  icons: {
    icon: [{ url: "/favicon.svg", type: "image/svg+xml" }],
  },
};

export const viewport: Viewport = {
  themeColor: "#0E1526",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={`${display.variable} ${sans.variable}`} suppressHydrationWarning>
      <body className="bg-paper text-ink antialiased">
        {/* Confirm JS before paint so scroll-reveal only hides content when it can reveal it. */}
        <script dangerouslySetInnerHTML={{ __html: "document.documentElement.classList.add('js')" }} />
        <a
          href="#main"
          className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-50 focus:rounded-lg focus:bg-ink focus:px-4 focus:py-2 focus:text-paper"
        >
          Skip to content
        </a>
        {children}
      </body>
    </html>
  );
}

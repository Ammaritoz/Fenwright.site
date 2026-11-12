import type { Metadata, Viewport } from "next";
import { Newsreader, IBM_Plex_Sans } from "next/font/google";
import { site } from "@/config/site";
import { CookieConsent } from "@/components/CookieConsent";
import "./globals.css";

// Display: a text serif set at regular weight, large. The size carries the
// hierarchy, not the weight, the way institutional firms set their headlines.
const display = Newsreader({
  subsets: ["latin"],
  variable: "--font-display",
  display: "swap",
  style: ["normal", "italic"],
  axes: ["opsz"],
});

// Body/UI: a neutral engineering sans with a true light weight for large text.
const sans = IBM_Plex_Sans({
  subsets: ["latin"],
  variable: "--font-sans",
  display: "swap",
  weight: ["300", "400", "500", "600", "700"],
});

export const metadata: Metadata = {
  // www, not apex: fenwright.ie redirects to www.fenwright.ie (308), so www
  // is what actually serves content. Every URL below needs to agree on that
  // or Search Console flags it as an unresolved duplicate.
  metadataBase: new URL("https://www.fenwright.ie"),
  title: {
    default: `${site.brand.name} | ${site.brand.tagline}`,
    template: `%s | ${site.brand.name}`,
  },
  description: site.hero.subhead,
  alternates: { canonical: "/" },
  openGraph: {
    title: `${site.brand.name} | ${site.brand.tagline}`,
    description: site.hero.subhead,
    url: "https://www.fenwright.ie",
    siteName: site.brand.name,
    locale: "en_IE",
    type: "website",
    images: [{ url: "/og-image.png", width: 1200, height: 630, alt: site.brand.name }],
  },
  twitter: {
    card: "summary_large_image",
    title: `${site.brand.name} | ${site.brand.tagline}`,
    description: site.hero.subhead,
    images: ["/og-image.png"],
  },
  robots: { index: true, follow: true },
  icons: {
    // PNG/ICO first: Google Search's favicon fetcher doesn't reliably
    // support SVG (see scripts/make-favicon.py). SVG stays listed for
    // modern browser tabs, which handle it fine.
    icon: [
      { url: "/favicon.ico", sizes: "any" },
      { url: "/favicon-16.png", type: "image/png", sizes: "16x16" },
      { url: "/favicon-32.png", type: "image/png", sizes: "32x32" },
      { url: "/favicon-48.png", type: "image/png", sizes: "48x48" },
      { url: "/favicon-96.png", type: "image/png", sizes: "96x96" },
      { url: "/favicon.svg", type: "image/svg+xml" },
    ],
    apple: [{ url: "/favicon-180.png", sizes: "180x180" }],
  },
};

export const viewport: Viewport = {
  themeColor: "#07182A",
  width: "device-width",
  initialScale: 1,
};

// ProfessionalService is a LocalBusiness subtype -- the closest honest fit
// while site.legal.address is still blank. Once a public address exists,
// add `address: { "@type": "PostalAddress", ... }` here to become eligible
// for Google's local pack / Maps results, which a bare Organization isn't.
const organizationJsonLd = {
  "@context": "https://schema.org",
  "@type": "ProfessionalService",
  name: site.brand.name,
  url: "https://www.fenwright.ie",
  description: site.brand.tagline,
  email: site.legal.contactEmail,
  image: "https://www.fenwright.ie/og-image.png",
  areaServed: ["IE", "GB", "US"],
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={`${display.variable} ${sans.variable}`} suppressHydrationWarning>
      <body className="bg-paper text-ink antialiased">
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(organizationJsonLd) }}
        />
        {/* Confirm JS before paint so scroll-reveal only hides content when it can reveal it. */}
        <script dangerouslySetInnerHTML={{ __html: "document.documentElement.classList.add('js')" }} />
        <a
          href="#main"
          className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-50 focus:rounded-lg focus:bg-ink focus:px-4 focus:py-2 focus:text-paper"
        >
          Skip to content
        </a>
        {children}
        <CookieConsent />
      </body>
    </html>
  );
}

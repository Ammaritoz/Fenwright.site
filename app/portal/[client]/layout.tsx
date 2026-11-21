import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { GeistSans } from "geist/font/sans";
import { GeistMono } from "geist/font/mono";
import { getClient } from "@/content/clients";

/**
 * Never prerender. A statically generated portal page could be served from the
 * cache without the middleware gate having run for that visitor.
 */
export const dynamic = "force-dynamic";

/**
 * Layer two of three keeping client contracts out of search results. The others
 * are the /portal/ disallow in app/robots.ts and the portal's absence from
 * app/sitemap.ts.
 */
export const metadata: Metadata = {
  robots: { index: false, follow: false, nocache: true },
  /**
   * Deliberately neutral: the client's business name stays out of the browser
   * tab, window title and history, where a shared screen or a screenshot would
   * otherwise disclose who the documents belong to.
   */
  title: "Client documents",
};

/**
 * Shell only. The portal nav lives in the pages rather than here, because the
 * unlock page sits inside this segment and must not show a client's business
 * name or a link to documents the visitor has not unlocked yet.
 *
 * The notFound() below is not the access check -- that is middleware.ts. It
 * just keeps an unknown slug from reaching a page that would throw.
 */
export default function PortalLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: { client: string };
}) {
  if (!getClient(params.client)) notFound();

  // The portal's own type and dark workspace. Geist loads here, not in the
  // root layout, so the marketing site never pays for it.
  return (
    <div
      className={`${GeistSans.variable} ${GeistMono.variable} portal-night flex min-h-screen flex-col bg-night font-ui text-night-text antialiased print:bg-white print:text-black`}
    >
      {children}
    </div>
  );
}

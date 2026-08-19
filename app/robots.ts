import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  return {
    // /portal/ holds client agreements, invoices and reports. Layer one of
    // three keeping them out of search results, alongside the noindex metadata
    // in app/portal/[client]/layout.tsx and their absence from the sitemap.
    rules: { userAgent: "*", allow: "/", disallow: "/portal/" },
    sitemap: "https://www.fenwright.ie/sitemap.xml",
  };
}

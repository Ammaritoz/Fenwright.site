import type { MetadataRoute } from "next";

export default function sitemap(): MetadataRoute.Sitemap {
  const base = "https://www.fenwright.ie";
  return [
    { url: base, changeFrequency: "monthly", priority: 1 },
    {
      url: `${base}/guides/enisa-single-reporting-platform`,
      changeFrequency: "monthly",
      priority: 0.7,
    },
    { url: `${base}/security`, changeFrequency: "yearly", priority: 0.4 },
    { url: `${base}/privacy`, changeFrequency: "yearly", priority: 0.3 },
  ];
}

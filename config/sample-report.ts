/**
 * The made-up early-warning draft shown beside the free first look
 * (components/SampleReport.tsx). Illustrative only: the product, the CVE and
 * the times are invented, and the tag and disclaimer must keep saying so.
 *
 * Kept consistent with the "example week" in config/site.ts: the hole is
 * listed on Monday, confirmed in the client's firmware on Wednesday at 09:10
 * (that is when the 24-hour clock starts, not the listing date), and the draft
 * goes out at 14:00 the same day.
 *
 * No em dashes in visitor-facing copy.
 */
export const sampleReport = {
  title: "24-hour early warning",
  tag: "Example draft",
  fields: [
    { label: "Product", value: "SG-200 smart gateway, firmware 3.4.0 to 3.4.1" },
    { label: "Component", value: "lighttpd 1.4.59, the built-in web admin server" },
    { label: "Hole", value: "CVE-2026-XXXXX, heap overflow, remote code execution" },
    { label: "Exploited", value: "Yes. Listed in CISA KEV on Monday" },
    { label: "Exposure", value: "Admin page on by default, reachable from the local network" },
    { label: "Sold in", value: "Ireland, Germany, the Netherlands" },
    { label: "Due", value: "Thu 09:10. Confirmed affected Wed 09:10" },
  ],
  checksLabel: "Checks passed",
  checks: [
    "Component found in firmware",
    "Shipped version affected",
    "Vulnerable code reachable",
    "Exploited per CISA KEV",
    "Decision logged",
  ],
  footer: "Ready for you to approve and submit",
  sentAt: "Drafted Wed 14:00",
  disclaimer: "A made-up example. Not a real product, client or vulnerability.",
} as const;

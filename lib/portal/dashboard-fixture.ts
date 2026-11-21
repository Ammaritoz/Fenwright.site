import type { DashboardData } from "@/content/clients/types";

/**
 * A realistic dashboard payload for the fictional Lowmoor Controls example.
 *
 * Used by the tests, and in development only (PORTAL_DASHBOARD_FIXTURE=1, see
 * lib/portal/dashboard.ts) to see the dashboard before Neon is wired up. It
 * is never served in production. Timestamps are relative to `now` so the
 * deadlines and "ago" labels always read sensibly.
 */
export function dashboardFixture(now: Date = new Date()): DashboardData {
  const at = (hoursAgo: number) => new Date(now.getTime() - hoursAgo * 3_600_000).toISOString();
  return {
    generatedAt: at(0.07),
    monitoring: true,
    products: [
      { name: "LC-40 room controller", version: "2.6", components: 214, lastScanned: at(20), monitoredSince: at(24 * 30) },
      { name: "LC-40 room controller", version: "2.5", components: 209, lastScanned: at(20), monitoredSince: at(24 * 30) },
      { name: "LC-GW building gateway", version: "1.9", components: 188, lastScanned: at(44), monitoredSince: at(24 * 28) },
    ],
    totals: {
      components: 611,
      matches: 143,
      exploited: 3,
      affected: 2,
      notAffected: 136,
      underInvestigation: 2,
      unassessed: 3,
      awaitingReview: 1,
    },
    findings: [
      {
        cve: "CVE-2026-31337",
        product: "LC-GW building gateway 1.9",
        component: "busybox 1.31.1",
        cvss: 8.8,
        exploited: true,
        status: "affected",
        reviewed: true,
        reasoning:
          "The gateway ships the vulnerable httpd applet enabled on the local configuration interface, which is reachable from the building network. Upgrading busybox to 1.36.1 or disabling httpd removes the exposure.",
        decidedAt: at(5),
      },
      {
        cve: "CVE-2026-20871",
        product: "LC-40 room controller 2.6",
        component: "openssl 3.0.13",
        cvss: 7.5,
        exploited: true,
        status: "not_affected",
        reviewed: true,
        justification: "vulnerable_code_not_in_execute_path",
        reasoning: "The flaw is in the CMS decoder. The controller only uses TLS client functions and never parses CMS messages.",
        decidedAt: at(30),
      },
      {
        cve: "CVE-2026-18810",
        product: "LC-40 room controller 2.5",
        component: "linux 5.15.71",
        cvss: 7.8,
        exploited: false,
        status: "under_investigation",
        reviewed: false,
        reasoning: "Depends on whether the netfilter nf_tables module is built in. We have asked your engineer to confirm the kernel config.",
        decidedAt: at(9),
      },
      {
        cve: "CVE-2026-40112",
        product: "LC-GW building gateway 1.9",
        component: "zlib 1.2.11",
        cvss: 6.5,
        exploited: false,
        status: "unassessed",
        reviewed: false,
      },
    ],
    reports: [
      { cve: "CVE-2026-31337", stage: "early_warning", createdAt: at(4), dueAt: new Date(now.getTime() + 15 * 3_600_000).toISOString() },
    ],
    log: [
      { at: at(4), event: "report_drafted", by: "fenwright", detail: "Early warning draft sent for approval", product: "LC-GW building gateway 1.9", cve: "CVE-2026-31337" },
      { at: at(5), event: "approved", by: "ammar", detail: "Affected: httpd applet reachable on the local interface", product: "LC-GW building gateway 1.9", cve: "CVE-2026-31337" },
      { at: at(5.5), event: "possible_reportable", by: "fenwright-watch", detail: "Listed on CISA KEV", product: "LC-GW building gateway 1.9", cve: "CVE-2026-31337" },
      { at: at(9), event: "drafted", by: "fenwright-watch", detail: "Question sent about the kernel build", product: "LC-40 room controller 2.5", cve: "CVE-2026-18810" },
      { at: at(30), event: "approved", by: "billal", detail: "Not affected: CMS decoder not used", product: "LC-40 room controller 2.6", cve: "CVE-2026-20871" },
      { at: at(50), event: "dry_run", by: "fenwright", detail: "Practice run: draft early warning in 3 hr 40 min", product: "LC-40 room controller 2.6" },
    ],
    questions: [
      {
        cve: "CVE-2026-18810",
        product: "LC-40 room controller 2.5",
        component: "linux 5.15.71",
        question: "Is CONFIG_NF_TABLES enabled in the 2.5 kernel build? A yes or no settles this one.",
        askedAt: at(9),
      },
    ],
    // 30 days, oldest first, ending today with the 5 matches still open.
    daily: [0, 1, 0, 2, 0, 0, 1, 3, 0, 1, 0, 0, 2, 1, 0, 0, 1, 0, 4, 1, 0, 0, 1, 0, 2, 0, 1, 0, 1, 2].map((matched, i) => ({
      date: new Date(now.getTime() - (29 - i) * 86_400_000).toISOString().slice(0, 10),
      matched,
      open: [3, 4, 2, 3, 2, 1, 1, 3, 2, 2, 1, 0, 2, 2, 1, 0, 1, 1, 4, 3, 2, 1, 1, 1, 2, 1, 1, 1, 3, 5][i],
    })),
    monthly: {
      period: now.toISOString().slice(0, 7),
      current: {
        componentsMonitored: 611,
        vulnerabilitiesMatched: 18,
        assessedNotAffected: 14,
        assessedAffected: 1,
        reportableEvents: 1,
        medianHoursToAssessment: 6.5,
      },
      previous: {
        componentsMonitored: 598,
        vulnerabilitiesMatched: 22,
        assessedNotAffected: 21,
        assessedAffected: 0,
        reportableEvents: 0,
        medianHoursToAssessment: 9,
      },
    },
  };
}

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
      {
        cve: "CVE-2026-31337",
        stage: "early_warning",
        createdAt: at(4),
        dueAt: new Date(now.getTime() + 15 * 3_600_000).toISOString(),
        awareAt: at(9),
        fields: [
          { label: "Notification type", requirement: "required", value: "Vulnerability (actively exploited)" },
          { label: "Name of manufacturer or open-source software steward", requirement: "required", value: "Lowmoor Controls Ltd" },
          { label: "Title", requirement: "required", value: "Actively exploited CVE-2026-31337 in busybox affects LC-GW building gateway" },
          {
            label: "Summary",
            requirement: "required",
            value:
              "CVE-2026-31337 in busybox 1.31.1, a third-party component in the firmware of LC-GW building gateway 1.9, is actively exploited: listed in CISA's Known Exploited Vulnerabilities catalogue. Severity: CVSS 8.8 (high). The manufacturer has confirmed the product is affected. A command injection in the busybox httpd applet lets an attacker on the local network run commands on the device.",
          },
          { label: "Product name", requirement: "required", value: "LC-GW building gateway" },
          { label: "Product version", requirement: "required", value: "1.9" },
          { label: "Product type", requirement: "optional", value: "Default" },
          { label: "Product category", requirement: "optional", value: "(optional: leave blank)" },
          {
            label: "Member States where the product is available",
            requirement: "required",
            value: "[CLIENT TO CONFIRM: EU member states where this product is sold]",
          },
          { label: "CVE ID", requirement: "optional", value: "CVE-2026-31337" },
          { label: "EUVD ID", requirement: "optional", value: "(none)" },
        ],
        checks: [
          "Component found in the firmware: busybox 1.31.1 at /bin/busybox",
          "Vulnerability matched to that version: CVE-2026-31337",
          "Actively exploited: listed in CISA's Known Exploited Vulnerabilities catalogue",
          "Decision: affected, approved by ammar",
          "Evidence: the httpd applet is enabled on the local configuration interface",
        ],
      },
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
    daily: fixtureDaily(now),
    // Monitored for three months: two months back, last month and this one.
    history: [
      {
        period: monthOffset(now, -2),
        metrics: {
          componentsMonitored: 584,
          vulnerabilitiesMatched: 31,
          assessedNotAffected: 28,
          assessedAffected: 1,
          reportableEvents: 0,
          medianHoursToAssessment: 14,
        },
      },
      {
        period: monthOffset(now, -1),
        metrics: {
          componentsMonitored: 598,
          vulnerabilitiesMatched: 22,
          assessedNotAffected: 21,
          assessedAffected: 0,
          reportableEvents: 0,
          medianHoursToAssessment: 9,
        },
      },
      {
        period: now.toISOString().slice(0, 7),
        metrics: {
          componentsMonitored: 611,
          vulnerabilitiesMatched: 18,
          assessedNotAffected: 14,
          assessedAffected: 1,
          reportableEvents: 1,
          medianHoursToAssessment: 6.5,
        },
      },
    ],
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

/** "YYYY-MM" for the month `offset` months from `now` (UTC). */
function monthOffset(now: Date, offset: number): string {
  return new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() + offset, 1)).toISOString().slice(0, 7);
}

/**
 * Daily points from the 1st of two months back to today, as the pipeline sends
 * them for the month picker. The last 30 days are hand-written (ending with the
 * 5 matches still open); earlier days follow a fixed pattern so tests stay stable.
 */
function fixtureDaily(now: Date): { date: string; matched: number; open: number }[] {
  const recentMatched = [0, 1, 0, 2, 0, 0, 1, 3, 0, 1, 0, 0, 2, 1, 0, 0, 1, 0, 4, 1, 0, 0, 1, 0, 2, 0, 1, 0, 1, 2];
  const recentOpen = [3, 4, 2, 3, 2, 1, 1, 3, 2, 2, 1, 0, 2, 2, 1, 0, 1, 1, 4, 3, 2, 1, 1, 1, 2, 1, 1, 1, 3, 5];
  const today = Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate());
  const start = Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - 2, 1);
  const days = Math.max(30, Math.round((today - start) / 86_400_000) + 1);
  return Array.from({ length: days }, (_, i) => {
    const fromEnd = days - 1 - i;
    const date = new Date(today - fromEnd * 86_400_000).toISOString().slice(0, 10);
    if (fromEnd < 30) return { date, matched: recentMatched[29 - fromEnd], open: recentOpen[29 - fromEnd] };
    const matched = [0, 2, 1, 0, 3, 0, 1, 0, 0, 2, 1][i % 11];
    return { date, matched, open: [2, 4, 3, 2, 5, 3, 2, 1, 1, 3, 2][i % 11] };
  });
}

import { readdirSync, readFileSync, statSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { parseDashboard } from "@/lib/portal/dashboard-schema";
import { dashboardFixture } from "@/lib/portal/dashboard-fixture";
import { deriveActionItems, questionItemId, reportItemId } from "@/lib/portal/action-items";
import { formatAgo, formatDueIn, formatHours } from "@/lib/portal/format";
import { buildOpenChart, smoothPath } from "@/lib/portal/chart";
import { allClientSlugs, getClient } from "@/content/clients";
import type { Client } from "@/content/clients/types";

const NOW = new Date("2027-02-10T12:00:00Z");

describe("dashboard payload validation", () => {
  it("accepts what fenwright-watch produces", () => {
    const r = parseDashboard(dashboardFixture(NOW));
    expect(r.ok).toBe(true);
  });

  it("accepts the original gather() shape, before questions and monthly were added", () => {
    const { questions: _q, monthly: _m, ...older } = dashboardFixture(NOW);
    expect(parseDashboard(older).ok).toBe(true);
  });

  it("treats a missing row as no data, not an error", () => {
    expect(parseDashboard(undefined)).toEqual({ ok: false, reason: "no-data" });
  });

  it("rejects drift rather than rendering it", () => {
    const bad = dashboardFixture(NOW) as unknown as Record<string, unknown>;
    bad.totals = { components: "611" };
    expect(parseDashboard(bad)).toEqual({ ok: false, reason: "invalid" });
  });

  it("rejects a timestamp without a timezone, which would render in the wrong hour", () => {
    const bad = { ...dashboardFixture(NOW), generatedAt: "2027-02-10T12:00:00" };
    expect(parseDashboard(bad).ok).toBe(false);
  });

  it("accepts a payload without the daily series, which today's pipeline does not send yet", () => {
    const { daily: _d, ...older } = dashboardFixture(NOW);
    expect(parseDashboard(older).ok).toBe(true);
  });

  it("rejects a daily entry whose date is not YYYY-MM-DD", () => {
    const f = dashboardFixture(NOW);
    const bad = { ...f, daily: [{ date: "2027-02-10T00:00:00Z", matched: 1, open: 1 }] };
    expect(parseDashboard(bad).ok).toBe(false);
  });
});

describe("open matches chart", () => {
  it("never draws the line past the real values, even across a sudden jump", () => {
    // 0 open for days, then 405 at once: a plain spline would dip below 0 and spike above 405.
    const pts = [0, 0, 0, 405, 405, 405].map((v, i) => [i * 10, 200 - v * 0.4] as const);
    const ys = smoothPath(pts)
      .match(/-?\d+(\.\d+)?/g)!
      .map(Number)
      .filter((_, i) => i % 2 === 1);
    expect(Math.min(...ys)).toBeGreaterThanOrEqual(200 - 405 * 0.4);
    expect(Math.max(...ys)).toBeLessThanOrEqual(200);
  });

  it("needs at least two days to draw a line", () => {
    expect(buildOpenChart([])).toBeNull();
    expect(buildOpenChart([{ date: "2027-02-10", matched: 1, open: 1 }])).toBeNull();
  });

  it("scales to an even ceiling, ends the line on today's open count and draws a bar only for days with matches", () => {
    const daily = dashboardFixture(NOW).daily!;
    const c = buildOpenChart(daily, 720, 176)!;
    expect(c.ticks[0] % 2).toBe(0);
    expect(c.ticks[c.ticks.length - 1]).toBe(0);
    const lastY = Math.round(c.yFor(daily[daily.length - 1].open) * 10) / 10;
    expect(c.line.endsWith(`720,${lastY}`)).toBe(true);
    expect(c.bars).toHaveLength(daily.filter((d) => d.matched > 0).length);
    expect(c.bars.every((b) => b.x >= 0 && b.x + 4 <= 720)).toBe(true);
  });
});

function clientWith(overrides: Partial<Client>): Client {
  return {
    slug: "test-client-00000000",
    currency: "EUR",
    passcodeHash: "0".repeat(64),
    passcodeSalt: "0".repeat(16),
    business: { name: "Test", contact: { name: "T" } },
    docs: [],
    firmwareUpload: false,
    ...overrides,
  };
}

const agreementDoc = (acceptedOn?: string) => ({
  slug: "agreement",
  title: "Client Agreement",
  blurb: "",
  payload: {
    type: "agreement" as const,
    solicitorReviewed: false,
    scope: [],
    exclusions: [],
    totalFee: 0,
    schedule: [],
    noticeDays: 30,
    passThroughServices: [],
    acceptedOn,
  },
});

const invoiceDoc = (due: string, paid = false, payUrl?: string) => ({
  slug: `invoice-${due}`,
  title: "Invoice",
  blurb: "",
  payload: { type: "invoice" as const, number: `INV-${due}`, issued: "2027-01-01", due, lines: [], paid, payUrl },
});

describe("action items", () => {
  it("asks for the agreement until it is accepted", () => {
    expect(deriveActionItems(clientWith({ docs: [agreementDoc()] }), null, NOW).map((i) => i.kind)).toEqual(["agreement"]);
    expect(deriveActionItems(clientWith({ docs: [agreementDoc("2027-01-05")] }), null, NOW)).toEqual([]);
  });

  it("ignores upcoming and hidden documents", () => {
    const docs = [{ ...agreementDoc(), status: "upcoming" as const }, { ...invoiceDoc("2027-02-01"), status: "hidden" as const }];
    expect(deriveActionItems(clientWith({ docs }), null, NOW)).toEqual([]);
  });

  it("puts an overdue invoice first and links to Stripe when there is a pay URL", () => {
    const docs = [agreementDoc(), invoiceDoc("2027-02-01", false, "https://invoice.stripe.com/i/x")];
    const items = deriveActionItems(clientWith({ docs }), null, NOW);
    expect(items[0]).toMatchObject({ kind: "invoice", urgency: "overdue", external: true, href: "https://invoice.stripe.com/i/x" });
  });

  it("does not call an invoice overdue on its due date", () => {
    const items = deriveActionItems(clientWith({ docs: [invoiceDoc("2027-02-10")] }), null, NOW);
    expect(items[0].urgency).toBe("soon");
  });

  it("skips an invoice that Stripe shows as paid in full", () => {
    const docs = [invoiceDoc("2027-02-01")];
    expect(deriveActionItems(clientWith({ docs }), null, NOW, new Set(), new Set([docs[0].slug]))).toEqual([]);
    expect(deriveActionItems(clientWith({ docs }), null, NOW)).toHaveLength(1);
  });

  it("skips paid invoices", () => {
    expect(deriveActionItems(clientWith({ docs: [invoiceDoc("2027-02-01", true)] }), null, NOW)).toEqual([]);
  });

  it("asks to approve open report drafts, but not ones whose deadline has passed", () => {
    const data = dashboardFixture(NOW);
    data.reports.push({ cve: "CVE-OLD", stage: "final", createdAt: null, dueAt: "2027-01-01T00:00:00Z" });
    const reports = deriveActionItems(clientWith({}), data, NOW).filter((i) => i.kind === "report");
    expect(reports).toHaveLength(1);
    expect(reports[0].title).toContain("24-hour early warning");
    expect(reports[0].urgency).toBe("normal"); // 15 hours away
  });

  it("asks for firmware through the portal's own Upload page by default, with no external link", () => {
    const items = deriveActionItems(clientWith({ firmwareUpload: undefined }), null, NOW);
    expect(items).toHaveLength(1);
    expect(items[0]).toMatchObject({ kind: "upload", external: false, href: "/portal/test-client-00000000/upload" });
  });

  it("stops asking for firmware once an upload has arrived", () => {
    expect(deriveActionItems(clientWith({ firmwareUpload: undefined }), null, NOW, new Set(), new Set(), 1)).toEqual([]);
    expect(deriveActionItems(clientWith({ firmwareUpload: undefined }), null, NOW, new Set(), new Set(), 0)).toHaveLength(1);
  });

  it("stops asking for firmware when the client file says so", () => {
    expect(deriveActionItems(clientWith({ firmwareUpload: false }), null, NOW)).toEqual([]);
  });

  it("surfaces engineer questions and the upload link", () => {
    const kinds = deriveActionItems(clientWith({ uploadUrl: "https://www.fenwright.ie/upload/tok" }), dashboardFixture(NOW), NOW).map((i) => i.kind);
    expect(kinds).toContain("question");
    expect(kinds).toContain("upload");
  });
});

describe("completable items and stable ids", () => {
  it("lets the client clear report drafts and questions, and nothing else", () => {
    const docs = [agreementDoc(), invoiceDoc("2027-02-20")];
    const items = deriveActionItems(clientWith({ docs, uploadUrl: "https://www.fenwright.ie/upload/x" }), dashboardFixture(NOW), NOW);
    const byKind = Object.fromEntries(items.map((i) => [i.kind, i.completable]));
    expect(byKind).toMatchObject({ report: true, question: true, agreement: false, invoice: false, upload: false });
  });

  it("gives a question the same id wherever it sits in the list", () => {
    const data = dashboardFixture(NOW);
    const q = data.questions![0];
    const other = { ...q, cve: "CVE-2026-99999", question: "Another one?" };
    const a = deriveActionItems(clientWith({}), { ...data, questions: [q] }, NOW).find((i) => i.kind === "question")!;
    const b = deriveActionItems(clientWith({}), { ...data, questions: [other, q] }, NOW).filter((i) => i.kind === "question");
    expect(b.map((i) => i.id)).toContain(a.id);
    expect(a.id).toBe(questionItemId(q));
    expect(new Set(b.map((i) => i.id)).size).toBe(2);
  });

  it("derives report ids from the CVE and stage", () => {
    expect(reportItemId({ cve: "CVE-2026-31337", stage: "early_warning" })).toBe("report:CVE-2026-31337:early_warning");
  });
});

describe("dashboard formatting", () => {
  it("never shows a missing median as zero", () => {
    expect(formatHours(null)).toBe("–");
    expect(formatHours(6.5)).toBe("6.5 hr");
    expect(formatHours(9)).toBe("9 hr");
  });

  it("formats ages and deadlines relative to now", () => {
    expect(formatAgo("2027-02-10T11:56:00Z", NOW)).toBe("4 min ago");
    expect(formatAgo("2027-02-09T10:00:00Z", NOW)).toBe("yesterday");
    expect(formatDueIn("2027-02-11T03:00:00Z", NOW)).toBe("in 15 hr");
    expect(formatDueIn("2027-02-10T11:00:00Z", NOW)).toBe("overdue");
  });
});

describe("portal routes", () => {
  it("has no document slug that a static portal page would shadow", () => {
    const reserved = new Set(["documents", "findings", "unlock", "upload"]);
    for (const slug of allClientSlugs()) {
      for (const doc of getClient(slug)!.docs) expect(reserved.has(doc.slug)).toBe(false);
    }
  });
});

/**
 * The dashboard loader holds a database connection string and returns client
 * findings. A client component importing it, or the client registry, would
 * pull both into the public bundle.
 */
describe("server-only boundaries", () => {
  const roots = ["app", "components"].map((d) => path.resolve(__dirname, "..", d));
  function files(dir: string): string[] {
    return readdirSync(dir).flatMap((f) => {
      const p = path.join(dir, f);
      return statSync(p).isDirectory() ? files(p) : /\.(t|j)sx?$/.test(f) ? [p] : [];
    });
  }

  it("keeps the dashboard loader and client registry out of client components", () => {
    const offenders: string[] = [];
    for (const file of roots.flatMap(files)) {
      const src = readFileSync(file, "utf8");
      if (!/^\s*["']use client["']/.test(src)) continue;
      if (/@\/lib\/portal\/dashboard["']|@\/content\/clients["']/.test(src)) offenders.push(file);
    }
    expect(offenders).toEqual([]);
  });

  it("marks the loader server-only", () => {
    const src = readFileSync(path.resolve(__dirname, "../lib/portal/dashboard.ts"), "utf8");
    expect(src).toMatch(/^import "server-only";/);
  });
});

describe("month picker", () => {
  it("offers only the months the pipeline sends, newest first, and falls back to now", async () => {
    const { monthOptions, pickMonth } = await import("@/lib/portal/periods");
    const data = dashboardFixture(NOW);
    expect(monthOptions(data, NOW)).toEqual(["2027-02", "2027-01", "2026-12"]);
    expect(pickMonth(monthOptions(data, NOW), "2027-01")).toBe("2027-01");
    // Not on offer (before onboarding, or junk): back to the current month.
    expect(pickMonth(monthOptions(data, NOW), "2026-06")).toBe("2027-02");
    expect(pickMonth(monthOptions(data, NOW), "drop table")).toBe("2027-02");
    const { history: _h, ...noHistory } = data;
    expect(monthOptions(noHistory, NOW)).toEqual(["2027-02"]);
  });

  it("gives a past month its own days and compares it with the month before", async () => {
    const { monthView } = await import("@/lib/portal/periods");
    const data = dashboardFixture(NOW);
    const jan = monthView(data, "2027-01", NOW);
    expect(jan.isCurrent).toBe(false);
    expect(jan.points).toHaveLength(31);
    expect(jan.points.every((p) => p.date.startsWith("2027-01-"))).toBe(true);
    expect(jan.metrics?.vulnerabilitiesMatched).toBe(22);
    expect(jan.previous?.period).toBe("2026-12");
    const now = monthView(data, "2027-02", NOW);
    expect(now.isCurrent).toBe(true);
    expect(now.points).toHaveLength(30); // the rolling 30 days, not month-to-date
    expect(now.points.at(-1)?.open).toBe(5);
    // The oldest month has nothing before it to compare with.
    expect(monthView(data, "2026-12", NOW).previous).toBeNull();
  });
});

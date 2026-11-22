import type { DashboardData, ReportMetrics } from "@/content/clients/types";
import type { DailyPoint } from "@/lib/portal/chart";

/**
 * The dashboard's month picker: which months to offer, and which figures and
 * chart days belong to the one chosen. Pure, so the page and the tests agree.
 *
 * The pipeline only sends months the client was monitored in (at most 12), so
 * nothing here can offer a month from before onboarding.
 */

export type MonthView = {
  /** "YYYY-MM" */
  period: string;
  isCurrent: boolean;
  metrics: ReportMetrics | null;
  /** The month before, when the client was monitored in it. */
  previous: { period: string; metrics: ReportMetrics } | null;
  /** This month's days, or the last 30 days for the current month. */
  points: DailyPoint[];
};

const PERIOD = /^\d{4}-(0[1-9]|1[0-2])$/;

/** Months on offer, newest first. Always at least the current month. */
export function monthOptions(data: DashboardData, now: Date): string[] {
  const fromHistory = (data.history ?? []).map((h) => h.period);
  const current = data.monthly?.period ?? now.toISOString().slice(0, 7);
  return Array.from(new Set([...fromHistory, current])).sort().reverse();
}

/** The month a `?month=` value asks for, if it is on offer; otherwise the current month. */
export function pickMonth(options: string[], requested: string | undefined): string {
  return requested && PERIOD.test(requested) && options.includes(requested) ? requested : options[0];
}

export function monthView(data: DashboardData, period: string, now: Date): MonthView {
  const options = monthOptions(data, now);
  const isCurrent = period === options[0];
  const history = data.history ?? [];
  const i = history.findIndex((h) => h.period === period);
  const metrics = i >= 0 ? history[i].metrics : isCurrent ? data.monthly?.current ?? null : null;
  const before = i > 0 ? history[i - 1] : null;
  const previous =
    before ??
    (isCurrent && data.monthly?.previous ? { period: previousPeriod(period), metrics: data.monthly.previous } : null);
  const daily = data.daily ?? [];
  const points = isCurrent ? daily.slice(-30) : daily.filter((d) => d.date.startsWith(`${period}-`));
  return { period, isCurrent, metrics, previous, points };
}

export function previousPeriod(period: string): string {
  const [y, m] = period.split("-").map(Number);
  return m === 1 ? `${y - 1}-12` : `${y}-${String(m - 1).padStart(2, "0")}`;
}

/** "November 2026" / "Nov" */
export function monthLabel(period: string, style: "long" | "short" = "long"): string {
  const [y, m] = period.split("-").map(Number);
  return new Intl.DateTimeFormat("en-IE", {
    month: style,
    ...(style === "long" ? { year: "numeric" } : {}),
    timeZone: "UTC",
  }).format(new Date(Date.UTC(y, m - 1, 1)));
}

/**
 * Money and date formatting for portal documents.
 *
 * Two rules this module exists to enforce:
 *
 * 1. Money is integer minor units everywhere. Floats on an invoice produce
 *    visible, embarrassing rounding (1.005 rendering as 1.00), and totals that
 *    do not match the sum of their lines.
 * 2. Dates are formatted server-side with an explicit locale. A bare
 *    toLocaleDateString() renders with whatever locale the runtime happens to
 *    have, which both risks a hydration mismatch and turns 07/08 into two
 *    different days depending on who is reading it.
 */

import type { Currency, IsoDate, LineItem, Money } from "@/content/clients/types";

/** en-IE gives DD Month YYYY, which is how an Irish or UK client reads a date. */
const DATE_LOCALE = "en-IE";

export function formatMoney(minorUnits: Money, currency: Currency): string {
  return new Intl.NumberFormat(DATE_LOCALE, {
    style: "currency",
    currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(minorUnits / 100);
}

/**
 * A price that has not been set yet. Rendering "EUR 0.00" on a package menu
 * reads as "free" to a client; a bracketed blank reads as "we have not told you
 * yet", which is the truth.
 */
export function formatPriceOrPlaceholder(minorUnits: Money, currency: Currency): string {
  if (minorUnits === 0) return currency === "GBP" ? "[£0]" : "[€0]";
  return formatMoney(minorUnits, currency);
}

/**
 * "19 August 2026". Throws on a malformed date rather than printing
 * "Invalid Date".
 *
 * The shape is checked before parsing because Date is too forgiving to rely on:
 * "2026-08" parses happily as the 1st of August, so a truncated value in a
 * client file would render a confident, wrong date instead of failing.
 */
export function formatDate(iso: IsoDate): string {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(iso)) {
    throw new Error(`Invalid date in client data, expected YYYY-MM-DD: ${iso}`);
  }
  const d = new Date(`${iso}T00:00:00Z`);
  if (Number.isNaN(d.getTime())) {
    throw new Error(`Invalid date in client data: ${iso}`);
  }
  return new Intl.DateTimeFormat(DATE_LOCALE, {
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone: "UTC",
  }).format(d);
}

/** "August 2026" from a `YYYY-MM` reporting period. */
export function formatPeriod(period: string): string {
  if (!/^\d{4}-\d{2}$/.test(period)) {
    throw new Error(`Invalid report period in client data, expected YYYY-MM: ${period}`);
  }
  const d = new Date(`${period}-01T00:00:00Z`);
  if (Number.isNaN(d.getTime())) {
    throw new Error(`Invalid report period in client data: ${period}`);
  }
  return new Intl.DateTimeFormat(DATE_LOCALE, {
    month: "long",
    year: "numeric",
    timeZone: "UTC",
  }).format(d);
}

/** Minutes as something a human says out loud: "4 min", "1 hr 20 min". */
export function formatMinutes(minutes: number): string {
  if (minutes < 60) return `${minutes} min`;
  const hrs = Math.floor(minutes / 60);
  const mins = minutes % 60;
  return mins === 0 ? `${hrs} hr` : `${hrs} hr ${mins} min`;
}

export function lineTotal(line: LineItem): Money {
  return line.quantity * line.unitPrice;
}

export type InvoiceTotals = {
  subtotal: Money;
  /** Null when not VAT registered, which is the current reality. */
  vat: { rate: number; amount: Money } | null;
  total: Money;
  paid: Money;
  balanceDue: Money;
};

/**
 * Invoice arithmetic in one place.
 *
 * `vatRate` is null unless site.legal.vatNumber is set. A sole trader who is
 * not VAT registered must not show or charge VAT, so the caller passes null and
 * the VAT row does not render at all -- rather than rendering a zero-rated line
 * that implies registration.
 */
export function invoiceTotals(
  lines: LineItem[],
  opts: { vatRate: number | null; amountPaid?: Money }
): InvoiceTotals {
  const subtotal = lines.reduce((sum, line) => sum + lineTotal(line), 0);
  const vat =
    opts.vatRate === null
      ? null
      : { rate: opts.vatRate, amount: Math.round(subtotal * opts.vatRate) };
  const total = subtotal + (vat?.amount ?? 0);
  const paid = opts.amountPaid ?? 0;
  return { subtotal, vat, total, paid, balanceDue: total - paid };
}

/**
 * Percentage change between two numbers, or null when there is no honest
 * comparison to draw (no prior month, or a prior value of zero, where "up
 * infinity percent" is noise rather than information).
 */
export function percentChange(current: number, previous: number | undefined): number | null {
  if (previous === undefined || previous === 0) return null;
  return Math.round(((current - previous) / previous) * 100);
}

/** Whether a rise in a metric is good news. No-shows and reply time are not. */
export type MetricDirection = "up-good" | "down-good";

/**
 * Is this change good news? Null when flat or incomparable.
 *
 * Extracted from the report component so it can be tested: an inverted sign
 * here would colour every month green regardless of what happened, which
 * flatters a report a client is meant to be able to trust.
 */
export function isGoodChange(
  change: number | null,
  direction: MetricDirection
): boolean | null {
  if (change === null || change === 0) return null;
  return direction === "up-good" ? change > 0 : change < 0;
}

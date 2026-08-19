import { describe, expect, it } from "vitest";
import {
  formatDate,
  formatMinutes,
  formatMoney,
  formatPeriod,
  formatPriceOrPlaceholder,
  invoiceTotals,
  isGoodChange,
  lineTotal,
  percentChange,
} from "@/lib/portal/format";
import type { LineItem } from "@/content/clients/types";

const line = (unitPrice: number, quantity = 1): LineItem => ({
  kind: "Build",
  description: "Work",
  quantity,
  unitPrice,
});

describe("formatMoney", () => {
  it("renders euro and sterling from minor units", () => {
    expect(formatMoney(340000, "EUR")).toContain("3,400.00");
    expect(formatMoney(340000, "EUR")).toContain("€");
    expect(formatMoney(150050, "GBP")).toContain("1,500.50");
    expect(formatMoney(150050, "GBP")).toContain("£");
  });

  it("always shows two decimal places", () => {
    expect(formatMoney(100000, "EUR")).toContain("1,000.00");
    expect(formatMoney(1, "EUR")).toContain("0.01");
  });
});

describe("formatPriceOrPlaceholder", () => {
  it("brackets an unset price rather than reading as free", () => {
    // A package menu showing "€0.00" tells a client the tier costs nothing.
    expect(formatPriceOrPlaceholder(0, "EUR")).toBe("[€0]");
    expect(formatPriceOrPlaceholder(0, "GBP")).toBe("[£0]");
  });

  it("formats a real price normally", () => {
    expect(formatPriceOrPlaceholder(49900, "EUR")).toContain("499.00");
  });
});

describe("invoiceTotals", () => {
  it("omits VAT entirely when not registered", () => {
    // The current reality: site.legal.vatNumber is "". A non-registered sole
    // trader must not show VAT at all, not even a zero-rated line.
    const totals = invoiceTotals([line(60000), line(180000)], { vatRate: null });
    expect(totals.vat).toBeNull();
    expect(totals.subtotal).toBe(240000);
    expect(totals.total).toBe(240000);
  });

  it("adds VAT once a rate is supplied", () => {
    const totals = invoiceTotals([line(100000)], { vatRate: 0.23 });
    expect(totals.vat).toEqual({ rate: 0.23, amount: 23000 });
    expect(totals.total).toBe(123000);
  });

  it("rounds VAT to whole minor units", () => {
    // 1234 cents at 23% is 283.82 cents, which must not leak a fraction.
    const totals = invoiceTotals([line(1234)], { vatRate: 0.23 });
    expect(Number.isInteger(totals.vat!.amount)).toBe(true);
    expect(totals.vat!.amount).toBe(284);
  });

  it("subtracts a deposit to give the balance due", () => {
    const totals = invoiceTotals([line(340000)], { vatRate: null, amountPaid: 170000 });
    expect(totals.balanceDue).toBe(170000);
  });

  it("multiplies quantity into the line total", () => {
    expect(lineTotal(line(25000, 3))).toBe(75000);
    expect(invoiceTotals([line(25000, 3)], { vatRate: null }).subtotal).toBe(75000);
  });

  it("sums exactly, with no floating point drift", () => {
    const lines = Array.from({ length: 10 }, () => line(10));
    expect(invoiceTotals(lines, { vatRate: null }).total).toBe(100);
  });
});

describe("formatDate", () => {
  it("renders day, month, year rather than an ambiguous numeric order", () => {
    // 07/08 means two different days to an Irish and an American reader.
    const out = formatDate("2026-08-07");
    expect(out).toContain("August");
    expect(out).toContain("7");
    expect(out).toContain("2026");
  });

  it("does not shift the day across a timezone boundary", () => {
    expect(formatDate("2026-01-01")).toContain("1 January");
    expect(formatDate("2026-12-31")).toContain("31 December");
  });

  it("throws on a malformed date rather than printing Invalid Date", () => {
    expect(() => formatDate("not-a-date")).toThrow(/Invalid date/);
    // Date is forgiving enough to read "2026-08" as the 1st of August, which
    // would render a confident wrong date from a truncated client file.
    expect(() => formatDate("2026-08")).toThrow(/YYYY-MM-DD/);
    expect(() => formatDate("2026-13-01")).toThrow(/Invalid date/);
  });
});

describe("formatPeriod", () => {
  it("renders a YYYY-MM period as a month and year", () => {
    expect(formatPeriod("2026-10")).toBe("October 2026");
  });

  it("throws on a malformed period", () => {
    expect(() => formatPeriod("2026")).toThrow(/YYYY-MM/);
    expect(() => formatPeriod("2026-13")).toThrow(/Invalid report period/);
  });
});

describe("formatMinutes", () => {
  it("reads the way someone would say it", () => {
    expect(formatMinutes(2)).toBe("2 min");
    expect(formatMinutes(59)).toBe("59 min");
    expect(formatMinutes(60)).toBe("1 hr");
    expect(formatMinutes(80)).toBe("1 hr 20 min");
  });
});

describe("percentChange", () => {
  it("computes a rounded percentage", () => {
    expect(percentChange(214, 186)).toBe(15);
    expect(percentChange(9, 14)).toBe(-36);
  });

  it("returns null when there is nothing honest to compare against", () => {
    // No prior month, or a prior zero, where "up infinity percent" is noise.
    expect(percentChange(10, undefined)).toBeNull();
    expect(percentChange(10, 0)).toBeNull();
  });
});

describe("isGoodChange", () => {
  it("treats a rise as good for metrics you want more of", () => {
    expect(isGoodChange(15, "up-good")).toBe(true);
    expect(isGoodChange(-15, "up-good")).toBe(false);
  });

  it("treats a fall as good for no-shows and reply time", () => {
    // An inverted sign here would paint every month green regardless of what
    // actually happened, which is worse than showing no indicator at all.
    expect(isGoodChange(-36, "down-good")).toBe(true);
    expect(isGoodChange(36, "down-good")).toBe(false);
  });

  it("has no opinion on a flat or incomparable month", () => {
    expect(isGoodChange(0, "up-good")).toBeNull();
    expect(isGoodChange(0, "down-good")).toBeNull();
    expect(isGoodChange(null, "up-good")).toBeNull();
  });
});

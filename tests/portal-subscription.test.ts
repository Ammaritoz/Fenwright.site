import { describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));

import { documents } from "@/config/documents";
import { BILLING_INTERVALS, PLANS, periodPrice } from "@/config/plans";
import { overdueDates } from "@/lib/portal/subscription";

describe("plans", () => {
  it("price each plan from the package menu", () => {
    for (const plan of Object.values(PLANS)) {
      const tier = documents.packageTiers.find((t) => t.name === plan.tier);
      expect(tier, plan.tier).toBeDefined();
      expect(tier!.price).toBe(plan.monthly);
    }
  });

  it("charge the same monthly price whether billed monthly or quarterly", () => {
    expect(periodPrice("founding-core", "monthly")).toBe(75000);
    expect(periodPrice("founding-core", "quarterly")).toBe(225000);
    expect(periodPrice("founding-assured", "monthly")).toBe(140000);
    expect(periodPrice("founding-assured", "quarterly")).toBe(420000);
    expect(BILLING_INTERVALS.quarterly.months).toBe(3);
  });
});

describe("overdue rule (Services Agreement 4.3, 4.5)", () => {
  it("is due 14 days after the invoice, warns 7 days before the pause, and pauses 14 days after due", () => {
    const d = overdueDates("2027-01-04T00:00:00.000Z");
    expect(d.dueAt.slice(0, 10)).toBe("2027-01-18");
    expect(d.warnAt.slice(0, 10)).toBe("2027-01-25");
    expect(d.pauseAt.slice(0, 10)).toBe("2027-02-01");
  });
});

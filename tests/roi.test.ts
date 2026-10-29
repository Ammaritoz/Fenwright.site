import { describe, expect, it } from "vitest";
import {
  WEEKS_PER_MONTH,
  defaultState,
  formatEuro,
  formatEuroCents,
  formatJobs,
  formatPct,
  leadPacks,
  missedCalls,
  parseRoiParams,
  serialiseRoiState,
  type RoiState,
} from "@/lib/roi";

const calls = (over: Partial<Parameters<typeof missedCalls>[0]> = {}) =>
  missedCalls({
    callsPerWeek: 5,
    jobPct: 30,
    jobValue: 400,
    marginPct: 30,
    recoveryPct: 50,
    monthlyFee: null,
    ...over,
  });

const leads = (over: Partial<Parameters<typeof leadPacks>[0]> = {}) =>
  leadPacks({
    packSize: 30,
    pricePerLead: 40,
    closePct: 10,
    jobValue: 5000,
    marginPct: 30,
    ...over,
  });

describe("missedCalls", () => {
  it("turns weekly missed calls into monthly jobs, revenue and profit", () => {
    // 5 calls a week, 30% would have been jobs: 1.5 jobs a week, 6.5 a month.
    const r = calls()!;
    expect(WEEKS_PER_MONTH).toBeCloseTo(52 / 12);
    expect(r.jobsLostPerMonth).toBeCloseTo(6.5);
    expect(r.revenueLostPerMonth).toBeCloseTo(2600);
    expect(r.revenueLostPerYear).toBeCloseTo(31200);
    expect(r.profitLostPerMonth).toBeCloseTo(780);
    expect(r.recoveredProfitPerMonth).toBeCloseTo(390);
  });

  it("leaves the fee comparison out until a fee is entered", () => {
    expect(calls()!.fee).toBeNull();
    expect(calls({ monthlyFee: 0 })!.fee).toBeNull();
  });

  it("compares the recovered profit with our monthly fee", () => {
    const fee = calls({ monthlyFee: 299 })!.fee!;
    expect(fee.netGain).toBeCloseTo(91);
    expect(fee.multiple).toBeCloseTo(390 / 299);
    // Each recovered call is worth 30% x 400 x 30% = 36 in profit.
    expect(fee.breakEvenCallsPerMonth).toBeCloseTo(299 / 36);
  });

  it("shows a loss honestly when the fee is more than the recovered profit", () => {
    expect(calls({ monthlyFee: 500 })!.fee!.netGain).toBeCloseTo(-110);
  });

  it("has no break-even when a recovered call is worth nothing", () => {
    const fee = calls({ jobPct: 0, monthlyFee: 299 })!.fee!;
    expect(fee.breakEvenCallsPerMonth).toBeNull();
    expect(fee.netGain).toBe(-299);
  });

  it("returns null while a required input is blank", () => {
    expect(calls({ callsPerWeek: null })).toBeNull();
    expect(calls({ jobPct: null })).toBeNull();
    expect(calls({ jobValue: null })).toBeNull();
    expect(calls({ marginPct: null })).toBeNull();
    expect(calls({ recoveryPct: null })).toBeNull();
  });
});

describe("leadPacks", () => {
  it("works out the pack at the buyer's own close rate", () => {
    const r = leads()!;
    expect(r.atBuyerRate.packPrice).toBe(1200);
    expect(r.atBuyerRate.expectedJobs).toBeCloseTo(3);
    expect(r.atBuyerRate.revenue).toBeCloseTo(15000);
    expect(r.atBuyerRate.grossProfit).toBeCloseTo(4500);
    expect(r.atBuyerRate.profitAfterPack).toBeCloseTo(3300);
  });

  it("measures return per euro in gross profit, not revenue", () => {
    // Revenue per euro would be 12.5, which flatters the pack by ignoring job costs.
    expect(leads()!.atBuyerRate.returnPerEuro).toBeCloseTo(3.75);
  });

  it("finds the close rate at which the pack pays for itself", () => {
    // 40 / (5000 x 30%) = 2.67%
    expect(leads()!.breakEvenClosePct).toBeCloseTo(2.6667, 3);
  });

  it("has no break-even when a job earns no profit", () => {
    expect(leads({ marginPct: 0 })!.breakEvenClosePct).toBeNull();
  });

  it("lists 5 to 25 percent and marks the buyer's rate", () => {
    const rows = leads()!.table;
    expect(rows.map((r) => r.closePct)).toEqual([5, 10, 15, 20, 25]);
    expect(rows.filter((r) => r.isBuyerRate).map((r) => r.closePct)).toEqual([10]);
  });

  it("adds the buyer's rate as its own row when it is not a table rate", () => {
    const rows = leads({ closePct: 12.5 })!.table;
    expect(rows.map((r) => r.closePct)).toEqual([5, 10, 12.5, 15, 20, 25]);
    expect(rows.find((r) => r.isBuyerRate)!.closePct).toBe(12.5);
  });

  it("marks rows that lose money", () => {
    // At 1500 a job and 30% margin each job is worth 450; 30 leads at 40 is
    // 1200, so 5% (1.5 jobs, 675) loses and 10% (3 jobs, 1350) just wins.
    const rows = leads({ jobValue: 1500 })!.table;
    expect(rows.find((r) => r.closePct === 5)!.losesMoney).toBe(true);
    expect(rows.find((r) => r.closePct === 10)!.losesMoney).toBe(false);
  });

  it("returns null until a price per lead is entered", () => {
    expect(leads({ pricePerLead: null })).toBeNull();
    expect(leads({ pricePerLead: 0 })).toBeNull();
  });

  it("returns null while a required input is blank", () => {
    expect(leads({ closePct: null })).toBeNull();
    expect(leads({ jobValue: null })).toBeNull();
    expect(leads({ marginPct: null })).toBeNull();
  });
});

describe("URL state", () => {
  it("opens on the defaults with no parameters", () => {
    expect(parseRoiParams({})).toEqual(defaultState());
  });

  it("starts the fee and the price per lead blank", () => {
    const s = defaultState();
    expect(s.monthlyFee).toBeNull();
    expect(s.pricePerLead).toBeNull();
    expect(s.closePct).toBe(10);
    expect(s.leadsMarginPct).toBe(30);
  });

  it("round-trips the lead packs mode exactly", () => {
    const s: RoiState = { ...defaultState(), mode: "leads", packSize: 50, pricePerLead: 45, closePct: 12.5, leadsJobValue: 9000, leadsMarginPct: 25 };
    expect(parseRoiParams(Object.fromEntries(serialiseRoiState(s)))).toEqual(s);
  });

  it("round-trips the missed calls mode exactly, including a cleared field", () => {
    const s: RoiState = { ...defaultState(), mode: "calls", callsPerWeek: null, jobPct: 40, monthlyFee: 299 };
    expect(parseRoiParams(Object.fromEntries(serialiseRoiState(s)))).toEqual(s);
  });

  it("only writes the active mode's numbers into the link", () => {
    const keys = [...serialiseRoiState({ ...defaultState(), mode: "leads" }).keys()];
    expect(keys).toEqual(["mode", "pack", "price", "close", "job", "margin"]);
  });

  it("clamps out-of-range values and ignores junk", () => {
    const s = parseRoiParams({ mode: "leads", close: "250", margin: "-5", job: "abc", pack: "17" });
    expect(s.closePct).toBe(100);
    expect(s.leadsMarginPct).toBe(0);
    expect(s.leadsJobValue).toBe(defaultState().leadsJobValue);
    expect(s.packSize).toBe(defaultState().packSize);
  });

  it("falls back to missed calls for an unknown mode", () => {
    expect(parseRoiParams({ mode: "nonsense" }).mode).toBe("calls");
  });

  it("takes the first value when a parameter repeats", () => {
    expect(parseRoiParams({ mode: "calls", calls: ["8", "9"] }).callsPerWeek).toBe(8);
  });
});

describe("formatting", () => {
  it("shows estimates in whole euros", () => {
    expect(formatEuro(2600)).toBe("€2,600");
    expect(formatEuro(389.6)).toBe("€390");
    expect(formatEuro(-110)).toContain("110");
  });

  it("shows return per euro with cents", () => {
    expect(formatEuroCents(3.75)).toBe("€3.75");
  });

  it("shows percentages and jobs to at most one decimal", () => {
    expect(formatPct(2.6667)).toBe("2.7%");
    expect(formatPct(10)).toBe("10%");
    expect(formatJobs(6.5)).toBe("6.5");
    expect(formatJobs(3)).toBe("3");
  });
});

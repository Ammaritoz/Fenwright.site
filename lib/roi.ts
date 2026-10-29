/**
 * ROI calculator maths and link state (app/roi).
 *
 * Kept free of React so every number a prospect sees on a sales call is
 * covered by tests/roi.test.ts. Every function returns null rather than NaN or
 * Infinity while an input is blank, so the page can say "enter a price"
 * instead of rendering "€NaN".
 *
 * Unlike lib/portal/format.ts these are estimates, not invoices: plain floats
 * are fine here, and money is shown in whole euros.
 */

import { PACK_SIZES, roi, type Limit, type PackSize } from "@/config/roi";

export const WEEKS_PER_MONTH = 52 / 12;

/** A number a person can leave blank. */
type Num = number | null;

export type MissedCallsInputs = {
  callsPerWeek: Num;
  jobPct: Num;
  jobValue: Num;
  marginPct: Num;
  recoveryPct: Num;
  monthlyFee: Num;
};

export type MissedCallsResult = {
  jobsLostPerMonth: number;
  revenueLostPerMonth: number;
  revenueLostPerYear: number;
  profitLostPerMonth: number;
  recoveredProfitPerMonth: number;
  /** Null until our fee is entered. */
  fee: {
    netGain: number;
    multiple: number;
    /** Null when a recovered call earns nothing, so no number of them covers the fee. */
    breakEvenCallsPerMonth: number | null;
  } | null;
};

export function missedCalls(i: MissedCallsInputs): MissedCallsResult | null {
  const { callsPerWeek, jobPct, jobValue, marginPct, recoveryPct, monthlyFee } = i;
  if (callsPerWeek === null || jobPct === null || jobValue === null || marginPct === null || recoveryPct === null) {
    return null;
  }

  const profitPerCall = (jobPct / 100) * jobValue * (marginPct / 100);
  const jobsLostPerMonth = callsPerWeek * (jobPct / 100) * WEEKS_PER_MONTH;
  const revenueLostPerMonth = jobsLostPerMonth * jobValue;
  const profitLostPerMonth = revenueLostPerMonth * (marginPct / 100);
  const recoveredProfitPerMonth = profitLostPerMonth * (recoveryPct / 100);

  return {
    jobsLostPerMonth,
    revenueLostPerMonth,
    revenueLostPerYear: revenueLostPerMonth * 12,
    profitLostPerMonth,
    recoveredProfitPerMonth,
    fee:
      monthlyFee === null || monthlyFee === 0
        ? null
        : {
            netGain: recoveredProfitPerMonth - monthlyFee,
            multiple: recoveredProfitPerMonth / monthlyFee,
            breakEvenCallsPerMonth: profitPerCall > 0 ? monthlyFee / profitPerCall : null,
          },
  };
}

export type LeadPackInputs = {
  packSize: PackSize;
  pricePerLead: Num;
  closePct: Num;
  jobValue: Num;
  marginPct: Num;
};

export type LeadPackScenario = {
  closePct: number;
  packPrice: number;
  expectedJobs: number;
  revenue: number;
  grossProfit: number;
  profitAfterPack: number;
  /** Gross profit per euro spent on the pack. Revenue per euro would flatter it. */
  returnPerEuro: number;
};

export type LeadPackResult = {
  atBuyerRate: LeadPackScenario;
  /** Null when a job earns no profit, so no close rate covers the pack. May exceed 100. */
  breakEvenClosePct: number | null;
  table: (LeadPackScenario & { isBuyerRate: boolean; losesMoney: boolean })[];
};

function scenario(packSize: number, pricePerLead: number, closePct: number, jobValue: number, marginPct: number): LeadPackScenario {
  const packPrice = packSize * pricePerLead;
  const expectedJobs = packSize * (closePct / 100);
  const revenue = expectedJobs * jobValue;
  const grossProfit = revenue * (marginPct / 100);
  return {
    closePct,
    packPrice,
    expectedJobs,
    revenue,
    grossProfit,
    profitAfterPack: grossProfit - packPrice,
    returnPerEuro: grossProfit / packPrice,
  };
}

export function leadPacks(i: LeadPackInputs): LeadPackResult | null {
  const { packSize, pricePerLead, closePct, jobValue, marginPct } = i;
  // A zero price would divide by zero in every return figure, and nobody sells free leads.
  if (pricePerLead === null || pricePerLead === 0 || closePct === null || jobValue === null || marginPct === null) {
    return null;
  }

  const profitPerJob = jobValue * (marginPct / 100);
  const rates = [...new Set<number>([...roi.leads.table.rates, closePct])].sort((a, b) => a - b);

  return {
    atBuyerRate: scenario(packSize, pricePerLead, closePct, jobValue, marginPct),
    breakEvenClosePct: profitPerJob > 0 ? (pricePerLead / profitPerJob) * 100 : null,
    table: rates.map((rate) => {
      const s = scenario(packSize, pricePerLead, rate, jobValue, marginPct);
      return { ...s, isBuyerRate: rate === closePct, losesMoney: s.profitAfterPack < 0 };
    }),
  };
}

// --- Link state -------------------------------------------------------------
// The page's numbers live in the URL so a link shared after a call reopens
// exactly what the prospect saw. Business figures only, never personal data.

export type RoiMode = "calls" | "leads";

export type RoiState = {
  mode: RoiMode;
  callsPerWeek: Num;
  jobPct: Num;
  callsJobValue: Num;
  callsMarginPct: Num;
  recoveryPct: Num;
  monthlyFee: Num;
  packSize: PackSize;
  pricePerLead: Num;
  closePct: Num;
  leadsJobValue: Num;
  leadsMarginPct: Num;
};

export function defaultState(): RoiState {
  const c = roi.calls.defaults;
  const l = roi.leads.defaults;
  return {
    mode: "calls",
    callsPerWeek: c.callsPerWeek,
    jobPct: c.jobPct,
    callsJobValue: c.jobValue,
    callsMarginPct: c.marginPct,
    recoveryPct: c.recoveryPct,
    monthlyFee: c.monthlyFee,
    packSize: l.packSize,
    pricePerLead: l.pricePerLead,
    closePct: l.closePct,
    leadsJobValue: l.jobValue,
    leadsMarginPct: l.marginPct,
  };
}

type NumKey = Exclude<keyof RoiState, "mode" | "packSize">;
const lim = roi.limits;

/** URL key, state key and bounds for each number, per mode, in link order. */
const PARAMS: Record<RoiMode, [string, NumKey, Limit][]> = {
  calls: [
    ["calls", "callsPerWeek", lim.callsPerWeek],
    ["convert", "jobPct", lim.percent],
    ["job", "callsJobValue", lim.jobValue],
    ["margin", "callsMarginPct", lim.percent],
    ["recover", "recoveryPct", lim.percent],
    ["fee", "monthlyFee", lim.monthlyFee],
  ],
  leads: [
    ["price", "pricePerLead", lim.pricePerLead],
    ["close", "closePct", lim.percent],
    ["job", "leadsJobValue", lim.jobValue],
    ["margin", "leadsMarginPct", lim.percent],
  ],
};

export function clamp(n: number, { min, max }: Limit): number {
  return Math.min(max, Math.max(min, n));
}

/**
 * Text to a number, or null for blank. Undefined for junk, so the caller can
 * keep whatever it had. Thousands separators are allowed: people type "8,000".
 */
export function parseNumber(raw: string): number | null | undefined {
  const t = raw.trim().replace(/,/g, "");
  if (t === "") return null;
  const n = Number(t);
  return Number.isFinite(n) ? n : undefined;
}

type Params = Record<string, string | string[] | undefined>;

export function parseRoiParams(params: Params): RoiState {
  const get = (k: string) => {
    const v = params[k];
    return Array.isArray(v) ? v[0] : v;
  };
  const state = defaultState();
  const mode = get("mode") === "leads" ? "leads" : "calls";
  state.mode = mode;

  for (const [key, field, limit] of PARAMS[mode]) {
    const raw = get(key);
    if (raw === undefined) continue;
    const n = parseNumber(raw);
    if (n === undefined) continue;
    state[field] = n === null ? null : clamp(n, limit);
  }

  if (mode === "leads") {
    const pack = Number(get("pack"));
    if ((PACK_SIZES as readonly number[]).includes(pack)) state.packSize = pack as PackSize;
  }
  return state;
}

/** Only the active mode's numbers; a blank is written as an empty value so it reopens blank. */
export function serialiseRoiState(s: RoiState): URLSearchParams {
  const out = new URLSearchParams({ mode: s.mode });
  if (s.mode === "leads") out.set("pack", String(s.packSize));
  for (const [key, field] of PARAMS[s.mode]) {
    const v = s[field];
    out.set(key, v === null ? "" : String(v));
  }
  return out;
}

// --- Formatting ---------------------------------------------------------------

const euro = new Intl.NumberFormat("en-IE", { style: "currency", currency: "EUR", maximumFractionDigits: 0 });
const euroCents = new Intl.NumberFormat("en-IE", { style: "currency", currency: "EUR", minimumFractionDigits: 2, maximumFractionDigits: 2 });
const oneDecimal = new Intl.NumberFormat("en-IE", { maximumFractionDigits: 1 });

/** "€2,600". Estimates in whole euros: cents would suggest precision we do not have. */
export function formatEuro(n: number): string {
  return euro.format(n);
}

/** "€3.75", for return per euro, where the cents are the point. */
export function formatEuroCents(n: number): string {
  return euroCents.format(n);
}

export function formatPct(n: number): string {
  return `${oneDecimal.format(n)}%`;
}

export function formatJobs(n: number): string {
  return oneDecimal.format(n);
}

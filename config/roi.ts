/**
 * ROI calculator copy and defaults (app/roi).
 *
 * A sales-call tool, not a marketing page: the page is unlisted (noindex, not
 * in the sitemap or nav) and opened from a link shared on a pipeline call.
 * Edit copy and starting values here, not in the components. No em dashes in
 * visitor-facing copy (matches config/site.ts).
 *
 * Honesty rules the defaults encode:
 * - Lead packs use the buyer's OWN close rate, starting at 10%. Never 25%.
 * - Returns are measured in gross profit, not revenue.
 * - Our monthly fee and the price per lead start blank, so the page never
 *   quotes a number we have not said out loud for this prospect.
 */

export const PACK_SIZES = [10, 30, 50] as const;
export type PackSize = (typeof PACK_SIZES)[number];

/** Inclusive bounds a value is clamped to, from the URL or the keyboard. */
export type Limit = { min: number; max: number };

export const roi = {
  meta: {
    title: "What are the leaks costing you?",
    description: "Work out what missed calls cost your business, and what a pack of exclusive leads would really return.",
  },

  intro: {
    headline: "What are the leaks",
    headlineEmphasis: "costing you?",
    lead: "Put in your own numbers and everything works out live. The link under the results saves exactly what you see, so you can come back to it.",
  },

  modes: {
    calls: { label: "Missed calls", short: "What missed calls cost you" },
    leads: { label: "Lead packs", short: "What a pack of leads returns" },
  },

  limits: {
    callsPerWeek: { min: 0, max: 1000 },
    percent: { min: 0, max: 100 },
    jobValue: { min: 0, max: 1_000_000 },
    monthlyFee: { min: 0, max: 100_000 },
    pricePerLead: { min: 0, max: 10_000 },
  } satisfies Record<string, Limit>,

  calls: {
    defaults: {
      callsPerWeek: 5,
      jobPct: 30,
      jobValue: 400,
      marginPct: 30,
      recoveryPct: 50,
      monthlyFee: null,
    },
    fields: {
      callsPerWeek: { label: "Missed calls a week", hint: "Calls nobody picked up, including after hours." },
      jobPct: { label: "Callers who would book", hint: "Of those callers, what share would you normally have booked?" },
      jobValue: { label: "Average job value", hint: "What a typical job is invoiced at." },
      marginPct: { label: "Gross margin", hint: "What is left of a job after materials and labour." },
      recoveryPct: { label: "Share we would win back", hint: "Not every caller waits for a call back. Half is a cautious guess." },
      monthlyFee: { label: "Our monthly fee", hint: "Leave blank until we have agreed a price." },
    },
    sheet: {
      label: "Missed calls",
      range: "Each month",
      incomplete: "Fill in every box (our fee can stay blank) to see what missed calls cost.",
      headlineSuffix: "in jobs that rang and went elsewhere",
      perYear: "That is {amount} a year.",
      rows: {
        jobsLost: "Jobs lost a month",
        revenueLost: "Revenue lost",
        profitLost: "Gross profit lost",
        recovered: "Profit won back at {pct}",
      },
      feeBlank: "Add our monthly fee to see whether winning those calls back pays for itself.",
      fee: {
        fee: "Our fee",
        netGain: "Left over after our fee",
        multiple: "Profit won back for every euro of fee",
        breakEven: "Pays for itself once it wins back",
        breakEvenUnit: "calls a month",
        noBreakEven: "Not at these numbers",
      },
    },
    assumptions:
      "A month is 52 weeks divided by 12. Profit is revenue times your gross margin. These are your numbers, not ours: an estimate to talk through, not a promise.",
  },

  leads: {
    defaults: {
      packSize: 30 as PackSize,
      pricePerLead: null,
      closePct: 10,
      jobValue: 5000,
      marginPct: 30,
    },
    packLabel: "Pack size",
    packUnit: "leads",
    packHint: "Every lead goes to you alone. Packs are paid up front.",
    fields: {
      pricePerLead: { label: "Price per lead", hint: "Leave blank until we have agreed a price." },
      closePct: { label: "Your close rate", hint: "Out of every 10 enquiries you quote, how many become jobs? 1 in 10 is 10%." },
      jobValue: { label: "Average job value", hint: "What a typical job is invoiced at." },
      marginPct: { label: "Gross margin", hint: "What is left of a job after materials and labour." },
    },
    sheet: {
      label: "Lead pack",
      blank: "Add a price per lead to see what this pack would return.",
      incomplete: "Fill in every box to see what this pack would return.",
      noBreakEvenValue: "None",
      headlinePrefix: "Every €1 on leads returns",
      headlineSuffix: "in gross profit",
      rows: {
        packPrice: "Pack price",
        expectedJobs: "Expected jobs at {pct}",
        revenue: "Revenue",
        grossProfit: "Gross profit at {pct} margin",
        afterPack: "Left after paying for the pack",
        breakEven: "Break-even close rate",
      },
      breakEvenLine: "The pack pays for itself if you close more than {pct} of leads, about 1 in {n}.",
      breakEvenImpossible: "At this price even closing every lead would not cover the pack.",
      noBreakEven: "With no profit per job, no close rate covers the pack.",
    },
    table: {
      heading: "At other close rates",
      lead: "Your own rate is highlighted. Rates are the share of leads that become paid jobs.",
      rates: [5, 10, 15, 20, 25],
      columns: {
        closePct: "Close rate",
        jobs: "Jobs",
        revenue: "Revenue",
        grossProfit: "Gross profit",
        afterPack: "After the pack",
        perEuro: "Per €1",
      },
      yourRate: "your rate",
      loss: "loss",
    },
    assumptions:
      "Expected jobs is the pack size times your close rate, so it can be a fraction: 1.5 jobs means one or two. Profit is revenue times your gross margin. These are your numbers, not ours: an estimate to talk through, not a promise.",
  },

  share: {
    copyLabel: "Copy link to these numbers",
    copiedLabel: "Link copied",
    note: "The link holds only the numbers on this page, nothing about you.",
  },

  cta: {
    headline: "Want us to look at where the rest goes?",
    body: "A free 30 minute call. We look at your calls, enquiries, quotes and reviews, then send a written plan with a price on each fix.",
    label: "Book a call",
    href: "/#book",
  },
} as const;

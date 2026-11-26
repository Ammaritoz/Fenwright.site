/**
 * Plans a client can subscribe to, paid automatically through Stripe.
 *
 * A client file names one of these in `subscription.plan`; the portal then
 * offers the billing choices below and Stripe charges every period by itself
 * (lib/portal/subscription.ts). Prices are minor units (cents) per month and
 * must match the package menu in config/documents.ts (a test checks this).
 *
 * The Readiness Sprint is not here: it is a one-off invoice, paid with the
 * ordinary "Pay online" button.
 */

export const PLANS = {
  "founding-core": {
    name: "Founding Core",
    /** The packageTiers entry this plan is priced from. */
    tier: "Founding Core",
    monthly: 75000,
    description: "CRA vulnerability monitoring and Article 14 report drafting",
  },
  "founding-assured": {
    name: "Founding Assured",
    tier: "Founding Assured",
    monthly: 140000,
    description: "CRA vulnerability monitoring and Article 14 reporting, seven days a week",
  },
} as const;

export type PlanId = keyof typeof PLANS;

/** How often a client can choose to be billed. Same monthly price either way (Services Agreement 4.3). */
export const BILLING_INTERVALS = {
  quarterly: { months: 3, label: "Quarterly", per: "quarter" },
  monthly: { months: 1, label: "Monthly", per: "month" },
} as const;

export type BillingInterval = keyof typeof BILLING_INTERVALS;

/** Default shown first in the portal. */
export const DEFAULT_INTERVAL: BillingInterval = "quarterly";

export function periodPrice(plan: PlanId, interval: BillingInterval): number {
  return PLANS[plan].monthly * BILLING_INTERVALS[interval].months;
}

/**
 * Overdue rule from Services Agreement 4.3 and 4.5: an invoice that was not
 * collected is due 14 days after its date, and monitoring pauses once it is
 * more than 14 days past that. The warning goes out 7 days before the pause.
 */
export const OVERDUE = { dueDays: 14, pauseAfterDays: 14, warnDaysBefore: 7 } as const;

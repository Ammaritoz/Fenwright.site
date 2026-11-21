import { z } from "zod";
import type { DashboardData } from "@/content/clients/types";

/**
 * Runtime check on what fenwright-watch wrote to Neon.
 *
 * The payload crosses a process and a language boundary, so the TypeScript
 * type alone proves nothing about it. Parsing here means a pipeline change
 * that drifts from DashboardData is caught on the server and shown as "data
 * unavailable", instead of rendering NaN, "Invalid Date" or a half-empty
 * dashboard to a client. Kept free of "server-only" so it can be unit tested.
 */

// Full ISO 8601 with an offset, as dashboard.py _iso() emits.
const isoTs = z.string().datetime({ offset: true });

const metrics = z.object({
  componentsMonitored: z.number().int().nonnegative(),
  vulnerabilitiesMatched: z.number().int().nonnegative(),
  assessedNotAffected: z.number().int().nonnegative(),
  assessedAffected: z.number().int().nonnegative(),
  reportableEvents: z.number().int().nonnegative(),
  medianHoursToAssessment: z.number().nonnegative().nullable(),
});

const count = z.number().int().nonnegative();

export const dashboardSchema = z.object({
  generatedAt: isoTs,
  monitoring: z.boolean(),
  products: z.array(
    z.object({
      name: z.string(),
      version: z.string(),
      components: count,
      lastScanned: isoTs,
      monitoredSince: isoTs.optional(),
    })
  ),
  totals: z.object({
    components: count,
    matches: count,
    exploited: count,
    affected: count,
    notAffected: count,
    underInvestigation: count,
    unassessed: count,
    awaitingReview: count,
  }),
  findings: z.array(
    z.object({
      cve: z.string(),
      product: z.string(),
      component: z.string(),
      cvss: z.number().nullable(),
      exploited: z.boolean(),
      status: z.enum(["affected", "not_affected", "under_investigation", "unassessed"]),
      reviewed: z.boolean(),
      justification: z.string().optional(),
      reasoning: z.string().optional(),
      decidedAt: isoTs.optional(),
    })
  ),
  reports: z.array(
    z.object({
      cve: z.string(),
      stage: z.string(),
      createdAt: isoTs.nullable(),
      dueAt: isoTs.optional(),
    })
  ),
  log: z.array(
    z.object({
      at: isoTs,
      event: z.string(),
      by: z.string().nullable(),
      detail: z.string(),
      product: z.string().optional(),
      cve: z.string().optional(),
    })
  ),
  questions: z
    .array(
      z.object({
        cve: z.string(),
        product: z.string(),
        component: z.string(),
        question: z.string(),
        askedAt: isoTs.optional(),
      })
    )
    .optional(),
  daily: z
    .array(
      z.object({
        date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
        matched: count,
        open: count,
      })
    )
    .optional(),
  monthly: z
    .object({
      period: z.string().regex(/^\d{4}-\d{2}$/),
      current: metrics,
      previous: metrics.nullable(),
    })
    .optional(),
}) satisfies z.ZodType<DashboardData>;

export type DashboardResult =
  | { ok: true; data: DashboardData }
  | { ok: false; reason: "not-configured" | "no-data" | "invalid" | "unreachable" };

/** Parse a raw payload row. Never throws. */
export function parseDashboard(raw: unknown): DashboardResult {
  if (raw === null || raw === undefined) return { ok: false, reason: "no-data" };
  const parsed = dashboardSchema.safeParse(raw);
  return parsed.success ? { ok: true, data: parsed.data } : { ok: false, reason: "invalid" };
}

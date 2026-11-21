import "server-only";
import { neon } from "@neondatabase/serverless";
import { errMeta } from "@/lib/log";
import { parseDashboard, type DashboardResult } from "./dashboard-schema";

/**
 * The one place the portal reads live monitoring data.
 *
 * fenwright-watch keeps its working data in a local SQLite file and pushes a
 * client-safe summary to Neon after each run (`fenwright-watch sync`). This
 * reads that summary for one client. Swap the source here and nothing in the
 * UI changes.
 *
 * Security: the slug must come from the route params of a portal page, which
 * middleware.ts has already gated on that client's session cookie. Never call
 * this with a slug taken from a query string or a form. The connection uses
 * PORTAL_DB_READ_URL, a SELECT-only role (db/portal/001_snapshot.sql), never
 * the owner-level DATABASE_URL.
 *
 * Never throws: a Neon outage shows the client a calm "unavailable" card
 * while the documents keep working.
 */
export async function getDashboard(clientSlug: string): Promise<DashboardResult> {
  // Development only: a sample payload, to work on the UI without Neon.
  // Hard-gated on NODE_ENV so it can never reach a client in production.
  if (process.env.NODE_ENV !== "production" && process.env.PORTAL_DASHBOARD_FIXTURE === "1") {
    const { dashboardFixture } = await import("./dashboard-fixture");
    return parseDashboard(dashboardFixture());
  }

  const url = process.env.PORTAL_DB_READ_URL;
  if (!url) return { ok: false, reason: "not-configured" };

  try {
    const sql = neon(url);
    const rows = await sql`SELECT payload FROM portal_snapshot WHERE client_slug = ${clientSlug} LIMIT 1`;
    const result = parseDashboard(rows[0]?.payload);
    if (!result.ok && result.reason === "invalid") {
      // The operator needs to know the pipeline and the site disagree.
      console.error("[fenwright] portal dashboard payload failed validation for a client");
    }
    return result;
  } catch (err) {
    console.error(
      "[fenwright] portal dashboard read failed:",
      err instanceof Error ? err.message : errMeta(err)
    );
    return { ok: false, reason: "unreachable" };
  }
}

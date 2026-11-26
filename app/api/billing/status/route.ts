import { NextResponse, type NextRequest } from "next/server";
import { bearerOk, statuses } from "@/lib/portal/billing-jobs";

/**
 * Payment status of every client on a plan, for fenwright-watch: it holds back
 * alerts for a client whose monitoring is paused (Services Agreement 4.5).
 * Bearer BILLING_STATUS_TOKEN. Returns slugs and states only, nothing else.
 */
export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  if (!bearerOk(req.headers.get("authorization"), process.env.BILLING_STATUS_TOKEN)) {
    return NextResponse.json({ error: "unauthorised" }, { status: 401 });
  }
  const list = await statuses();
  return NextResponse.json({
    generatedAt: new Date().toISOString(),
    clients: list.map((s) => ({ slug: s.slug, state: s.state, pauseAt: s.pauseAt })),
  });
}

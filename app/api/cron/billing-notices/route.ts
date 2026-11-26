import { NextResponse, type NextRequest } from "next/server";
import { bearerOk, sendNotices } from "@/lib/portal/billing-jobs";

/**
 * Daily (vercel.json): the written warning 7 days before monitoring pauses, and
 * the notice on the day it pauses (Services Agreement 4.5). Vercel Cron sends
 * Authorization: Bearer CRON_SECRET.
 */
export const dynamic = "force-dynamic";
export const maxDuration = 60;

export async function GET(req: NextRequest) {
  if (!bearerOk(req.headers.get("authorization"), process.env.CRON_SECRET)) {
    return NextResponse.json({ error: "unauthorised" }, { status: 401 });
  }
  const result = await sendNotices();
  console.log("[fenwright] billing notices:", JSON.stringify(result));
  return NextResponse.json({ ok: true, result });
}

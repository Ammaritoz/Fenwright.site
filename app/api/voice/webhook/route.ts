import { NextRequest, NextResponse } from "next/server";
import { verifyVoiceRequest } from "@/lib/voice/auth";
import { toCallRecord } from "@/lib/voice/report";
import { logCall } from "@/lib/voice/calls";
import { errMeta } from "@/lib/log";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Lifecycle events from the voice platform. Only the end-of-call report is
 * acted on; everything else is acknowledged and ignored so the platform does
 * not retry.
 */
export async function POST(req: NextRequest) {
  const rawBody = await req.text();

  const verified = verifyVoiceRequest(req.headers, rawBody, Date.now());
  if (!verified.ok) {
    console.warn("[fenwright] voice webhook rejected:", verified.reason);
    return NextResponse.json({ error: "Unauthorised." }, { status: 401 });
  }

  let payload: unknown;
  try {
    payload = JSON.parse(rawBody);
  } catch {
    return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  }

  try {
    const record = toCallRecord(payload);
    if (record) await logCall(record);
  } catch (err) {
    // Never fail the webhook: the platform retries, and the call is already over.
    console.error("[fenwright] voice webhook handling failed:", errMeta(err));
  }

  return NextResponse.json({ ok: true });
}

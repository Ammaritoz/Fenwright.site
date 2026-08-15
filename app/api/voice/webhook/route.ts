import { NextRequest, NextResponse } from "next/server";
import { verifyVoiceRequest } from "@/lib/voice/auth";
import { toCallRecord } from "@/lib/voice/report";
import { logCall } from "@/lib/voice/calls";
import { claimOnce, idempotencyKey } from "@/lib/voice/idempotency";
import { errMeta } from "@/lib/log";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Long, because a report redelivered days later would double-count just as
 * badly as one redelivered seconds later. The row it guards is written once
 * per call and never updated.
 */
const END_OF_CALL_TTL_SECONDS = 7 * 24 * 60 * 60;

/**
 * Lifecycle events from the voice platform. Only the end-of-call report is
 * acted on; everything else is acknowledged and ignored so the platform does
 * not retry.
 */
export async function POST(req: NextRequest) {
  let rawBody: string;
  try {
    rawBody = await req.text();
  } catch (err) {
    // The body never fully arrived, so this request cannot be verified. It is
    // not authenticated, so it must not get the speakable-200 treatment
    // reserved below for calls that already passed signature verification.
    console.error("[fenwright] voice webhook body read failed:", errMeta(err));
    return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  }

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
    if (record) {
      // Spec section 7 makes CallId unique, Airtable does not enforce it, and
      // the platform redelivers. A duplicated report would double-count every
      // metric in the table, so the same claim helper all four tools use guards
      // this write too. Keyed on callId alone: a redelivery may carry a revised
      // cost or summary, and it is still the same call.
      //
      // Deliberately NOT released on failure, which is the opposite of the
      // tools' trade-off. There a lost booking is worse than a duplicate, so a
      // failed attempt frees its key and an honest retry proceeds. Here a
      // duplicate row silently corrupts the numbers the weekly review works
      // from, while a missing row is one visible gap in a log that can be
      // reconciled against the platform.
      const claimed = await claimOnce(
        idempotencyKey(record.callId, "end_of_call", {}),
        END_OF_CALL_TTL_SECONDS
      );
      if (claimed) {
        await logCall(record);
      } else {
        console.warn("[fenwright] duplicate end-of-call report ignored");
      }
    }
  } catch (err) {
    // Never fail the webhook: the platform retries, and the call is already over.
    console.error("[fenwright] voice webhook handling failed:", errMeta(err));
  }

  return NextResponse.json({ ok: true });
}

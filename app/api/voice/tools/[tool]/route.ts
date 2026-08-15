import { NextRequest, NextResponse } from "next/server";
import { verifyVoiceRequest } from "@/lib/voice/auth";
import { runTool } from "@/lib/voice/tools";
import { rateLimit } from "@/lib/ratelimit";
import { limits } from "@/config/limits";
import { errMeta } from "@/lib/log";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * A limit being hit is still a live phone call, so it is answered in words the
 * assistant can read out rather than with an error the caller would hear as
 * silence.
 */
function speakable(result: string) {
  return NextResponse.json({ result }, { status: 200 });
}

/**
 * Tool calls from the voice platform.
 *
 * Authenticated by shared-secret signature rather than by origin: the caller is
 * a server, not a browser, so guardRequest's same-origin logic does not apply.
 * The raw body text is needed for signature verification, so it is read as text
 * and parsed afterwards.
 */
export async function POST(
  req: NextRequest,
  { params }: { params: { tool: string } }
) {
  let rawBody: string;
  try {
    rawBody = await req.text();
  } catch (err) {
    // The body never fully arrived, so this request cannot be verified. It is
    // not authenticated, so it must not get the speakable-200 treatment
    // reserved below for calls that already passed signature verification.
    console.error("[fenwright] voice tool body read failed:", errMeta(err));
    return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  }

  const verified = verifyVoiceRequest(req.headers, rawBody, Date.now());
  if (!verified.ok) {
    console.warn("[fenwright] voice tool rejected:", verified.reason);
    return NextResponse.json({ error: "Unauthorised." }, { status: 401 });
  }

  let payload: { callId?: string; arguments?: unknown };
  try {
    payload = JSON.parse(rawBody);
  } catch {
    return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  }

  const callId = typeof payload.callId === "string" ? payload.callId : "";
  if (!callId) {
    return NextResponse.json({ error: "Missing callId." }, { status: 400 });
  }

  // A hostile or looping call must not fan out into unlimited SMS or bookings.
  let limited: { success: boolean } = { success: true };
  try {
    limited = await rateLimit("voice-tool", callId, 40, "10 m");
  } catch (err) {
    // The request is already signature-verified, and rate limiting is a secondary
    // guard against runaway loops rather than the security boundary. A limiter
    // outage must not become dead air on a live call, so fail open and log.
    console.error("[fenwright] voice rate limiter unavailable:", errMeta(err));
  }
  if (!limited.success) {
    return speakable("I am having trouble on my side. Let me take your number instead.");
  }

  // send_recap_sms is the fan-out risk. The limiter above is one budget of 40
  // shared across all four tools, so a single signed call could spend it
  // texting 40 different numbers. Its own budget is much tighter.
  //
  // This one correctly gates the tool rather than the send: send_recap_sms
  // exists only to put a text on the wire, so refusing it costs nothing else.
  // The global daily spend cap deliberately lives lower down, in trySms, so an
  // exhausted budget costs a courtesy text and never an appointment.
  if (params.tool === "send_recap_sms") {
    let recapLimited: { success: boolean } = { success: true };
    try {
      recapLimited = await rateLimit(
        "voice-recap-sms",
        callId,
        limits.voice.recapSmsPerCall.tokens,
        limits.voice.recapSmsPerCall.window
      );
    } catch (err) {
      // Same fail-open reasoning as the limiter above.
      console.error("[fenwright] voice recap SMS limiter unavailable:", errMeta(err));
    }
    if (!recapLimited.success) {
      return speakable(
        "I have sent you a text on this call already. Is there anything else I can help you with?"
      );
    }
  }

  try {
    const { result } = await runTool(params.tool, callId, payload.arguments);
    return NextResponse.json({ result });
  } catch (err) {
    console.error("[fenwright] voice tool route failed:", errMeta(err));
    return NextResponse.json(
      { result: "Something went wrong on my side. Can I take your number?" },
      { status: 200 }
    );
  }
}

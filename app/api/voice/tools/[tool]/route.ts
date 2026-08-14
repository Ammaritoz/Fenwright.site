import { NextRequest, NextResponse } from "next/server";
import { verifyVoiceRequest } from "@/lib/voice/auth";
import { runTool } from "@/lib/voice/tools";
import { rateLimit } from "@/lib/ratelimit";
import { errMeta } from "@/lib/log";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

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
    return NextResponse.json(
      { result: "I am having trouble on my side. Let me take your number instead." },
      { status: 200 }
    );
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

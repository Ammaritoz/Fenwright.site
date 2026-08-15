import { NextRequest, NextResponse } from "next/server";
import { buildToolCallsResponse, parseToolCallsMessage, verifyVapiSecret } from "@/lib/voice/vapi";
import { runTool } from "@/lib/voice/tools";
import { rateLimit } from "@/lib/ratelimit";
import { limits } from "@/config/limits";
import { errMeta } from "@/lib/log";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Tool calls from Vapi.
 *
 * Vapi posts every tool call for an assistant to this one URL, batched: a
 * single POST can carry several toolCallList entries if the model invoked
 * more than one tool in a turn. There is no per-tool routing to do here, and
 * runTool never throws, so every entry in the batch gets its own result even
 * if one of them failed.
 *
 * Authenticated by a static shared secret Vapi echoes back on a header
 * (lib/voice/vapi.ts), not by lib/voice/auth.ts's HMAC scheme: Vapi does not
 * compute a per-request signature the way that module expects. The raw body
 * text is read first purely for parity with the rest of this route's error
 * handling; the secret check itself only needs the header.
 */
export async function POST(req: NextRequest) {
  let rawBody: string;
  try {
    rawBody = await req.text();
  } catch (err) {
    // The body never fully arrived, so this request cannot be verified. It is
    // not authenticated, so it must not get the speakable-200 treatment
    // reserved below for calls that already passed the secret check.
    console.error("[fenwright] voice tool body read failed:", errMeta(err));
    return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  }

  const verified = verifyVapiSecret(req.headers);
  if (!verified.ok) {
    console.warn("[fenwright] voice tool rejected:", verified.reason);
    return NextResponse.json({ error: "Unauthorised." }, { status: 401 });
  }

  let payload: unknown;
  try {
    payload = JSON.parse(rawBody);
  } catch {
    return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  }

  const parsed = parseToolCallsMessage(payload);
  if (!parsed) {
    // Authenticated but not a shape we recognise: there is no tool call to
    // apologise for, so this is a 4xx rather than a speakable 200, per the
    // ruling recorded in the plan's Global Constraints.
    return NextResponse.json({ error: "Unrecognised payload." }, { status: 400 });
  }
  const { callId, calls } = parsed;

  // A hostile or looping call must not fan out into unlimited SMS or bookings.
  // One check per request covers the whole batch, same budget as before.
  let limited: { success: boolean } = { success: true };
  try {
    limited = await rateLimit("voice-tool", callId, 40, "10 m");
  } catch (err) {
    // The request is already authenticated, and rate limiting is a secondary
    // guard against runaway loops rather than the security boundary. A limiter
    // outage must not become dead air on a live call, so fail open and log.
    console.error("[fenwright] voice rate limiter unavailable:", errMeta(err));
  }
  if (!limited.success) {
    return NextResponse.json(
      buildToolCallsResponse(
        calls.map((c) => ({
          toolCallId: c.toolCallId,
          name: c.name,
          result: "I am having trouble on my side. Let me take your number instead.",
        }))
      ),
      { status: 200 }
    );
  }

  const results = await Promise.all(
    calls.map(async (call) => {
      // send_recap_sms is the fan-out risk. The limiter above is one budget of
      // 40 shared across all tools in the batch, so a single signed call could
      // spend it texting 40 different numbers. Its own budget is much tighter.
      //
      // This one correctly gates the tool rather than the send: send_recap_sms
      // exists only to put a text on the wire, so refusing it costs nothing
      // else. The global daily spend cap deliberately lives lower down, in
      // trySms, so an exhausted budget costs a courtesy text and never an
      // appointment.
      if (call.name === "send_recap_sms") {
        let recapLimited: { success: boolean } = { success: true };
        try {
          recapLimited = await rateLimit(
            "voice-recap-sms",
            callId,
            limits.voice.recapSmsPerCall.tokens,
            limits.voice.recapSmsPerCall.window
          );
        } catch (err) {
          console.error("[fenwright] voice recap SMS limiter unavailable:", errMeta(err));
        }
        if (!recapLimited.success) {
          return {
            toolCallId: call.toolCallId,
            name: call.name,
            result:
              "I have sent you a text on this call already. Is there anything else I can help you with?",
          };
        }
      }

      try {
        const { result } = await runTool(call.name, callId, call.parameters);
        return { toolCallId: call.toolCallId, name: call.name, result };
      } catch (err) {
        // runTool does not throw by design; this is defence in depth so one
        // unexpected failure in a batch does not drop the other results.
        console.error("[fenwright] voice tool route failed:", call.name, errMeta(err));
        return {
          toolCallId: call.toolCallId,
          name: call.name,
          result: "Something went wrong on my side. Can I take your number?",
        };
      }
    })
  );

  return NextResponse.json(buildToolCallsResponse(results));
}

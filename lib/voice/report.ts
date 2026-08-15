import type { CallOutcome, CallRecord } from "@/lib/voice/calls";

/**
 * Map a platform end-of-call report onto our own CallRecord.
 *
 * Kept separate from the route so the mapping is unit-testable and so a change
 * to the platform's payload shape touches exactly one file.
 */
export function toCallRecord(payload: unknown): CallRecord | null {
  const message = (payload as { message?: Record<string, any> })?.message;
  if (!message || message.type !== "end-of-call-report") return null;

  const call = message.call as Record<string, any> | undefined;
  const callId = call?.id;
  if (typeof callId !== "string" || !callId) return null;

  const startedAt: string = message.startedAt ?? new Date().toISOString();
  const endedAt: string = message.endedAt ?? startedAt;
  // startedAt/endedAt are only defaulted with ??, so a non-nullish but
  // non-ISO value (epoch millis, 0, false) reaches Date.parse unguarded and
  // yields NaN, which Math.max would propagate silently. Fall back to the
  // same "absent date defaults to 0" behaviour rather than invent a new
  // sentinel.
  const startedMs = Date.parse(startedAt);
  const endedMs = Date.parse(endedAt);
  const durationSeconds =
    Number.isFinite(startedMs) && Number.isFinite(endedMs)
      ? Math.max(0, Math.round((endedMs - startedMs) / 1000))
      : 0;

  const endedReason: string = message.endedReason ?? "";
  const outcome = outcomeFor(endedReason);

  return {
    callId,
    direction: call?.type === "outboundPhoneCall" ? "outbound" : "inbound",
    personaId: message.assistant?.metadata?.personaId ?? "unknown",
    fromNumber: call?.customer?.number ?? "",
    toNumber: call?.phoneNumber?.number ?? "",
    startedAt,
    durationSeconds,
    outcome,
    booked: message.analysis?.successEvaluation === "true",
    escalated: outcome === "transferred",
    summary: message.analysis?.summary,
    // Vapi moved recording URLs under artifact.recording; the flat
    // message.recordingUrl this originally read no longer exists on the
    // platform's end-of-call-report payload. stereoUrl carries both channels;
    // mono.combinedUrl is the fallback for older recordings.
    recordingUrl: message.artifact?.recording?.stereoUrl ?? message.artifact?.recording?.mono?.combinedUrl,
    platformCostUsd: typeof message.cost === "number" ? message.cost : undefined,
  };
}

function outcomeFor(endedReason: string): CallOutcome {
  if (endedReason.includes("forwarded")) return "transferred";
  if (endedReason.includes("voicemail")) return "voicemail";
  if (endedReason.includes("error") || endedReason.includes("failed")) return "failed";
  if (endedReason.includes("no-answer") || endedReason.includes("customer-did-not"))
    return "abandoned";
  return "answered";
}

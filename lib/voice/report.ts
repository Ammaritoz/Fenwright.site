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
  const durationSeconds = Math.max(
    0,
    Math.round((Date.parse(endedAt) - Date.parse(startedAt)) / 1000)
  );

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
    recordingUrl: message.recordingUrl,
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

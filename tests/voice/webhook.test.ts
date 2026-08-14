import { describe, expect, it } from "vitest";
import { toCallRecord } from "@/lib/voice/report";

const report = {
  message: {
    type: "end-of-call-report",
    call: {
      id: "call_abc",
      type: "inboundPhoneCall",
      customer: { number: "+353833378541" },
      phoneNumber: { number: "+353111111111" },
    },
    startedAt: "2026-09-01T09:00:00.000Z",
    endedAt: "2026-09-01T09:02:12.000Z",
    endedReason: "customer-ended-call",
    cost: 0.31,
    assistant: { metadata: { personaId: "electrician" } },
    analysis: { summary: "Booked a fault-finding visit", successEvaluation: "true" },
    recordingUrl: "https://example.test/rec.mp3",
  },
};

describe("toCallRecord", () => {
  it("maps a well-formed end-of-call report", () => {
    const record = toCallRecord(report)!;
    expect(record.callId).toBe("call_abc");
    expect(record.direction).toBe("inbound");
    expect(record.personaId).toBe("electrician");
    expect(record.durationSeconds).toBe(132);
    expect(record.platformCostUsd).toBe(0.31);
  });

  it("returns null for a report with no call id", () => {
    expect(toCallRecord({ message: { type: "end-of-call-report" } })).toBeNull();
  });

  it("returns null for a different message type", () => {
    expect(toCallRecord({ message: { type: "status-update" } })).toBeNull();
  });

  it("marks a transfer as escalated", () => {
    const transferred = structuredClone(report);
    transferred.message.endedReason = "assistant-forwarded-call";
    const record = toCallRecord(transferred)!;
    expect(record.escalated).toBe(true);
    expect(record.outcome).toBe("transferred");
  });

  it("falls back to a safe outcome when the reason is unknown", () => {
    const odd = structuredClone(report);
    odd.message.endedReason = "something-new-from-the-platform";
    expect(toCallRecord(odd)!.outcome).toBe("answered");
  });

  it("falls back to a zero duration rather than NaN when endedAt is unparsable", () => {
    const malformed = structuredClone(report);
    malformed.message.endedAt = "not-a-date";
    expect(toCallRecord(malformed)!.durationSeconds).toBe(0);
  });

  it("falls back to a zero duration rather than NaN when startedAt is not an ISO string", () => {
    const malformed = structuredClone(report) as { message: Record<string, unknown> };
    malformed.message.startedAt = 1756717200000;
    expect(toCallRecord(malformed)!.durationSeconds).toBe(0);
  });

  it("still computes the real duration for a well-formed report", () => {
    // Pinned separately from the malformed-input cases above so a guard that
    // always returns 0 cannot pass this whole file.
    expect(toCallRecord(report)!.durationSeconds).toBe(132);
  });
});

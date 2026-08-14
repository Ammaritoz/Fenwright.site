import { describe, expect, it } from "vitest";
import { buildCallFields, logCall } from "@/lib/voice/calls";

describe("buildCallFields", () => {
  const base = {
    callId: "call_123",
    direction: "inbound" as const,
    personaId: "electrician",
    fromNumber: "+353833378541",
    toNumber: "+353111111111",
    startedAt: "2026-09-01T09:00:00.000Z",
    durationSeconds: 132,
    outcome: "booked" as const,
    booked: true,
    escalated: false,
    summary: "Booked a fault-finding visit",
  };

  it("maps every field to its Airtable column", () => {
    const fields = buildCallFields(base);
    expect(fields.CallId).toBe("call_123");
    expect(fields.Outcome).toBe("booked");
    expect(fields.Booked).toBe(true);
    expect(fields.DurationSeconds).toBe(132);
  });

  it("neutralises spreadsheet formula injection in free text", () => {
    const fields = buildCallFields({ ...base, summary: "=cmd|'/c calc'!A1" });
    expect(String(fields.Summary).startsWith("'")).toBe(true);
  });

  it("omits absent optional fields rather than writing empty strings", () => {
    const fields = buildCallFields(base);
    expect(fields).not.toHaveProperty("RecordingUrl");
  });

  it("flags a call for review when it was escalated", () => {
    const fields = buildCallFields({ ...base, escalated: true });
    expect(fields.ReviewFlag).toBe(true);
  });

  it("flags a call for review when it failed", () => {
    const fields = buildCallFields({ ...base, outcome: "failed" });
    expect(fields.ReviewFlag).toBe(true);
  });

  it("does not flag an ordinary successful call", () => {
    expect(buildCallFields(base).ReviewFlag).toBe(false);
  });

  it("flags a call for review when it was abandoned", () => {
    const fields = buildCallFields({ ...base, outcome: "abandoned" });
    expect(fields.ReviewFlag).toBe(true);
  });

  it("applies deFormula to fields other than Summary", () => {
    const fields = buildCallFields({ ...base, fromNumber: "=IMPORTXML()" });
    expect(String(fields.FromNumber).startsWith("'")).toBe(true);
  });
});

describe("logCall", () => {
  it("does not throw when Airtable is unconfigured", async () => {
    const record = {
      callId: "call_123",
      direction: "inbound" as const,
      personaId: "electrician",
      fromNumber: "+353833378541",
      toNumber: "+353111111111",
      startedAt: "2026-09-01T09:00:00.000Z",
      durationSeconds: 132,
      outcome: "booked" as const,
      booked: true,
      escalated: false,
    };

    await expect(logCall(record)).resolves.toBeUndefined();
  });
});

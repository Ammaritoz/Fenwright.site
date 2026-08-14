import { afterEach, describe, expect, it, vi } from "vitest";
import { runTool } from "@/lib/voice/tools";

vi.mock("@/lib/voice/calcom", () => ({
  getAvailability: vi.fn().mockResolvedValue([
    { startIso: "2026-09-01T09:00:00.000Z", spoken: "Tuesday the 1st of September at 10am" },
  ]),
  createBooking: vi.fn().mockResolvedValue({ ok: true, ref: "abc123" }),
  spokenTime: (iso: string) => `spoken(${iso})`,
}));
vi.mock("@/lib/airtable", () => ({ logLead: vi.fn().mockResolvedValue(undefined) }));
vi.mock("@/lib/twilio", () => ({
  sendSms: vi.fn().mockResolvedValue(undefined),
  twilioConfigured: () => true,
}));

afterEach(() => vi.clearAllMocks());

const uniqueCall = () => `call_${Math.random()}`;

describe("runTool", () => {
  it("returns spoken availability", async () => {
    const res = await runTool("check_availability", uniqueCall(), {
      personaId: "electrician",
      partOfDay: "any",
    });
    expect(res.result).toContain("Tuesday the 1st of September at 10am");
  });

  it("rejects an unknown tool without throwing", async () => {
    const res = await runTool("delete_everything", uniqueCall(), {});
    expect(res.result).toMatch(/could not/i);
  });

  it("rejects invalid arguments with something speakable", async () => {
    const res = await runTool("book_appointment", uniqueCall(), {
      personaId: "electrician",
      slotStart: "next Tuesday",
      name: "Bob",
      phone: "0833378541",
    });
    expect(res.result).toMatch(/did not work|could not/i);
  });

  it("books an appointment and confirms it in words", async () => {
    const res = await runTool("book_appointment", uniqueCall(), {
      personaId: "electrician",
      slotStart: "2026-09-01T09:00:00.000Z",
      name: "Bob",
      phone: "+353833378541",
    });
    expect(res.result).toMatch(/booked/i);
  });

  it("does not book twice for a repeated identical call", async () => {
    const { createBooking } = await import("@/lib/voice/calcom");
    const callId = uniqueCall();
    const args = {
      personaId: "electrician",
      slotStart: "2026-09-01T09:00:00.000Z",
      name: "Bob",
      phone: "+353833378541",
    };
    await runTool("book_appointment", callId, args);
    await runTool("book_appointment", callId, args);
    expect(vi.mocked(createBooking)).toHaveBeenCalledTimes(1);
  });

  it("captures a lead", async () => {
    const { logLead } = await import("@/lib/airtable");
    const res = await runTool("capture_lead", uniqueCall(), {
      personaId: "electrician",
      name: "Bob",
      phone: "+353833378541",
      intent: "new_job",
      summary: "Rewire quote",
      urgency: "routine",
    });
    expect(vi.mocked(logLead)).toHaveBeenCalledOnce();
    expect(res.result).toMatch(/have (your|those) details|taken/i);
  });

  it("sends a recap SMS and confirms it in words", async () => {
    const { sendSms } = await import("@/lib/twilio");
    const res = await runTool("send_recap_sms", uniqueCall(), {
      personaId: "electrician",
      phone: "+353833378541",
      kind: "callback",
      name: "Bob",
    });
    expect(vi.mocked(sendSms)).toHaveBeenCalledOnce();
    expect(res.result).toMatch(/sent|text/i);
  });

  it("does not send a recap SMS twice for a repeated identical call", async () => {
    const { sendSms } = await import("@/lib/twilio");
    const callId = uniqueCall();
    const args = {
      personaId: "electrician",
      phone: "+353833378541",
      kind: "callback" as const,
      name: "Bob",
    };
    await runTool("send_recap_sms", callId, args);
    await runTool("send_recap_sms", callId, args);
    expect(vi.mocked(sendSms)).toHaveBeenCalledTimes(1);
  });
});

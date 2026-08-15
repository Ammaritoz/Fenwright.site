import { afterEach, describe, expect, it, vi } from "vitest";
import { runTool } from "@/lib/voice/tools";
import { limits } from "@/config/limits";

const TIMEOUT_MS = limits.voice.externalTimeoutMs;

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

  it("retries booking after a failed attempt instead of falsely reporting it as already booked", async () => {
    const { createBooking } = await import("@/lib/voice/calcom");
    const callId = uniqueCall();
    const args = {
      personaId: "electrician",
      slotStart: "2026-09-01T09:00:00.000Z",
      name: "Bob",
      phone: "+353833378541",
    };
    vi.mocked(createBooking).mockResolvedValueOnce({ ok: false, reason: "test_failure" });

    const first = await runTool("book_appointment", callId, args);
    expect(first.result).not.toMatch(/already booked/i);

    const second = await runTool("book_appointment", callId, args);
    // "That is already booked in for you" also matches /booked/i, so that
    // assertion alone is satisfied by the bug's own false message. Pin the
    // absence of the false-positive wording explicitly.
    expect(second.result).toMatch(/booked/i);
    expect(second.result).not.toMatch(/already/i);

    // The regression this guards: a claim-before-act key must be released on
    // failure, or the second call never reaches createBooking at all.
    expect(vi.mocked(createBooking)).toHaveBeenCalledTimes(2);
  });

  it("confirms a booking without promising a text when the SMS send fails", async () => {
    const { sendSms } = await import("@/lib/twilio");
    vi.mocked(sendSms).mockRejectedValueOnce(new Error("network blip"));

    const res = await runTool("book_appointment", uniqueCall(), {
      personaId: "electrician",
      slotStart: "2026-09-01T09:00:00.000Z",
      name: "Bob",
      phone: "+353833378541",
    });

    // The booking itself succeeded (createBooking resolved ok), so the caller
    // must be told they are booked in.
    expect(res.result).toMatch(/booked/i);
    // But trySms failed, so the result must not promise a text that was
    // never sent.
    expect(res.result).not.toMatch(/i will text you a confirmation/i);
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

  // Plan Global Constraint: 8 seconds, because a live conversation is waiting.
  // The Twilio SDK takes no AbortSignal and defaults to roughly 30 seconds, so
  // a hung send must still resolve to trySms's `false` sentinel in time for the
  // assistant to say something.
  it("gives up on a hanging SMS send rather than holding the call open", async () => {
    const { sendSms } = await import("@/lib/twilio");
    vi.mocked(sendSms).mockImplementationOnce(() => new Promise<void>(() => {}));

    vi.useFakeTimers();
    try {
      const pending = runTool("send_recap_sms", uniqueCall(), {
        personaId: "electrician",
        phone: "+353833378541",
        kind: "callback",
        name: "Bob",
      });
      // Settle the idempotency claim first so the timeout timer is registered
      // before the clock moves.
      await vi.advanceTimersByTimeAsync(0);
      await vi.advanceTimersByTimeAsync(TIMEOUT_MS + 1);

      const res = await pending;
      expect(res.result).toMatch(/could not/i);
      expect(res.result).not.toMatch(/i have sent that/i);
    } finally {
      vi.useRealTimers();
    }
  });

  it("retries a recap SMS after a failed send instead of falsely reporting it as already sent", async () => {
    const { sendSms } = await import("@/lib/twilio");
    const callId = uniqueCall();
    const args = {
      personaId: "electrician",
      phone: "+353833378541",
      kind: "callback" as const,
      name: "Bob",
    };
    vi.mocked(sendSms).mockRejectedValueOnce(new Error("network blip"));

    const first = await runTool("send_recap_sms", callId, args);
    expect(first.result).toMatch(/could not/i);

    const second = await runTool("send_recap_sms", callId, args);
    // "That text is already on its way" also matches /sent|text/i, so that
    // assertion alone is satisfied by the bug's own false message. Pin the
    // absence of the false-positive wording explicitly.
    expect(second.result).toMatch(/sent|text/i);
    expect(second.result).not.toMatch(/already/i);

    // Same regression as booking: the failure must release the claim so the
    // retry genuinely attempts the send again.
    expect(vi.mocked(sendSms)).toHaveBeenCalledTimes(2);
  });
});

import { afterEach, describe, expect, it, vi } from "vitest";
import { runTool } from "@/lib/voice/tools";
import { incrementDailyCounter } from "@/lib/ratelimit";
import { limits } from "@/config/limits";

const TIMEOUT_MS = limits.voice.externalTimeoutMs;
const OVER_CAP = limits.voice.smsDailyCapDefault + 1;

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
vi.mock("@/lib/ratelimit", () => ({
  incrementDailyCounter: vi.fn().mockResolvedValue(1),
}));

afterEach(() => {
  vi.clearAllMocks();
  vi.mocked(incrementDailyCounter).mockResolvedValue(1);
});

const uniqueCall = () => `call_${Math.random()}`;

describe("runTool", () => {
  it("returns spoken availability", async () => {
    const res = await runTool("check_availability", uniqueCall(), {
      personaId: "electrician",
      partOfDay: "any",
    });
    expect(res.result).toContain("Tuesday the 1st of September at 10am");
  });

  // Regression: preferredDate was validated by the schema and then dropped, so
  // a caller asking for Thursday was read the next three slots from today.
  it("searches from the caller's preferred date rather than from today", async () => {
    const { getAvailability } = await import("@/lib/voice/calcom");
    await runTool("check_availability", uniqueCall(), {
      personaId: "electrician",
      preferredDate: "2026-09-03T00:00:00.000Z",
      partOfDay: "morning",
    });
    expect(vi.mocked(getAvailability)).toHaveBeenCalledWith(
      expect.objectContaining({
        fromIso: "2026-09-03T00:00:00.000Z",
        partOfDay: "morning",
      })
    );
  });

  it("leaves fromIso unset when the caller named no date", async () => {
    const { getAvailability } = await import("@/lib/voice/calcom");
    await runTool("check_availability", uniqueCall(), {
      personaId: "electrician",
      partOfDay: "any",
    });
    expect(vi.mocked(getAvailability)).toHaveBeenCalledWith(
      expect.objectContaining({ fromIso: undefined })
    );
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

  /**
   * The global SMS budget gates the send, not the tool. An earlier version of
   * this fix wave capped it at the route, which meant an exhausted budget
   * refused the booking as well as the text. That inverts the value: the
   * booking is the product, the text is a nicety, and a business would far
   * rather have the appointment with no confirmation text than neither.
   */
  describe("at the global daily SMS cap", () => {
    it("still books the appointment", async () => {
      const { createBooking } = await import("@/lib/voice/calcom");
      vi.mocked(incrementDailyCounter).mockResolvedValueOnce(OVER_CAP);

      const res = await runTool("book_appointment", uniqueCall(), {
        personaId: "electrician",
        slotStart: "2026-09-01T09:00:00.000Z",
        name: "Bob",
        phone: "+353833378541",
      });

      // The booking is the product. It must survive an exhausted SMS budget.
      expect(vi.mocked(createBooking)).toHaveBeenCalledOnce();
      expect(res.result).toMatch(/booked/i);
      // But it must not promise a text that the cap prevented.
      expect(res.result).toMatch(/could not get a text away/i);
    });

    it("sends no text at all rather than spending past the budget", async () => {
      const { sendSms } = await import("@/lib/twilio");
      vi.mocked(incrementDailyCounter).mockResolvedValueOnce(OVER_CAP);

      await runTool("book_appointment", uniqueCall(), {
        personaId: "electrician",
        slotStart: "2026-09-01T09:00:00.000Z",
        name: "Bob",
        phone: "+353833378541",
      });

      expect(vi.mocked(sendSms)).not.toHaveBeenCalled();
    });

    it("answers send_recap_sms with the no-text message and sends nothing", async () => {
      const { sendSms } = await import("@/lib/twilio");
      vi.mocked(incrementDailyCounter).mockResolvedValueOnce(OVER_CAP);

      const res = await runTool("send_recap_sms", uniqueCall(), {
        personaId: "electrician",
        phone: "+353833378541",
        kind: "callback",
        name: "Bob",
      });

      expect(vi.mocked(sendSms)).not.toHaveBeenCalled();
      expect(res.result).toMatch(/could not get a text away/i);
      expect(res.result).not.toMatch(/i have sent that/i);
    });
  });

  it("counts a real send attempt against the daily budget, not a tool dispatch", async () => {
    const { sendSms } = await import("@/lib/twilio");
    await runTool("send_recap_sms", uniqueCall(), {
      personaId: "electrician",
      phone: "+353833378541",
      kind: "callback",
      name: "Bob",
    });

    expect(vi.mocked(incrementDailyCounter)).toHaveBeenCalledWith("voice-sms");
    // Under the cap the normal path is untouched.
    expect(vi.mocked(sendSms)).toHaveBeenCalledOnce();
  });

  it("does not touch the daily budget for a tool that sends no text", async () => {
    await runTool("check_availability", uniqueCall(), {
      personaId: "electrician",
      partOfDay: "any",
    });

    expect(vi.mocked(incrementDailyCounter)).not.toHaveBeenCalled();
  });

  it("fails open and still sends when the daily counter throws", async () => {
    const { sendSms } = await import("@/lib/twilio");
    vi.mocked(incrementDailyCounter).mockRejectedValueOnce(new Error("upstash blip"));

    const res = await runTool("send_recap_sms", uniqueCall(), {
      personaId: "electrician",
      phone: "+353833378541",
      kind: "callback",
      name: "Bob",
    });

    // A counter outage is a spend backstop failing, not the security boundary.
    expect(vi.mocked(sendSms)).toHaveBeenCalledOnce();
    expect(res.result).toMatch(/sent/i);
  });

  // Spec section 7: Leads gains the voice source values plus a CallId link.
  // The source values landed in an earlier task, the link did not, so a lead
  // could only be matched to its call by phone number and timestamp.
  it("links a captured lead back to the call it came from", async () => {
    const { logLead } = await import("@/lib/airtable");
    const callId = uniqueCall();
    await runTool("capture_lead", callId, {
      personaId: "electrician",
      name: "Bob",
      phone: "+353833378541",
      intent: "new_job",
      summary: "Rewire quote",
      urgency: "routine",
    });
    expect(vi.mocked(logLead)).toHaveBeenCalledWith(expect.objectContaining({ callId }));
  });

  it("links a booked lead back to the call it came from", async () => {
    const { logLead } = await import("@/lib/airtable");
    const callId = uniqueCall();
    await runTool("book_appointment", callId, {
      personaId: "electrician",
      slotStart: "2026-09-01T09:00:00.000Z",
      name: "Bob",
      phone: "+353833378541",
    });
    expect(vi.mocked(logLead)).toHaveBeenCalledWith(expect.objectContaining({ callId }));
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

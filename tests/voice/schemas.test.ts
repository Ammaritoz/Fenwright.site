import { describe, expect, it } from "vitest";
import { bookAppointmentSchema, captureLeadSchema, checkAvailabilitySchema, sendRecapSchema } from "@/lib/voice/schemas";

describe("bookAppointmentSchema", () => {
  const valid = {
    personaId: "electrician",
    slotStart: "2026-09-01T09:00:00.000Z",
    name: "Bob Fenwick",
    phone: "+353833378541",
    notes: "Fuse board tripping",
  };

  it("accepts a valid booking", () => {
    expect(bookAppointmentSchema.safeParse(valid).success).toBe(true);
  });

  it("rejects a non-E.164 phone", () => {
    const res = bookAppointmentSchema.safeParse({ ...valid, phone: "0833378541" });
    expect(res.success).toBe(false);
  });

  it("rejects an unknown persona", () => {
    const res = bookAppointmentSchema.safeParse({ ...valid, personaId: "nope" });
    expect(res.success).toBe(false);
  });

  it("rejects a non-ISO slot", () => {
    const res = bookAppointmentSchema.safeParse({ ...valid, slotStart: "next Tuesday" });
    expect(res.success).toBe(false);
  });

  it("trims and caps an over-long name", () => {
    const res = bookAppointmentSchema.safeParse({ ...valid, name: "x".repeat(200) });
    expect(res.success).toBe(false);
  });
});

describe("checkAvailabilitySchema", () => {
  it("accepts an ISO preferredDate", () => {
    const res = checkAvailabilitySchema.safeParse({
      personaId: "electrician",
      preferredDate: "2026-09-03T00:00:00.000Z",
      partOfDay: "morning",
    });
    expect(res.success).toBe(true);
  });

  // preferredDate is deliberately not restricted to ISO here: the model is
  // only ever asked to pass through the caller's own word for the day
  // ("tomorrow", "thursday"), and checkAvailability resolves that against the
  // live clock via resolveRelativeDay. Real rejection only happens for
  // something absurdly long, which could not be either a day word or a date.
  it("accepts the caller's own word for the day", () => {
    const res = checkAvailabilitySchema.safeParse({
      personaId: "electrician",
      preferredDate: "thursday",
      partOfDay: "morning",
    });
    expect(res.success).toBe(true);
  });

  it("rejects an unreasonably long preferredDate", () => {
    const res = checkAvailabilitySchema.safeParse({
      personaId: "electrician",
      preferredDate: "x".repeat(50),
      partOfDay: "morning",
    });
    expect(res.success).toBe(false);
  });

  it("still accepts an omitted preferredDate", () => {
    const res = checkAvailabilitySchema.safeParse({ personaId: "electrician" });
    expect(res.success).toBe(true);
  });
});

describe("captureLeadSchema", () => {
  it("rejects an unknown urgency", () => {
    const res = captureLeadSchema.safeParse({
      personaId: "electrician",
      name: "Bob",
      phone: "+353833378541",
      intent: "new_job",
      summary: "Needs a rewire quote",
      urgency: "immediately",
    });
    expect(res.success).toBe(false);
  });

  it("accepts a valid lead", () => {
    const res = captureLeadSchema.safeParse({
      personaId: "electrician",
      name: "Bob",
      phone: "+353833378541",
      intent: "new_job",
      summary: "Needs a rewire quote",
      urgency: "soon",
    });
    expect(res.success).toBe(true);
  });
});

describe("checkAvailabilitySchema", () => {
  it("defaults partOfDay to any when omitted", () => {
    const res = checkAvailabilitySchema.safeParse({ personaId: "electrician" });
    expect(res.success).toBe(true);
    if (res.success) expect(res.data.partOfDay).toBe("any");
  });

  it("rejects an unknown partOfDay", () => {
    const res = checkAvailabilitySchema.safeParse({
      personaId: "electrician",
      partOfDay: "midnight",
    });
    expect(res.success).toBe(false);
  });

  it("rejects an unknown persona", () => {
    expect(checkAvailabilitySchema.safeParse({ personaId: "nope" }).success).toBe(false);
  });
});

describe("sendRecapSchema", () => {
  const valid = {
    personaId: "electrician",
    phone: "+353833378541",
    kind: "booking",
    name: "Bob Fenwick",
    spokenTime: "Tuesday the 1st of September at 10am",
  };

  it("accepts a valid booking recap", () => {
    expect(sendRecapSchema.safeParse(valid).success).toBe(true);
  });

  it("rejects a non-E.164 phone", () => {
    expect(sendRecapSchema.safeParse({ ...valid, phone: "0833378541" }).success).toBe(false);
  });

  it("rejects an unknown kind", () => {
    expect(sendRecapSchema.safeParse({ ...valid, kind: "voicemail" }).success).toBe(false);
  });
});

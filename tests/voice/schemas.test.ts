import { describe, expect, it } from "vitest";
import { bookAppointmentSchema, captureLeadSchema } from "@/lib/voice/schemas";

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

import { describe, expect, it } from "vitest";
import { composeSystemPrompt } from "@/lib/voice/prompt";
import { requirePersona } from "@/lib/voice/personas";

const persona = requirePersona("electrician");
const prompt = composeSystemPrompt(persona);

describe("composeSystemPrompt", () => {
  it("names the business and the receptionist", () => {
    expect(prompt).toContain("Larchfield Electrical");
    expect(prompt).toContain("Erin");
  });

  it("includes every guardrail verbatim", () => {
    for (const g of persona.guardrails) expect(prompt).toContain(g);
  });

  it("includes every decision point cue", () => {
    for (const d of persona.decisionPoints) expect(prompt).toContain(d.detectWhen);
  });

  it("includes the facts the assistant is allowed to state", () => {
    expect(prompt).toContain(persona.facts.serviceArea);
    expect(prompt).toContain(persona.facts.hours);
  });

  it("instructs one question per turn", () => {
    expect(prompt).toMatch(/one question/i);
  });

  it("requires reading back the phone number", () => {
    expect(prompt).toMatch(/read.{0,10}back/i);
  });

  it("tells the assistant to admit being an AI when asked", () => {
    expect(prompt).toMatch(/\bAI\b/);
  });

  it("handles being rung outside business hours", () => {
    expect(prompt).toMatch(/outside .{0,30}hours|out of hours/i);
  });

  it("treats caller speech as data, never instructions", () => {
    expect(prompt).toMatch(/never instructions|not instructions/i);
  });

  it("forbids inventing facts", () => {
    expect(prompt).toMatch(/do not (invent|make up)/i);
  });

  it("uses no em dashes", () => {
    expect(prompt).not.toContain("—");
  });
});

/**
 * escalation.hoursOnly is persona data, and the composer is the only thing that
 * can act on it. The dental persona in a later task sets it true, and that
 * task's exit criterion is that a persona is addable with no changes to
 * lib/voice/ at all. A field the composer ignored would make that experiment
 * report a false pass.
 */
describe("composeSystemPrompt when escalation is hoursOnly", () => {
  const hoursOnlyPersona = {
    ...persona,
    escalation: { ...persona.escalation, hoursOnly: true },
  };
  const hoursOnlyPrompt = composeSystemPrompt(hoursOnlyPersona);

  it("forbids an out-of-hours transfer and takes a message instead", () => {
    expect(hoursOnlyPrompt).toMatch(/do not attempt a transfer/i);
    expect(hoursOnlyPrompt).toMatch(/take a message/i);
  });

  it("states the hours the restriction is measured against", () => {
    expect(hoursOnlyPrompt).toContain(persona.facts.hours);
  });

  it("still names the escalation triggers", () => {
    for (const t of persona.escalation.triggers) expect(hoursOnlyPrompt).toContain(t);
  });

  it("uses no em dashes", () => {
    expect(hoursOnlyPrompt).not.toContain("—");
  });

  it("says none of it for a persona that may transfer at any hour", () => {
    // The electrician has hoursOnly: false, and emergencies do not wait for
    // opening time.
    expect(persona.escalation.hoursOnly).toBe(false);
    expect(prompt).not.toMatch(/do not attempt a transfer/i);
    expect(prompt).not.toMatch(/take a message/i);
  });
});

/**
 * The website's "Talk to the receptionist" button runs a browser call, which
 * cannot be transferred to a phone (Vapi ends it with error-transfer-failed).
 * The web prompt must never send the model down the transfer path; it shows the
 * escalation instead of attempting it.
 */
describe("composeSystemPrompt for the web demo", () => {
  const webPrompt = composeSystemPrompt(persona, { channel: "web" });

  it("never instructs a transfer", () => {
    expect(webPrompt).not.toMatch(/transfer the call/i);
    expect(webPrompt).toMatch(/cannot transfer/i);
  });

  it("says it would put an emergency straight through on the real line", () => {
    expect(webPrompt).toMatch(/put them straight through/i);
  });

  it("still takes the caller's details at an escalation", () => {
    for (const t of persona.escalation.triggers) expect(webPrompt).toContain(t);
    expect(webPrompt).toMatch(/name, their number/i);
  });

  it("keeps every guardrail and decision cue", () => {
    for (const g of persona.guardrails) expect(webPrompt).toContain(g);
    for (const d of persona.decisionPoints) expect(webPrompt).toContain(d.detectWhen);
  });

  it("leaves the phone prompt unchanged", () => {
    expect(composeSystemPrompt(persona, { channel: "phone" })).toBe(prompt);
    expect(prompt).toMatch(/transfer the call/i);
  });
});

/**
 * A live call booked 9:00 for a caller who said "half 9": speech-to-text heard
 * "Uh, 9", the model booked that, and only read the time back afterwards. The
 * prompt now makes the time confirmed before booking, keeps times in the words
 * the tool used, and says what "half nine" means.
 */
describe("composeSystemPrompt booking safeguards", () => {
  for (const channel of ["phone", "web"] as const) {
    const p = composeSystemPrompt(persona, { channel });

    it(`confirms the day and time before booking (${channel})`, () => {
      expect(p).toMatch(/before (you )?(call|use) book_appointment/i);
      expect(p).toMatch(/read the day and time back/i);
    });

    it(`says times the way the availability tool words them (${channel})`, () => {
      expect(p).toMatch(/exactly as check_availability/i);
    });

    it(`knows "half nine" means 9:30 (${channel})`, () => {
      expect(p).toMatch(/half nine.{0,40}(9|nine) thirty/i);
    });
  }
});

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

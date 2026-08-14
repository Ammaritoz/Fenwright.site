import { describe, expect, it } from "vitest";
import { composeSystemPrompt } from "@/lib/voice/prompt";
import { requirePersona } from "@/lib/voice/personas";

const persona = requirePersona("electrician");
const prompt = composeSystemPrompt(persona);

describe("composeSystemPrompt", () => {
  it("names the business and the receptionist", () => {
    expect(prompt).toContain("Holcroft Electrical");
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

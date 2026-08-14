import { describe, expect, it } from "vitest";
import { personas } from "@/config/personas";
import { getPersona, requirePersona, personaIds } from "@/lib/voice/personas";
import { industryIds } from "@/lib/industry";

describe("personas", () => {
  it("ships the electrician persona", () => {
    expect(getPersona("electrician")?.identity.businessName).toBe("Holcroft Electrical");
  });

  it("returns null for an unknown id", () => {
    expect(getPersona("nope")).toBeNull();
  });

  it("throws for an unknown id when required", () => {
    expect(() => requirePersona("nope")).toThrow(/unknown persona/i);
  });

  it("exposes every persona id", () => {
    expect(personaIds).toContain("electrician");
  });

  it("only uses ids that exist in the site industry list", () => {
    for (const p of personas) {
      expect(industryIds).toContain(p.id);
    }
  });

  it("gives every persona at least one goal, guardrail and decision point", () => {
    for (const p of personas) {
      expect(p.goals.length).toBeGreaterThan(0);
      expect(p.guardrails.length).toBeGreaterThan(0);
      expect(p.decisionPoints.length).toBeGreaterThan(0);
    }
  });

  it("routes every decision point to a known action", () => {
    const actions = ["book", "capture_lead", "transfer", "answer_and_close"];
    for (const p of personas) {
      for (const d of p.decisionPoints) {
        expect(actions).toContain(d.then);
      }
    }
  });
});

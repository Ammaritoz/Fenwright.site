import { describe, expect, it } from "vitest";
import { bookingRecap, callbackRecap } from "@/lib/voice/recap";
import { requirePersona } from "@/lib/voice/personas";

const persona = requirePersona("electrician");

describe("bookingRecap", () => {
  const body = bookingRecap(persona, {
    name: "Bob Fenwick",
    spokenTime: "Tuesday the 1st of September at 10am",
  });

  it("greets by first name only", () => {
    expect(body).toContain("Bob");
    expect(body).not.toContain("Fenwick");
  });

  it("names the business and the time", () => {
    expect(body).toContain("Holcroft Electrical");
    expect(body).toContain("Tuesday the 1st of September at 10am");
  });

  it("fits a single GSM-7 segment", () => {
    expect(body.length).toBeLessThanOrEqual(160);
  });

  it("contains no characters outside GSM-7", () => {
    expect(body).toBe(body.replace(/[^\x20-\x7E\n]/g, ""));
  });
});

describe("callbackRecap", () => {
  it("promises a callback without inventing a time", () => {
    const body = callbackRecap(persona, { name: "Bob" });
    expect(body).toContain("Holcroft Electrical");
    expect(body.length).toBeLessThanOrEqual(160);
  });
});

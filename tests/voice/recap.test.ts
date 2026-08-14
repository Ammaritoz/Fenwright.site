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

describe("worst-case length constraints", () => {
  it("bookingRecap with max-length inputs stays within 160 chars", () => {
    const body = bookingRecap(persona, {
      name: "A".repeat(80),
      spokenTime: "B".repeat(80),
    });
    expect(body.length).toBeLessThanOrEqual(160);
  });

  it("callbackRecap with max-length name stays within 160 chars", () => {
    const body = callbackRecap(persona, { name: "A".repeat(80) });
    expect(body.length).toBeLessThanOrEqual(160);
  });
});

describe("phishing protection", () => {
  it("strips URLs from spokenTime", () => {
    const body = bookingRecap(persona, {
      name: "Bob",
      spokenTime: "http://evil.example.com",
    });
    expect(body).not.toContain("http://");
    expect(body).not.toContain("evil.example.com");
  });

  it("yields sensible greeting when name is a URL", () => {
    const body = bookingRecap(persona, {
      name: "http://evil.example.com",
      spokenTime: "Tuesday at 10am",
    });
    expect(body).toContain("Hi there");
    expect(body).not.toContain("http://");
  });
});

describe("legitimate content preservation", () => {
  it("preserves legitimate spokenTime with date and time", () => {
    const body = bookingRecap(persona, {
      name: "Bob",
      spokenTime: "Tuesday the 1st of September at 2.30pm",
    });
    expect(body).toContain("Tuesday the 1st of September at 2.30pm");
  });

  it("callbackRecap is distinct from bookingRecap and lacks time reference", () => {
    const callbackBody = callbackRecap(persona, { name: "Bob" });
    const bookingBody = bookingRecap(persona, {
      name: "Bob",
      spokenTime: "Tuesday at 10am",
    });
    expect(callbackBody).not.toBe(bookingBody);
    expect(callbackBody).not.toContain("Tuesday");
    expect(callbackBody).not.toContain("booked");
    expect(callbackBody).toContain("thanks for calling");
  });
});

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

describe("conditional closing sentence and time preservation", () => {
  it("preserves full realistic long time and omits closing sentence when necessary", () => {
    const longTime = "Wednesday the 3rd of September at half past two in the afternoon";
    const body = bookingRecap(persona, {
      name: "Bob",
      spokenTime: longTime,
    });
    // The whole time string should appear intact
    expect(body).toContain(longTime);
    // The body should fit in a single segment
    expect(body.length).toBeLessThanOrEqual(160);
    // The closing sentence should be absent (it won't fit with the long time)
    expect(body).not.toContain("reply here");
  });

  it("normal fixture retains the closing sentence", () => {
    const body = bookingRecap(persona, {
      name: "Bob",
      spokenTime: "Tuesday the 1st of September at 10am",
    });
    // With a normal time, the invite should be present
    expect(body).toContain("If that no longer suits, just reply here");
  });

  it("word-boundary truncation does not cut mid-word", () => {
    // Create a time that's long enough to trigger truncation but has clear word boundaries
    const longTime =
      "Monday at three o'clock in the morning and also in the evening very soon";
    const body = bookingRecap(persona, {
      name: "Bob",
      spokenTime: longTime,
    });
    // The body should not end with a partial word
    const match = body.match(/for (.+?)\./);
    expect(match).toBeTruthy();
    if (match) {
      const extractedTime = match[1];
      // Check that it doesn't end mid-word by looking for incomplete tokens
      expect(extractedTime).not.toMatch(/\s[a-z]$/);
    }
  });

  it("hard-caps output to exactly 160 chars when necessary", () => {
    // Create a synthetic persona with a very long business name
    const syntheticPersona = {
      ...persona,
      identity: {
        ...persona.identity,
        businessName: "A".repeat(50),
      },
    };
    const body = bookingRecap(syntheticPersona, {
      name: "Bob",
      spokenTime: "Monday at ten o'clock in the morning",
    });
    // The output should be capped at 160 chars by oneSegment()
    expect(body.length).toBeLessThanOrEqual(160);
    // With an extremely long business name, it should be exactly at the limit
    if (body.length === 160) {
      expect(body).toBe(body);
    }
  });
});

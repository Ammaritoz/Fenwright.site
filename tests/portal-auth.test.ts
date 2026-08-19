import { beforeEach, describe, expect, it, vi } from "vitest";
import { hashPasscode, verifyPasscode } from "@/lib/portal/auth";
import {
  SESSION_MAX_AGE_SECONDS,
  sessionCookieName,
  signSession,
  verifySession,
} from "@/lib/portal/cookie";

const SECRET = "0".repeat(64);

beforeEach(() => {
  vi.stubEnv("PORTAL_COOKIE_SECRET", SECRET);
});

describe("passcode verification", () => {
  const salt = "977168e59bf35db473655c5a5f31f141";
  const hash = hashPasscode("DCUPN-VMK8D", salt);

  it("accepts the right passcode", () => {
    expect(verifyPasscode("DCUPN-VMK8D", hash, salt)).toBe(true);
  });

  it("rejects a wrong passcode", () => {
    expect(verifyPasscode("DCUPN-VMK8E", hash, salt)).toBe(false);
    expect(verifyPasscode("", hash, salt)).toBe(false);
  });

  it("rejects the right passcode under a different salt", () => {
    // Two clients choosing the same passcode must not unlock each other.
    expect(verifyPasscode("DCUPN-VMK8D", hash, "a-different-salt")).toBe(false);
  });

  it("does not throw on a malformed stored hash", () => {
    expect(verifyPasscode("anything", "not-hex", salt)).toBe(false);
  });
});

describe("session cookie", () => {
  it("uses a per-client cookie name", () => {
    expect(sessionCookieName("acme-1234")).toBe("fw_portal_acme-1234");
    expect(sessionCookieName("acme-1234")).not.toBe(sessionCookieName("other-5678"));
  });

  it("round-trips a signed session", async () => {
    const cookie = await signSession("acme-1234");
    await expect(verifySession("acme-1234", cookie)).resolves.toBe(true);
  });

  it("rejects a cookie minted for another client", async () => {
    // The whole point of scoping: unlocking one portal must not open another.
    const cookie = await signSession("acme-1234");
    await expect(verifySession("other-5678", cookie)).resolves.toBe(false);
  });

  it("rejects a tampered signature", async () => {
    const cookie = await signSession("acme-1234");
    const [expiry, sig] = cookie.split(".");
    const flipped = sig.startsWith("a") ? `b${sig.slice(1)}` : `a${sig.slice(1)}`;
    await expect(verifySession("acme-1234", `${expiry}.${flipped}`)).resolves.toBe(false);
  });

  it("rejects an extended expiry", async () => {
    // The expiry is inside the signed payload, so moving it invalidates the MAC.
    const cookie = await signSession("acme-1234");
    const sig = cookie.slice(cookie.indexOf(".") + 1);
    const future = Date.now() + SESSION_MAX_AGE_SECONDS * 10_000;
    await expect(verifySession("acme-1234", `${future}.${sig}`)).resolves.toBe(false);
  });

  it("rejects an expired cookie", async () => {
    vi.useFakeTimers();
    try {
      const cookie = await signSession("acme-1234");
      vi.setSystemTime(Date.now() + (SESSION_MAX_AGE_SECONDS + 60) * 1000);
      await expect(verifySession("acme-1234", cookie)).resolves.toBe(false);
    } finally {
      vi.useRealTimers();
    }
  });

  it("rejects missing and malformed cookies", async () => {
    await expect(verifySession("acme-1234", undefined)).resolves.toBe(false);
    await expect(verifySession("acme-1234", "")).resolves.toBe(false);
    await expect(verifySession("acme-1234", "garbage")).resolves.toBe(false);
  });

  it("rejects a cookie signed with a different secret", async () => {
    const cookie = await signSession("acme-1234");
    vi.stubEnv("PORTAL_COOKIE_SECRET", "1".repeat(64));
    await expect(verifySession("acme-1234", cookie)).resolves.toBe(false);
  });

  it("refuses to sign with a missing or weak secret", async () => {
    vi.stubEnv("PORTAL_COOKIE_SECRET", "");
    await expect(signSession("acme-1234")).rejects.toThrow(/PORTAL_COOKIE_SECRET/);
    vi.stubEnv("PORTAL_COOKIE_SECRET", "too-short");
    await expect(signSession("acme-1234")).rejects.toThrow(/32 characters/);
  });
});

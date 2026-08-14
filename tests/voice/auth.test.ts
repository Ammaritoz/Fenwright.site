import { describe, expect, it, vi } from "vitest";
import { signPayload, verifyVoiceRequest } from "@/lib/voice/auth";

const SECRET = "test-secret-do-not-use-in-production";
const NOW = 1_760_000_000_000; // fixed ms
const TS = String(Math.floor(NOW / 1000));
const BODY = JSON.stringify({ hello: "world" });

function headers(overrides: Record<string, string> = {}): Headers {
  return new Headers({
    "x-fenwright-timestamp": TS,
    "x-fenwright-signature": signPayload(TS, BODY, SECRET),
    ...overrides,
  });
}

describe("verifyVoiceRequest", () => {
  it("accepts a correctly signed, fresh request", () => {
    expect(verifyVoiceRequest(headers(), BODY, NOW)).toEqual({ ok: true });
  });

  it("rejects a tampered body", () => {
    const res = verifyVoiceRequest(headers(), JSON.stringify({ hello: "evil" }), NOW);
    expect(res).toEqual({ ok: false, reason: "bad_signature" });
  });

  it("rejects a wrong signature", () => {
    const res = verifyVoiceRequest(headers({ "x-fenwright-signature": "00" }), BODY, NOW);
    expect(res.ok).toBe(false);
  });

  it("rejects a stale timestamp", () => {
    const res = verifyVoiceRequest(headers(), BODY, NOW + 6 * 60 * 1000);
    expect(res).toEqual({ ok: false, reason: "stale_timestamp" });
  });

  it("rejects a timestamp too far in the future", () => {
    const res = verifyVoiceRequest(headers(), BODY, NOW - 6 * 60 * 1000);
    expect(res).toEqual({ ok: false, reason: "stale_timestamp" });
  });

  it("rejects a missing signature header", () => {
    const h = headers();
    h.delete("x-fenwright-signature");
    expect(verifyVoiceRequest(h, BODY, NOW)).toEqual({ ok: false, reason: "missing_headers" });
  });

  it("rejects when the secret is not configured", () => {
    vi.stubEnv("VOICE_WEBHOOK_SECRET", "");
    expect(verifyVoiceRequest(headers(), BODY, NOW)).toEqual({ ok: false, reason: "not_configured" });
  });
});

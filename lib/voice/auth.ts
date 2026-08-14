import "server-only";
import { createHmac, timingSafeEqual } from "node:crypto";

/** Requests older or newer than this are rejected, which blocks replay. */
const FRESHNESS_MS = 5 * 60 * 1000;

export const TIMESTAMP_HEADER = "x-fenwright-timestamp";
export const SIGNATURE_HEADER = "x-fenwright-signature";

/** HMAC-SHA256 over `${timestamp}.${rawBody}`, hex encoded. */
export function signPayload(timestamp: string, rawBody: string, secret: string): string {
  return createHmac("sha256", secret).update(`${timestamp}.${rawBody}`).digest("hex");
}

export type VerifyResult = { ok: true } | { ok: false; reason: string };

/**
 * Verify a signed voice webhook.
 *
 * The body must be the raw text exactly as received: re-serialising parsed JSON
 * changes key order and whitespace and will not match the signature.
 */
export function verifyVoiceRequest(
  headers: Headers,
  rawBody: string,
  nowMs: number = Date.now()
): VerifyResult {
  const secret = process.env.VOICE_WEBHOOK_SECRET;
  if (!secret) return { ok: false, reason: "not_configured" };

  const timestamp = headers.get(TIMESTAMP_HEADER);
  const signature = headers.get(SIGNATURE_HEADER);
  if (!timestamp || !signature) return { ok: false, reason: "missing_headers" };

  if (!/^\d+$/.test(timestamp)) return { ok: false, reason: "bad_timestamp" };
  const tsSeconds = Number(timestamp);
  if (Math.abs(nowMs - tsSeconds * 1000) > FRESHNESS_MS) {
    return { ok: false, reason: "stale_timestamp" };
  }

  const expected = signPayload(timestamp, rawBody, secret);
  if (!constantTimeEqual(expected, signature)) {
    return { ok: false, reason: "bad_signature" };
  }

  return { ok: true };
}

/**
 * Compare without leaking length or content through timing. Both sides are
 * hashed first so timingSafeEqual always receives equal-length buffers.
 */
function constantTimeEqual(a: string, b: string): boolean {
  const ha = createHmac("sha256", "cmp").update(a).digest();
  const hb = createHmac("sha256", "cmp").update(b).digest();
  return timingSafeEqual(ha, hb);
}

import "server-only";
import { createHash, timingSafeEqual } from "node:crypto";

/**
 * Passcode verification. Node runtime only (see lib/portal/cookie.ts for the
 * Edge-safe half), because timingSafeEqual has no Web Crypto equivalent.
 *
 * "server-only" matters here as much as the comparison does: this module is
 * reached from the client registry, and a stray client-component import would
 * ship every client's passcode hash to every visitor's browser.
 */

export function hashPasscode(passcode: string, salt: string): string {
  return createHash("sha256").update(`${passcode}${salt}`).digest("hex");
}

/**
 * Compare a submitted passcode against a stored hash without leaking length or
 * content through timing. Both sides are fixed-length hex digests by the time
 * they are compared, so the length check below can never be the discriminator.
 */
export function verifyPasscode(
  submitted: string,
  storedHash: string,
  salt: string
): boolean {
  const candidate = Buffer.from(hashPasscode(submitted, salt), "hex");
  const expected = Buffer.from(storedHash, "hex");
  if (candidate.length !== expected.length) return false;
  return timingSafeEqual(candidate, expected);
}

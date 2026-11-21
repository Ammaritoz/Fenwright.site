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

/**
 * Bring whatever a person typed or pasted into the stored passcode shape.
 *
 * Passcodes are ten characters shown as `XXXXX-XXXXX`. The dash is formatting,
 * not part of the secret, so nobody should have to type it: drop everything that
 * is not a letter or digit, upper-case, and put the dash back. Spaces, a missing
 * dash, lower case and a pasted trailing newline all resolve to the same code.
 * Anything that is not ten characters is returned without a dash, so it simply
 * fails verification. No hash comparison is weakened: the stored hash still has
 * to match the normalised ten characters exactly.
 */
export function normalisePasscode(raw: string): string {
  const core = raw.replace(/[^A-Za-z0-9]/g, "").toUpperCase();
  return core.length === 10 ? `${core.slice(0, 5)}-${core.slice(5)}` : core;
}

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

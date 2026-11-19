import { createHmac, timingSafeEqual } from "node:crypto";

/**
 * Upload links for prospects sending firmware.
 *
 * A link is `/upload/<prospect>.<expires>.<signature>`: an HMAC over the
 * prospect slug and expiry, so links need no database, cannot be forged, and
 * stop working on their own. Make one with `npm run intake:link`.
 *
 * No "server-only" here so the CLI script can import it; the secret is only
 * ever read on the server.
 */

export type IntakeLink = { prospect: string; expires: number };

const PROSPECT_RE = /^[a-z0-9][a-z0-9-]{1,60}$/;

export function intakeSecret(): string {
  const s = process.env.INTAKE_LINK_SECRET;
  if (!s || s.length < 32) throw new Error("INTAKE_LINK_SECRET must be set (32+ characters)");
  return s;
}

function sign(prospect: string, expires: number, key: string): string {
  return createHmac("sha256", key).update(`intake:${prospect}:${expires}`).digest("base64url");
}

export function signIntakeToken(prospect: string, expires: number, key: string = intakeSecret()): string {
  if (!PROSPECT_RE.test(prospect)) throw new Error("prospect must be lowercase letters, digits and hyphens");
  return `${prospect}.${expires}.${sign(prospect, expires, key)}`;
}

/** The link's prospect and expiry if the signature is valid and it has not expired, else null. */
export function verifyIntakeToken(
  token: string,
  nowSeconds: number = Date.now() / 1000,
  key: string = intakeSecret(),
): IntakeLink | null {
  const parts = token.split(".");
  if (parts.length !== 3) return null;
  const [prospect, exp, sig] = parts;
  const expires = Number(exp);
  if (!PROSPECT_RE.test(prospect) || !Number.isInteger(expires)) return null;
  const want = Buffer.from(sign(prospect, expires, key));
  const got = Buffer.from(sig);
  if (want.length !== got.length || !timingSafeEqual(want, got)) return null;
  if (expires < nowSeconds) return null;
  return { prospect, expires };
}

import { NextRequest } from "next/server";

/**
 * Best-effort client IP for rate-limit keys.
 *
 * On Vercel, `x-real-ip` is set authoritatively by the platform to the real TCP
 * peer and cannot be spoofed by the client, whereas `x-forwarded-for` has the
 * client-supplied value preserved to the LEFT of Vercel's appended IP. Trusting
 * `x-forwarded-for[0]` would let an attacker rotate the header to bypass per-IP
 * limits, so we prefer `x-real-ip` and only fall back to XFF (useful for other
 * proxies / local dev). See the security notes for the Vercel rationale.
 */
export function clientIp(req: NextRequest): string {
  const real = req.headers.get("x-real-ip");
  if (real) return real.trim();
  const xff = req.headers.get("x-forwarded-for");
  if (xff) return xff.split(",")[0].trim();
  return "0.0.0.0";
}

/** Normalise a phone key for rate-limit identifiers. */
export function phoneKey(phone: string): string {
  return phone.replace(/[^\d+]/g, "");
}

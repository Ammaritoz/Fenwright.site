import { NextRequest, NextResponse } from "next/server";

/**
 * Best-effort client IP for rate-limit keys.
 *
 * `req.ip` is populated by the hosting platform (Vercel) from the real TCP peer
 * and is not settable by the client, so it is always preferred. The header
 * fallbacks exist for local dev and non-Vercel proxies; note that on a host
 * which does NOT overwrite them, both `x-real-ip` and `x-forwarded-for` are
 * attacker-controlled and the per-IP limits degrade to nothing. The global
 * daily caps are the backstop for that case.
 */
export function clientIp(req: NextRequest): string {
  if (req.ip) return req.ip;
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

/** Nothing this API accepts is anywhere near this big. */
const MAX_BODY_BYTES = 16 * 1024;

/**
 * Reject anything that is not a genuine same-origin JSON call.
 *
 * These endpoints spend real money (Anthropic tokens, SMS) and are
 * unauthenticated, so the only thing standing between a visitor's browser and
 * an attacker-triggered send is origin checking. Two independent gates:
 *
 *  1. Content-Type must be exactly application/json. An HTML <form> can only
 *     ever send text/plain, application/x-www-form-urlencoded or
 *     multipart/form-data, so this alone kills form-based CSRF. It also forces
 *     any cross-origin fetch() into a CORS preflight, which fails because we
 *     return no Access-Control-Allow-Origin.
 *
 *  2. Origin / Sec-Fetch-Site must indicate same-origin. Both headers are set
 *     by the browser and cannot be overridden from page JavaScript.
 *
 * Extra origins (e.g. a staging domain) can be allowed via ALLOWED_ORIGINS as
 * a comma-separated list of full origins.
 */
export function guardRequest(req: NextRequest): NextResponse | null {
  const length = Number(req.headers.get("content-length"));
  if (Number.isFinite(length) && length > MAX_BODY_BYTES) {
    return NextResponse.json({ error: "Request too large." }, { status: 413 });
  }

  const contentType = (req.headers.get("content-type") || "").split(";")[0].trim().toLowerCase();
  if (contentType !== "application/json") {
    return NextResponse.json({ error: "Invalid request." }, { status: 415 });
  }

  if (!isSameOrigin(req)) {
    return NextResponse.json({ error: "Invalid request." }, { status: 403 });
  }

  return null;
}

function isSameOrigin(req: NextRequest): boolean {
  // Set by the browser, not reachable from page JS. "none" means a direct
  // user action (typed URL / bookmark) rather than a cross-site page.
  const fetchSite = req.headers.get("sec-fetch-site");
  if (fetchSite && fetchSite !== "same-origin" && fetchSite !== "none") return false;

  const origin = req.headers.get("origin");
  // No Origin at all: not a cross-site browser POST (browsers always send it on
  // POST). Non-browser clients land here and are still gated by Content-Type.
  if (!origin) return true;

  let originHost: string;
  try {
    originHost = new URL(origin).host;
  } catch {
    return false;
  }

  const host = req.headers.get("host");
  if (host && originHost === host.trim()) return true;

  return allowedOrigins().includes(origin);
}

function allowedOrigins(): string[] {
  return (process.env.ALLOWED_ORIGINS || "")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
}

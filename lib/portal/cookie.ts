/**
 * Portal session cookie: sign and verify.
 *
 * Deliberately Web Crypto only, with no Node built-ins and no imports from the
 * client registry, because middleware.ts runs on the Edge runtime where
 * node:crypto is unavailable. The split is:
 *
 *   server action (Node)  -> checks the passcode, calls signSession()
 *   middleware   (Edge)   -> calls verifySession() on the cookie alone
 *
 * The cookie carries no secret of its own. It is `<expiry>.<hmac>` over the
 * client slug, so a cookie minted for one client cannot be replayed against
 * another, and an expired one fails without a lookup.
 */

const ENCODER = new TextEncoder();

/** Cookie name is per client so two clients' sessions cannot collide. */
export function sessionCookieName(slug: string): string {
  return `fw_portal_${slug}`;
}

function secret(): string {
  const s = process.env.PORTAL_COOKIE_SECRET;
  if (!s || s.length < 32) {
    throw new Error(
      "PORTAL_COOKIE_SECRET is missing or shorter than 32 characters. " +
        "Generate one with: openssl rand -hex 32"
    );
  }
  return s;
}

async function hmac(message: string): Promise<string> {
  const key = await crypto.subtle.importKey(
    "raw",
    ENCODER.encode(secret()),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  );
  const sig = await crypto.subtle.sign("HMAC", key, ENCODER.encode(message));
  return [...new Uint8Array(sig)].map((b) => b.toString(16).padStart(2, "0")).join("");
}

/** Length-independent comparison, so a mismatch reveals nothing through timing. */
function constantTimeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) {
    diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }
  return diff === 0;
}

export const SESSION_MAX_AGE_SECONDS = 60 * 60 * 24 * 30; // 30 days

export async function signSession(slug: string): Promise<string> {
  const expiresAt = Date.now() + SESSION_MAX_AGE_SECONDS * 1000;
  const payload = `${slug}.${expiresAt}`;
  return `${expiresAt}.${await hmac(payload)}`;
}

export async function verifySession(slug: string, cookieValue: string | undefined): Promise<boolean> {
  if (!cookieValue) return false;
  const sep = cookieValue.indexOf(".");
  if (sep === -1) return false;

  const expiresRaw = cookieValue.slice(0, sep);
  const signature = cookieValue.slice(sep + 1);
  const expiresAt = Number(expiresRaw);
  if (!Number.isFinite(expiresAt) || expiresAt < Date.now()) return false;

  const expected = await hmac(`${slug}.${expiresAt}`);
  return constantTimeEqual(expected, signature);
}

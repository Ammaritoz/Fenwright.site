import "server-only";

/**
 * SMS transport. Telnyx.
 *
 * Replaces the previous Twilio adapter. The US long code Twilio issued could
 * not receive inbound SMS from Irish carriers, and that account is not coming
 * back, so the provider is swapped rather than repaired.
 *
 * The exported surface is deliberately identical to the old lib/twilio.ts
 * (`smsConfigured` / `sendSms` / `lookupAllowsSms`) so every caller — the
 * contact route, the demo-text route and the voice recap tool — keeps working
 * untouched. Provider choice lives here and nowhere else.
 *
 * Plain fetch rather than the Telnyx SDK: one less dependency, and unlike the
 * Twilio SDK it takes an AbortSignal, so a hung send can be cut off instead of
 * holding a live phone call open.
 */

const API_BASE = "https://api.telnyx.com/v2";

/** A send that outlives this is worse than no send: the caller is still waiting. */
const SEND_TIMEOUT_MS = 8000;
const LOOKUP_TIMEOUT_MS = 4000;

export function smsConfigured(): boolean {
  return Boolean(process.env.TELNYX_API_KEY && process.env.TELNYX_FROM_NUMBER);
}

function apiKey(): string {
  const key = process.env.TELNYX_API_KEY;
  if (!key) throw new Error("TELNYX_API_KEY is not set");
  return key;
}

async function telnyx(
  path: string,
  init: RequestInit,
  timeoutMs: number
): Promise<Response> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    return await fetch(`${API_BASE}${path}`, {
      ...init,
      signal: controller.signal,
      headers: {
        Authorization: `Bearer ${apiKey()}`,
        "Content-Type": "application/json",
        ...(init.headers ?? {}),
      },
    });
  } finally {
    clearTimeout(timer);
  }
}

/**
 * Telnyx reports failures as a JSON `errors` array. Surface the codes and
 * titles only: `detail` can echo the destination number back, and these
 * messages reach logs.
 */
async function describeFailure(res: Response): Promise<string> {
  let detail = "";
  try {
    const body = (await res.json()) as {
      errors?: Array<{ code?: string | number; title?: string }>;
    };
    const parts = (body.errors ?? [])
      .map((e) => [e.code, e.title].filter(Boolean).join(" "))
      .filter(Boolean);
    if (parts.length) detail = `: ${parts.join("; ")}`;
  } catch {
    // Non-JSON body (gateway error page). The status code is the signal.
  }
  return `Telnyx send failed (${res.status})${detail}`;
}

/** Send an SMS. Throws on failure. `to` must be E.164. */
export async function sendSms(to: string, body: string): Promise<void> {
  const from = process.env.TELNYX_FROM_NUMBER;
  if (!from) throw new Error("TELNYX_FROM_NUMBER is not set");

  const payload: Record<string, string> = { from, to, text: body };

  // Required when `from` is an alphanumeric sender ID rather than a number.
  // Alphanumeric senders cannot receive replies, so this is for one-way sends
  // only: anything expecting an answer must send from a real number.
  const profile = process.env.TELNYX_MESSAGING_PROFILE_ID;
  if (profile) payload.messaging_profile_id = profile;

  const res = await telnyx(
    "/messages",
    { method: "POST", body: JSON.stringify(payload) },
    SEND_TIMEOUT_MS
  );

  if (!res.ok) throw new Error(await describeFailure(res));
}

/**
 * Optional Telnyx Number Lookup to confirm a number is a real, reachable
 * mobile. Gated behind TELNYX_LOOKUP to control cost. Returns true if allowed
 * to send. On any Lookup error we fail open (allow), since the SMS itself is
 * the real gate — same policy as the Twilio implementation it replaces.
 */
export async function lookupAllowsSms(to: string): Promise<boolean> {
  if (process.env.TELNYX_LOOKUP !== "1") return true;
  try {
    const res = await telnyx(
      `/number_lookup/${encodeURIComponent(to)}?type=carrier`,
      { method: "GET" },
      LOOKUP_TIMEOUT_MS
    );
    if (!res.ok) return true;

    const body = (await res.json()) as {
      data?: { carrier?: { type?: string | null } | null };
    };
    const lineType = body.data?.carrier?.type?.toLowerCase();

    // Allow mobile + voip, and allow an unknown type. Block only a clear
    // landline, which cannot receive SMS.
    if (lineType === "landline") return false;
    return true;
  } catch {
    return true;
  }
}

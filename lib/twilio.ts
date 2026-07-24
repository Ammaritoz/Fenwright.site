import "server-only";
import twilio from "twilio";

let client: ReturnType<typeof twilio> | null = null;

function getClient() {
  if (!client) {
    const sid = process.env.TWILIO_ACCOUNT_SID;
    const token = process.env.TWILIO_AUTH_TOKEN;
    if (!sid || !token) throw new Error("Twilio credentials are not set");
    client = twilio(sid, token);
  }
  return client;
}

export function twilioConfigured(): boolean {
  return Boolean(
    process.env.TWILIO_ACCOUNT_SID &&
      process.env.TWILIO_AUTH_TOKEN &&
      process.env.TWILIO_FROM_NUMBER
  );
}

/** Send an SMS. Throws on failure. `to` must be E.164. */
export async function sendSms(to: string, body: string): Promise<void> {
  const from = process.env.TWILIO_FROM_NUMBER;
  if (!from) throw new Error("TWILIO_FROM_NUMBER is not set");
  await getClient().messages.create({ to, from, body });
}

/**
 * Optional Twilio Lookup to confirm a number is a real, reachable mobile.
 * Gated behind TWILIO_LOOKUP to control cost. Returns true if allowed to send.
 * On any Lookup error we fail open (allow) since the SMS itself is the real gate.
 */
export async function lookupAllowsSms(to: string): Promise<boolean> {
  if (process.env.TWILIO_LOOKUP !== "1") return true;
  try {
    const res = await getClient()
      .lookups.v2.phoneNumbers(to)
      .fetch({ fields: "line_type_intelligence" });
    if (res.valid === false) return false;
    const lineType = res.lineTypeIntelligence?.type;
    // allow mobile + voip; block clearly non-mobile landlines
    if (lineType && lineType === "landline") return false;
    return true;
  } catch {
    return true;
  }
}

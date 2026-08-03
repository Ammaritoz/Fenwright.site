import { NextRequest, NextResponse } from "next/server";
import { demoTextSchema } from "@/lib/validation";
import { generateReply, toGsm7 } from "@/lib/receptionist";
import { rateLimit, incrementDailyCounter } from "@/lib/ratelimit";
import { clientIp, phoneKey, guardRequest } from "@/lib/request";
import { limits, demoSmsDailyCap } from "@/config/limits";
import { sendSms, twilioConfigured, lookupAllowsSms } from "@/lib/twilio";
import { logLead } from "@/lib/airtable";
import { errMeta } from "@/lib/log";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const MAX_SMS_CHARS = 160;

export async function POST(req: NextRequest) {
  // Same-origin JSON only. This endpoint sends a real SMS to a caller-supplied
  // number, so a cross-site page must never be able to fire it using a
  // visitor's browser (which would also spend the visitor's IP allowance).
  const blocked = guardRequest(req);
  if (blocked) return blocked;

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  }

  const parsed = demoTextSchema.safeParse(body);
  if (!parsed.success) {
    const first = parsed.error?.issues?.[0]?.message;
    return NextResponse.json(
      { error: first || "Please check your number and the consent box." },
      { status: 400 }
    );
  }
  const { industry, enquiry, phone } = parsed.data;

  if (!twilioConfigured()) {
    console.error("[fenwright] demo-text: Twilio not configured");
    return NextResponse.json(
      { error: "Texting is not available right now. Please try the on-screen demo." },
      { status: 503 }
    );
  }

  const ip = clientIp(req);
  const pKey = phoneKey(phone);

  // 1) Max 3 SMS per IP per hour.
  const ipRl = await rateLimit(
    "demo-text-ip",
    ip,
    limits.demoText.perIpPerHour.tokens,
    limits.demoText.perIpPerHour.window
  );
  if (!ipRl.success) {
    return NextResponse.json(
      { error: "That is a few texts from this connection already. Try again later." },
      { status: 429 }
    );
  }

  // 2) Max 1 SMS per phone number per 24 hours.
  const phoneRl = await rateLimit(
    "demo-text-phone",
    pKey,
    limits.demoText.perPhonePerDay.tokens,
    limits.demoText.perPhonePerDay.window
  );
  if (!phoneRl.success) {
    return NextResponse.json(
      { error: "We have already texted this number today. Book a call to see more." },
      { status: 429 }
    );
  }

  // 3) Optional Twilio Lookup (cost-gated).
  const allowed = await lookupAllowsSms(phone);
  if (!allowed) {
    return NextResponse.json(
      { error: "That does not look like a mobile number. Try a mobile." },
      { status: 400 }
    );
  }

  // 4) Global daily cap. Increment AFTER the per-phone/per-ip checks pass so
  //    blocked attempts do not burn the global budget.
  const cap = demoSmsDailyCap();
  const used = await incrementDailyCounter("demo-sms");
  if (used > cap) {
    return NextResponse.json(
      { error: "The demo is busy today. Book a call and we will show you live." },
      { status: 429 }
    );
  }

  try {
    // Single GSM-7 segment: sanitise and hard-trim to 160 chars.
    let reply = toGsm7(await generateReply({ industry, enquiry, maxChars: MAX_SMS_CHARS }));
    if (reply.length > MAX_SMS_CHARS) {
      reply = reply.slice(0, MAX_SMS_CHARS - 1).trimEnd();
    }

    await sendSms(phone, reply);

    // Log to Airtable (best-effort, never blocks or throws).
    await logLead({ industry, phone, message: reply, source: "site-demo" });

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("[fenwright] demo-text send failed:", errMeta(err));
    return NextResponse.json(
      { error: "We could not send that text. Please try again shortly." },
      { status: 502 }
    );
  }
}

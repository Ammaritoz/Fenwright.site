import { NextRequest, NextResponse } from "next/server";
import { contactSchema } from "@/lib/validation";
import { generateFenwrightReply } from "@/lib/receptionist";
import { rateLimit } from "@/lib/ratelimit";
import { clientIp, phoneKey } from "@/lib/request";
import { limits } from "@/config/limits";
import { sendSms, twilioConfigured } from "@/lib/twilio";
import { logLead } from "@/lib/airtable";
import { errMeta } from "@/lib/log";
import { site } from "@/config/site";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function bookingUrl(): string {
  const link = process.env.CALCOM_LINK || site.calcom.link;
  return `${site.calcom.bookingBase}/${link}`;
}

export async function POST(req: NextRequest) {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  }

  const parsed = contactSchema.safeParse(body);
  if (!parsed.success) {
    const first = parsed.error?.issues?.[0]?.message;
    return NextResponse.json(
      { error: first || "Please check the form and try again." },
      { status: 400 }
    );
  }
  const { name, phone, message } = parsed.data;

  const ip = clientIp(req);
  const pKey = phoneKey(phone);

  const ipRl = await rateLimit(
    "contact-ip",
    ip,
    limits.contact.perIpPerHour.tokens,
    limits.contact.perIpPerHour.window
  );
  const phoneRl = await rateLimit(
    "contact-phone",
    pKey,
    limits.contact.perPhonePerHour.tokens,
    limits.contact.perPhonePerHour.window
  );
  if (!ipRl.success || !phoneRl.success) {
    return NextResponse.json(
      { error: "We have your details already. We will be in touch shortly." },
      { status: 429 }
    );
  }

  if (!twilioConfigured()) {
    // Still capture the lead even if SMS is down.
    await logLead({ name, phone, message, source: "site-contact" });
    await forwardToN8n({ name, phone, message });
    return NextResponse.json({ ok: true, texted: false });
  }

  try {
    const reply = await generateFenwrightReply({
      name,
      message,
      bookingUrl: bookingUrl(),
    });

    await sendSms(phone, reply);
    await logLead({ name, phone, message, source: "site-contact" });

    // Best-effort n8n forward, must not block the response.
    await forwardToN8n({ name, phone, message });

    return NextResponse.json({ ok: true, texted: true });
  } catch (err) {
    console.error("[fenwright] contact send failed:", errMeta(err));
    // The text failed (e.g. Twilio geo permissions / trial limits), but the lead
    // still matters: capture it and tell the client the text did not go out.
    await logLead({ name, phone, message, source: "site-contact" });
    await forwardToN8n({ name, phone, message });
    return NextResponse.json({ ok: true, texted: false });
  }
}

/** Optional n8n forward. Fire-and-tolerate: never throws, short timeout. */
async function forwardToN8n(payload: {
  name: string;
  phone: string;
  message: string;
}): Promise<void> {
  const url = process.env.N8N_WEBHOOK_URL;
  if (!url) return;
  try {
    const controller = new AbortController();
    const t = setTimeout(() => controller.abort(), 4000);
    await fetch(url, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ ...payload, source: "site-contact", at: new Date().toISOString() }),
      signal: controller.signal,
    });
    clearTimeout(t);
  } catch (err) {
    console.warn("[fenwright] n8n forward failed (non-blocking):", err);
  }
}

import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { verifyIntakeToken } from "@/lib/intake/token";
import { objectSize, r2Configured } from "@/lib/intake/r2";
import { sendSms, smsConfigured } from "@/lib/sms";
import { guardRequest } from "@/lib/request";
import { errMeta } from "@/lib/log";
import { logUpload } from "@/lib/airtable";

/**
 * Confirms an encrypted upload reached R2 and tells Fenwright it is waiting.
 * The text names the prospect slug only: never the file name, which stays
 * inside the ciphertext.
 */

const body = z.object({ token: z.string().max(200), key: z.string().max(300) });

export async function POST(req: NextRequest) {
  const blocked = guardRequest(req);
  if (blocked) return blocked;

  const parsed = body.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Invalid request." }, { status: 400 });

  let link;
  try {
    link = verifyIntakeToken(parsed.data.token);
  } catch {
    return NextResponse.json({ error: "Uploads are not set up yet." }, { status: 503 });
  }
  if (!link || !r2Configured()) return NextResponse.json({ error: "Invalid request." }, { status: 403 });
  // A link may only confirm objects under its own prospect's prefix.
  if (!/^intake\/[a-z0-9-]+\/[0-9]+-[0-9a-f]{8}\.fwenc$/.test(parsed.data.key) ||
      !parsed.data.key.startsWith(`intake/${link.prospect}/`)) {
    return NextResponse.json({ error: "Invalid request." }, { status: 403 });
  }

  const size = await objectSize(parsed.data.key).catch(() => null);
  if (!size) return NextResponse.json({ error: "We could not find your upload. Please try again." }, { status: 404 });

  // Record it first. A repeat of an upload already recorded is acknowledged but
  // does not text the operator again.
  const recorded = await logUpload({ clientSlug: link.prospect, objectKey: parsed.data.key, bytes: size });

  const notify = process.env.INTAKE_NOTIFY_PHONE;
  if (notify && smsConfigured() && recorded !== "exists") {
    try {
      await sendSms(notify, `Fenwright: encrypted firmware received from ${link.prospect} (${Math.round(size / 1048576)} MB). Run: fenwright-watch intake fetch`);
    } catch (err) {
      console.error("[intake] notify failed", errMeta(err));
    }
  }
  console.info("[intake] upload received", { prospect: link.prospect, bytes: size });
  return NextResponse.json({ ok: true });
}

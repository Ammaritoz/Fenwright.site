import { randomUUID } from "node:crypto";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { verifyIntakeToken } from "@/lib/intake/token";
import { presignPut, r2Configured } from "@/lib/intake/r2";
import { rateLimit } from "@/lib/ratelimit";
import { clientIp, guardRequest } from "@/lib/request";
import { intake } from "@/config/intake";
import { errMeta } from "@/lib/log";

/**
 * Hands the browser a short-lived URL to upload one encrypted file to R2.
 * The browser has already encrypted the file; this route never sees it.
 */

const body = z.object({
  token: z.string().max(200),
  /** Size of the encrypted envelope in bytes. */
  size: z.number().int().positive(),
});

// Envelope overhead: magic, key length, a 4096-bit wrapped key, IV, GCM tag, metadata.
const ENVELOPE_SLACK = 64 * 1024;

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
  if (!link) return NextResponse.json({ error: "This upload link is invalid or has expired." }, { status: 403 });
  if (!r2Configured()) return NextResponse.json({ error: "Uploads are not set up yet." }, { status: 503 });
  if (parsed.data.size > intake.maxFileBytes + ENVELOPE_SLACK) {
    return NextResponse.json({ error: "That file is too large." }, { status: 413 });
  }

  const rl = await rateLimit("intake-sign", `${link.prospect}:${clientIp(req)}`, 10, "1 h");
  if (!rl.success) return NextResponse.json({ error: "Too many uploads. Try again later." }, { status: 429 });

  const key = `intake/${link.prospect}/${Date.now()}-${randomUUID().slice(0, 8)}.fwenc`;
  try {
    return NextResponse.json({ url: await presignPut(key), key });
  } catch (err) {
    console.error("[intake] presign failed", errMeta(err));
    return NextResponse.json({ error: "Could not start the upload." }, { status: 502 });
  }
}

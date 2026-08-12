import { NextRequest, NextResponse } from "next/server";
import { unsubscribeSchema } from "@/lib/validation";
import { addUnsubscribe } from "@/lib/suppression";
import { rateLimit } from "@/lib/ratelimit";
import { clientIp, guardRequest } from "@/lib/request";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  // Same-origin JSON only, consistent with every other mutating route here.
  const blocked = guardRequest(req);
  if (blocked) return blocked;

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  }

  const parsed = unsubscribeSchema.safeParse(body);
  if (!parsed.success) {
    const first = parsed.error?.issues?.[0]?.message;
    return NextResponse.json(
      { error: first || "Please check your email and try again." },
      { status: 400 }
    );
  }

  const ip = clientIp(req);
  const rl = await rateLimit("unsubscribe-ip", ip, 10, "1 h");
  if (!rl.success) {
    return NextResponse.json(
      { error: "Too many requests. Please try again shortly." },
      { status: 429 }
    );
  }

  const ok = await addUnsubscribe(parsed.data.email);
  if (!ok) {
    return NextResponse.json(
      { error: "Something went wrong on our end. Please email us instead." },
      { status: 500 }
    );
  }

  return NextResponse.json({ ok: true });
}

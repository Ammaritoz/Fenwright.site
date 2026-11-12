import { NextRequest, NextResponse } from "next/server";
import { unsubscribeSchema } from "@/lib/validation";
import { addUnsubscribe } from "@/lib/suppression";
import { rateLimit } from "@/lib/ratelimit";
import { clientIp } from "@/lib/request";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * One-click unsubscribe (RFC 8058) for cold outreach emails.
 *
 * The outreach sender puts this URL, with the recipient's email in the query, in the
 * List-Unsubscribe header and adds "List-Unsubscribe-Post: List-Unsubscribe=One-Click".
 * Gmail/Outlook then POST the form body "List-Unsubscribe=One-Click" here from their own
 * servers when someone clicks their Unsubscribe button.
 *
 * Unlike /api/unsubscribe this deliberately skips guardRequest (same-origin JSON only):
 * the caller is the mail provider, never our page. The worst a forged request can do is
 * stop us emailing an address, so the per-IP rate limit is the only guard needed.
 */
export async function POST(req: NextRequest) {
  const body = await req.text().catch(() => "");
  if (!new URLSearchParams(body).get("List-Unsubscribe")?.match(/^One-Click$/i)) {
    return NextResponse.json({ error: "Not a one-click unsubscribe." }, { status: 400 });
  }

  const parsed = unsubscribeSchema.safeParse({ email: req.nextUrl.searchParams.get("email") ?? "" });
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid email." }, { status: 400 });
  }

  const rl = await rateLimit("unsubscribe-one-click-ip", clientIp(req), 30, "1 h");
  if (!rl.success) {
    return NextResponse.json({ error: "Too many requests." }, { status: 429 });
  }

  const ok = await addUnsubscribe(parsed.data.email);
  if (!ok) {
    return NextResponse.json({ error: "Could not record the unsubscribe." }, { status: 500 });
  }
  return NextResponse.json({ ok: true });
}

/** Someone opened the header link in a browser: show the normal unsubscribe page. */
export function GET(req: NextRequest) {
  const url = new URL("/unsubscribe", req.nextUrl.origin);
  const email = req.nextUrl.searchParams.get("email");
  if (email) url.searchParams.set("email", email);
  return NextResponse.redirect(url, 303);
}

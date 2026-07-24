import { NextRequest, NextResponse } from "next/server";
import { demoReplySchema } from "@/lib/validation";
import { generateReply } from "@/lib/receptionist";
import { rateLimit, incrementDailyCounter } from "@/lib/ratelimit";
import { clientIp } from "@/lib/request";
import { limits, demoReplyDailyCap } from "@/config/limits";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  // Rate limit by IP: cheap AI-only calls.
  const ip = clientIp(req);
  const rl = await rateLimit(
    "demo-reply",
    ip,
    limits.demoReply.tokens,
    limits.demoReply.window
  );
  if (!rl.success) {
    return NextResponse.json(
      { error: "You are going a little fast. Give it a moment and try again." },
      { status: 429 }
    );
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  }

  const parsed = demoReplySchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Please pick an industry and try again." },
      { status: 400 }
    );
  }

  // Global daily budget: guards Anthropic spend even if the per-IP limit is
  // evaded by rotating IPs. Incremented only after validation passes.
  const used = await incrementDailyCounter("demo-reply");
  if (used > demoReplyDailyCap()) {
    return NextResponse.json(
      { error: "The demo is busy today. Book a call and we will show you live." },
      { status: 429 }
    );
  }

  try {
    const reply = await generateReply({
      industry: parsed.data.industry,
      enquiry: parsed.data.enquiry,
    });
    // Realistic on-screen timer value (6 to 12 seconds).
    const seconds = Math.floor(6 + Math.random() * 7);
    return NextResponse.json({ reply, seconds });
  } catch (err) {
    console.error("[fenwright] demo-reply failed:", err);
    return NextResponse.json(
      { error: "The demo hit a snag. Please try again in a moment." },
      { status: 500 }
    );
  }
}

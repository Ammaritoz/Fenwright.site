import { NextRequest, NextResponse } from "next/server";
import { rateLimit, incrementDailyCounter } from "@/lib/ratelimit";
import { clientIp, guardRequest } from "@/lib/request";
import { limits, voiceWebCallDailyCap } from "@/config/limits";
import { errMeta } from "@/lib/log";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const VAPI_WEB_CALL_URL = "https://api.vapi.ai/call/web";

/**
 * Start a browser call to the demo receptionist (components/VoiceCall.tsx).
 *
 * Vapi only creates web calls with the public key, but it is used here, on the
 * server, and never sent to the browser: anyone holding it could start calls
 * with any assistantOverrides (a longer cap, a different prompt), and the
 * key's origin check is only a header. In Vapi the key is restricted to the web
 * assistant and to this site's origins, so this sends the site's own origin.
 * The browser gets back just enough to join this one call.
 *
 * VAPI_WEB_ASSISTANT_ID is the web variant of the persona, synced by
 * scripts/sync-assistant.ts: no transfer tool, because a browser call has no
 * phone leg and Vapi ends it if a transfer is attempted.
 */
export async function POST(req: NextRequest) {
  const blocked = guardRequest(req);
  if (blocked) return blocked;

  const key = process.env.VAPI_PUBLIC_KEY;
  const assistantId = process.env.VAPI_WEB_ASSISTANT_ID;
  const origin = siteOrigin();
  if (!key || !assistantId || !origin) {
    console.error("[fenwright] web-call: voice demo not configured");
    return NextResponse.json({ error: "The voice demo is not available right now." }, { status: 503 });
  }

  const ipRl = await rateLimit(
    "voice-web-call-ip",
    clientIp(req),
    limits.voice.webCall.perIpPerHour.tokens,
    limits.voice.webCall.perIpPerHour.window
  );
  if (!ipRl.success) {
    return NextResponse.json(
      { error: "That is a few calls already. Book a call and we will show you live." },
      { status: 429 }
    );
  }

  // Counted after the per-visitor check so refused attempts do not burn it.
  const used = await incrementDailyCounter("voice-web-call");
  if (used > voiceWebCallDailyCap()) {
    return NextResponse.json(
      { error: "The voice demo is busy today. Book a call and we will show you live." },
      { status: 429 }
    );
  }

  try {
    const res = await fetch(VAPI_WEB_CALL_URL, {
      method: "POST",
      headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json", Origin: origin },
      body: JSON.stringify({ assistantId }),
      signal: AbortSignal.timeout(limits.voice.externalTimeoutMs),
    });
    if (!res.ok) throw new Error(`Vapi create web call failed (${res.status})`);

    const call = (await res.json()) as {
      id?: string;
      webCallUrl?: string;
      transport?: { callToken?: string };
    };
    if (!call.id || !call.webCallUrl) throw new Error("Vapi web call response missing id or url");

    return NextResponse.json({
      id: call.id,
      webCallUrl: call.webCallUrl,
      transport: { callToken: call.transport?.callToken },
    });
  } catch (err) {
    console.error("[fenwright] web-call start failed:", errMeta(err), err instanceof Error ? err.message : "");
    return NextResponse.json(
      { error: "The call could not connect. Please try again in a moment." },
      { status: 502 }
    );
  }
}

/**
 * The site's own origin: the base URL Vapi calls back into when set, otherwise
 * the canonical www origin (the same one app/layout.tsx's metadataBase uses).
 * VOICE_PUBLIC_BASE_URL is only required by the local sync script, so the
 * deployed app cannot rely on it being present.
 */
function siteOrigin(): string | null {
  try {
    return new URL(process.env.VOICE_PUBLIC_BASE_URL || "https://www.fenwright.ie").origin;
  } catch {
    return null;
  }
}

import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";
import { POST } from "@/app/api/voice/web-call/route";
import { rateLimit, incrementDailyCounter } from "@/lib/ratelimit";
import { limits } from "@/config/limits";

vi.mock("@/lib/ratelimit", () => ({
  rateLimit: vi.fn().mockResolvedValue({ success: true, remaining: 2, reset: 0 }),
  incrementDailyCounter: vi.fn().mockResolvedValue(1),
}));

const PUBLIC_KEY = "test-vapi-public-key-do-not-use";
const WEB_ASSISTANT = "web-assistant-id";

beforeEach(() => {
  vi.stubEnv("VAPI_PUBLIC_KEY", PUBLIC_KEY);
  vi.stubEnv("VAPI_WEB_ASSISTANT_ID", WEB_ASSISTANT);
  vi.stubEnv("VOICE_PUBLIC_BASE_URL", "https://www.fenwright.ie/");
});

afterEach(() => {
  vi.clearAllMocks();
  vi.unstubAllGlobals();
  vi.mocked(rateLimit).mockResolvedValue({ success: true, remaining: 2, reset: 0 });
  vi.mocked(incrementDailyCounter).mockResolvedValue(1);
});

/** Vapi's create-web-call response, including fields the browser must never see. */
const VAPI_CALL = {
  id: "call_123",
  orgId: "org_secret",
  webCallUrl: "https://vapi.daily.co/room",
  transport: { callToken: "join-token" },
  assistantId: WEB_ASSISTANT,
  cost: 0,
};

function stubVapi(payload: unknown = VAPI_CALL, ok = true) {
  const fn = vi.fn().mockResolvedValue({
    ok,
    status: ok ? 201 : 500,
    json: async () => payload,
    text: async () => JSON.stringify(payload),
  });
  vi.stubGlobal("fetch", fn);
  return fn;
}

function buildRequest(headers: Record<string, string> = {}): NextRequest {
  return new NextRequest("http://localhost/api/voice/web-call", {
    method: "POST",
    headers: { "content-type": "application/json", host: "localhost", ...headers },
    body: "{}",
  });
}

describe("POST /api/voice/web-call", () => {
  it("creates the call server-side with the web assistant and returns only what the browser needs", async () => {
    const fetchFn = stubVapi();
    const res = await POST(buildRequest());

    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({
      id: "call_123",
      webCallUrl: "https://vapi.daily.co/room",
      transport: { callToken: "join-token" },
    });

    const [url, init] = fetchFn.mock.calls[0];
    expect(url).toBe("https://api.vapi.ai/call/web");
    expect(init.headers.Authorization).toBe(`Bearer ${PUBLIC_KEY}`);
    // The public key is origin-restricted in Vapi, and a server fetch sends no
    // Origin of its own: without this Vapi answers 403.
    expect(init.headers.Origin).toBe("https://www.fenwright.ie");
    expect(JSON.parse(init.body)).toEqual({ assistantId: WEB_ASSISTANT });
  });

  it("falls back to the canonical site origin when no base URL is set", async () => {
    vi.stubEnv("VOICE_PUBLIC_BASE_URL", "");
    const fetchFn = stubVapi();
    const res = await POST(buildRequest());

    expect(res.status).toBe(200);
    expect(fetchFn.mock.calls[0][1].headers.Origin).toBe("https://www.fenwright.ie");
  });

  it("refuses a cross-site request without spending a call", async () => {
    const fetchFn = stubVapi();
    const res = await POST(buildRequest({ origin: "https://evil.example", "sec-fetch-site": "cross-site" }));

    expect(res.status).toBe(403);
    expect(fetchFn).not.toHaveBeenCalled();
  });

  it("is unavailable, not broken, when the web assistant is not configured", async () => {
    vi.stubEnv("VAPI_WEB_ASSISTANT_ID", "");
    const fetchFn = stubVapi();
    const res = await POST(buildRequest());

    expect(res.status).toBe(503);
    expect(fetchFn).not.toHaveBeenCalled();
  });

  it("limits calls per visitor", async () => {
    vi.mocked(rateLimit).mockResolvedValueOnce({ success: false, remaining: 0, reset: 0 });
    const fetchFn = stubVapi();
    const res = await POST(buildRequest());

    expect(res.status).toBe(429);
    expect(fetchFn).not.toHaveBeenCalled();
    expect(vi.mocked(rateLimit)).toHaveBeenCalledWith(
      "voice-web-call-ip",
      expect.any(String),
      limits.voice.webCall.perIpPerHour.tokens,
      limits.voice.webCall.perIpPerHour.window
    );
  });

  it("stops at the global daily cap", async () => {
    vi.mocked(incrementDailyCounter).mockResolvedValueOnce(limits.voice.webCall.dailyCapDefault + 1);
    const fetchFn = stubVapi();
    const res = await POST(buildRequest());

    expect(res.status).toBe(429);
    expect(fetchFn).not.toHaveBeenCalled();
  });

  it("reports a Vapi failure without leaking its body", async () => {
    stubVapi({ message: "org_secret detail" }, false);
    const res = await POST(buildRequest());

    expect(res.status).toBe(502);
    expect(JSON.stringify(await res.json())).not.toContain("org_secret");
  });
});

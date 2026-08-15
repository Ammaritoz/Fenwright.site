import { afterEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";
import { POST } from "@/app/api/voice/tools/[tool]/route";
import { signPayload, SIGNATURE_HEADER, TIMESTAMP_HEADER } from "@/lib/voice/auth";
import { rateLimit, incrementDailyCounter } from "@/lib/ratelimit";
import { limits } from "@/config/limits";

vi.mock("@/lib/voice/tools", () => ({
  runTool: vi.fn().mockResolvedValue({ result: "spoken result from tool" }),
}));
vi.mock("@/lib/ratelimit", () => ({
  rateLimit: vi.fn().mockResolvedValue({ success: true, remaining: 39, reset: 0 }),
  incrementDailyCounter: vi.fn().mockResolvedValue(1),
}));

afterEach(() => {
  vi.clearAllMocks();
  vi.mocked(rateLimit).mockResolvedValue({ success: true, remaining: 39, reset: 0 });
  vi.mocked(incrementDailyCounter).mockResolvedValue(1);
});

const SECRET = "test-secret-do-not-use-in-production";
const uniqueCall = () => `call_${Math.random()}`;

function buildRequest(rawBody: string, headers: Record<string, string> = {}): NextRequest {
  return new NextRequest("http://localhost/api/voice/tools/check_availability", {
    method: "POST",
    headers: { "content-type": "application/json", ...headers },
    body: rawBody,
  });
}

function signedHeaders(rawBody: string, timestamp = String(Math.floor(Date.now() / 1000))) {
  return {
    [TIMESTAMP_HEADER]: timestamp,
    [SIGNATURE_HEADER]: signPayload(timestamp, rawBody, SECRET),
  };
}

describe("POST /api/voice/tools/[tool]", () => {
  it("rejects an unsigned request with 401 and does not reach the tool", async () => {
    const { runTool } = await import("@/lib/voice/tools");
    const rawBody = JSON.stringify({ callId: uniqueCall(), arguments: { personaId: "electrician" } });

    const req = buildRequest(rawBody);
    const res = await POST(req, { params: { tool: "check_availability" } });

    expect(res.status).toBe(401);
    const body = await res.json();
    expect(body).toEqual({ error: "Unauthorised." });
    expect(vi.mocked(runTool)).not.toHaveBeenCalled();
  });

  it("rejects a wrongly signed request with 401 and does not reach the tool", async () => {
    const { runTool } = await import("@/lib/voice/tools");
    const rawBody = JSON.stringify({ callId: uniqueCall(), arguments: { personaId: "electrician" } });
    const timestamp = String(Math.floor(Date.now() / 1000));

    const req = buildRequest(rawBody, {
      [TIMESTAMP_HEADER]: timestamp,
      [SIGNATURE_HEADER]: "0".repeat(64),
    });
    const res = await POST(req, { params: { tool: "check_availability" } });

    expect(res.status).toBe(401);
    const body = await res.json();
    expect(body).toEqual({ error: "Unauthorised." });
    expect(vi.mocked(runTool)).not.toHaveBeenCalled();
  });

  it("reaches the tool and returns 200 for a correctly signed request", async () => {
    const { runTool } = await import("@/lib/voice/tools");
    const callId = uniqueCall();
    const rawBody = JSON.stringify({ callId, arguments: { personaId: "electrician", partOfDay: "any" } });

    const req = buildRequest(rawBody, signedHeaders(rawBody));
    const res = await POST(req, { params: { tool: "check_availability" } });

    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body).toEqual({ result: "spoken result from tool" });
    expect(vi.mocked(runTool)).toHaveBeenCalledWith("check_availability", callId, {
      personaId: "electrician",
      partOfDay: "any",
    });
  });

  it("verifies against the exact raw bytes received, not a re-serialised body", async () => {
    const { runTool } = await import("@/lib/voice/tools");
    const callId = uniqueCall();
    // Built as a literal string, not via JSON.stringify, with irregular
    // whitespace and a non-alphabetical key order ("callId" before
    // "arguments"). JSON.stringify(JSON.parse(rawBody)) would canonicalise
    // this down to compact, ordered JSON, changing the bytes the signature
    // was computed over. If the route were ever regressed to verify against
    // that re-serialised form instead of the true rawBody, this signature
    // would no longer match and the request would be rejected with 401
    // instead of reaching the tool.
    const rawBody = `{\n  "callId": "${callId}",\n  "arguments":   { "personaId":  "electrician" }\n}`;

    const req = buildRequest(rawBody, signedHeaders(rawBody));
    const res = await POST(req, { params: { tool: "check_availability" } });

    expect(res.status).toBe(200);
    expect(vi.mocked(runTool)).toHaveBeenCalledWith("check_availability", callId, {
      personaId: "electrician",
    });
  });

  it("fails open and still reaches the tool when the rate limiter throws", async () => {
    const { runTool } = await import("@/lib/voice/tools");
    const { rateLimit } = await import("@/lib/ratelimit");
    vi.mocked(rateLimit).mockRejectedValueOnce(new Error("upstash blip"));

    const callId = uniqueCall();
    const rawBody = JSON.stringify({
      callId,
      arguments: { personaId: "electrician", partOfDay: "any" },
    });

    const req = buildRequest(rawBody, signedHeaders(rawBody));
    const res = await POST(req, { params: { tool: "check_availability" } });

    // A limiter outage is not the security boundary (the signature already
    // is), so it must degrade to allowing the call rather than taking the
    // phone line down with a 500.
    expect(res.status).toBe(200);
    expect(vi.mocked(runTool)).toHaveBeenCalledWith("check_availability", callId, {
      personaId: "electrician",
      partOfDay: "any",
    });
  });

  it("gives send_recap_sms its own tighter per-call budget, not the shared 40", async () => {
    const callId = uniqueCall();
    const rawBody = JSON.stringify({
      callId,
      arguments: { personaId: "electrician", phone: "+353833378541", kind: "callback", name: "Bob" },
    });

    const req = buildRequest(rawBody, signedHeaders(rawBody));
    await POST(req, { params: { tool: "send_recap_sms" } });

    // The shared limiter is spent across all four tools, so on its own a single
    // signed call could text 40 different numbers.
    expect(vi.mocked(rateLimit)).toHaveBeenCalledWith(
      "voice-recap-sms",
      callId,
      limits.voice.recapSmsPerCall.tokens,
      limits.voice.recapSmsPerCall.window
    );
  });

  it("does not spend the recap budget on a tool that sends no text", async () => {
    const rawBody = JSON.stringify({
      callId: uniqueCall(),
      arguments: { personaId: "electrician", partOfDay: "any" },
    });

    const req = buildRequest(rawBody, signedHeaders(rawBody));
    await POST(req, { params: { tool: "check_availability" } });

    const names = vi.mocked(rateLimit).mock.calls.map((c) => c[0]);
    expect(names).not.toContain("voice-recap-sms");
  });

  it("answers the recap limit in speakable words rather than an error", async () => {
    const { runTool } = await import("@/lib/voice/tools");
    // First call is the shared voice-tool limiter, second is the recap limiter.
    vi.mocked(rateLimit)
      .mockResolvedValueOnce({ success: true, remaining: 39, reset: 0 })
      .mockResolvedValueOnce({ success: false, remaining: 0, reset: 0 });

    const rawBody = JSON.stringify({
      callId: uniqueCall(),
      arguments: { personaId: "electrician", phone: "+353833378541", kind: "callback", name: "Bob" },
    });

    const req = buildRequest(rawBody, signedHeaders(rawBody));
    const res = await POST(req, { params: { tool: "send_recap_sms" } });

    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.result).toMatch(/text/i);
    expect(body).not.toHaveProperty("error");
    expect(vi.mocked(runTool)).not.toHaveBeenCalled();
  });

  it("burns global daily budget for a tool that can send a text", async () => {
    const rawBody = JSON.stringify({
      callId: uniqueCall(),
      arguments: {
        personaId: "electrician",
        slotStart: "2026-09-01T09:00:00.000Z",
        name: "Bob",
        phone: "+353833378541",
      },
    });

    const req = buildRequest(rawBody, signedHeaders(rawBody));
    await POST(req, { params: { tool: "book_appointment" } });

    expect(vi.mocked(incrementDailyCounter)).toHaveBeenCalledWith("voice-sms");
  });

  it("does not burn global daily budget for a tool that cannot send a text", async () => {
    const rawBody = JSON.stringify({
      callId: uniqueCall(),
      arguments: { personaId: "electrician", partOfDay: "any" },
    });

    const req = buildRequest(rawBody, signedHeaders(rawBody));
    await POST(req, { params: { tool: "check_availability" } });

    expect(vi.mocked(incrementDailyCounter)).not.toHaveBeenCalled();
  });

  // callId comes from the request body, so a sender gets a fresh per-call
  // allowance for every id it invents. This is the only limit it cannot restart.
  it("answers the global daily cap in speakable words and does not reach the tool", async () => {
    const { runTool } = await import("@/lib/voice/tools");
    vi.mocked(incrementDailyCounter).mockResolvedValueOnce(
      limits.voice.smsDailyCapDefault + 1
    );

    const rawBody = JSON.stringify({
      callId: uniqueCall(),
      arguments: { personaId: "electrician", phone: "+353833378541", kind: "callback", name: "Bob" },
    });

    const req = buildRequest(rawBody, signedHeaders(rawBody));
    const res = await POST(req, { params: { tool: "send_recap_sms" } });

    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.result).toMatch(/name and number/i);
    expect(body).not.toHaveProperty("error");
    expect(vi.mocked(runTool)).not.toHaveBeenCalled();
  });

  it("fails open and still reaches the tool when the daily counter throws", async () => {
    const { runTool } = await import("@/lib/voice/tools");
    vi.mocked(incrementDailyCounter).mockRejectedValueOnce(new Error("upstash blip"));

    const rawBody = JSON.stringify({
      callId: uniqueCall(),
      arguments: { personaId: "electrician", phone: "+353833378541", kind: "callback", name: "Bob" },
    });

    const req = buildRequest(rawBody, signedHeaders(rawBody));
    const res = await POST(req, { params: { tool: "send_recap_sms" } });

    // A counter outage is not the security boundary, so it must degrade to
    // allowing the call rather than taking the phone line down.
    expect(res.status).toBe(200);
    expect(vi.mocked(runTool)).toHaveBeenCalledOnce();
  });

  it("rejects with 400, not a speakable 200, when the body cannot be read", async () => {
    const { runTool } = await import("@/lib/voice/tools");
    const erroringBody = new ReadableStream({
      start(controller) {
        controller.error(new Error("client aborted"));
      },
    });
    // `duplex: "half"` is required by undici for a streaming request body but
    // is not yet reflected in NextRequest's RequestInit type, so the init
    // object is cast directly to the constructor's own parameter type.
    const req = new NextRequest(
      "http://localhost/api/voice/tools/check_availability",
      {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: erroringBody,
        duplex: "half",
      } as unknown as ConstructorParameters<typeof NextRequest>[1]
    );

    const res = await POST(req, { params: { tool: "check_availability" } });

    // This request was never authenticated, so it must not receive the
    // speakable-200 treatment reserved for authenticated failures.
    expect(res.status).toBe(400);
    expect(vi.mocked(runTool)).not.toHaveBeenCalled();
  });
});

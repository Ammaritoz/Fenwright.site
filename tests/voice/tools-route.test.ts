import { afterEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";
import { POST } from "@/app/api/voice/tools/route";
import { VAPI_SECRET_HEADER } from "@/lib/voice/vapi";
import { rateLimit } from "@/lib/ratelimit";
import { limits } from "@/config/limits";

vi.mock("@/lib/voice/tools", () => ({
  runTool: vi.fn().mockResolvedValue({ result: "spoken result from tool" }),
}));
vi.mock("@/lib/ratelimit", () => ({
  rateLimit: vi.fn().mockResolvedValue({ success: true, remaining: 39, reset: 0 }),
}));

afterEach(() => {
  vi.clearAllMocks();
  vi.mocked(rateLimit).mockResolvedValue({ success: true, remaining: 39, reset: 0 });
});

const SECRET = "test-secret-do-not-use-in-production";
const uniqueCall = () => `call_${Math.random()}`;

function buildRequest(rawBody: string, headers: Record<string, string> = {}): NextRequest {
  return new NextRequest("http://localhost/api/voice/tools", {
    method: "POST",
    headers: { "content-type": "application/json", ...headers },
    body: rawBody,
  });
}

function toolCallsBody(callId: string, calls: { id: string; name: string; parameters: unknown }[]) {
  return JSON.stringify({
    message: {
      type: "tool-calls",
      call: { id: callId },
      // Real Vapi shape nests name/arguments under `function`; kept as a flat
      // {id, name, parameters} convenience at every call site below and wired
      // up here, so the fix for lib/voice/vapi.ts's shape (2026-08-19) only
      // needed changing in one place rather than at each of this file's calls.
      toolCallList: calls.map((c) => ({
        id: c.id,
        function: { name: c.name, arguments: c.parameters },
      })),
    },
  });
}

describe("POST /api/voice/tools", () => {
  it("rejects a request with no secret header, 401, and does not reach the tool", async () => {
    const { runTool } = await import("@/lib/voice/tools");
    const rawBody = toolCallsBody(uniqueCall(), [
      { id: "tc_1", name: "check_availability", parameters: { personaId: "electrician" } },
    ]);

    const req = buildRequest(rawBody);
    const res = await POST(req);

    expect(res.status).toBe(401);
    const body = await res.json();
    expect(body).toEqual({ error: "Unauthorised." });
    expect(vi.mocked(runTool)).not.toHaveBeenCalled();
  });

  it("rejects a wrong secret with 401 and does not reach the tool", async () => {
    const { runTool } = await import("@/lib/voice/tools");
    const rawBody = toolCallsBody(uniqueCall(), [
      { id: "tc_1", name: "check_availability", parameters: {} },
    ]);

    const req = buildRequest(rawBody, { [VAPI_SECRET_HEADER]: "wrong-secret" });
    const res = await POST(req);

    expect(res.status).toBe(401);
    expect(vi.mocked(runTool)).not.toHaveBeenCalled();
  });

  it("reaches the tool and returns Vapi's results envelope for a correctly authenticated request", async () => {
    const { runTool } = await import("@/lib/voice/tools");
    const callId = uniqueCall();
    const rawBody = toolCallsBody(callId, [
      { id: "tc_1", name: "check_availability", parameters: { personaId: "electrician", partOfDay: "any" } },
    ]);

    const req = buildRequest(rawBody, { [VAPI_SECRET_HEADER]: SECRET });
    const res = await POST(req);

    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body).toEqual({
      results: [{ name: "check_availability", toolCallId: "tc_1", result: "spoken result from tool" }],
    });
    expect(vi.mocked(runTool)).toHaveBeenCalledWith("check_availability", callId, {
      personaId: "electrician",
      partOfDay: "any",
    });
  });

  it("dispatches every call in a batch and returns one result per call, in order", async () => {
    const { runTool } = await import("@/lib/voice/tools");
    vi.mocked(runTool)
      .mockResolvedValueOnce({ result: "first result" })
      .mockResolvedValueOnce({ result: "second result" });

    const callId = uniqueCall();
    const rawBody = toolCallsBody(callId, [
      { id: "tc_1", name: "check_availability", parameters: {} },
      { id: "tc_2", name: "capture_lead", parameters: {} },
    ]);

    const req = buildRequest(rawBody, { [VAPI_SECRET_HEADER]: SECRET });
    const res = await POST(req);

    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.results).toEqual([
      { name: "check_availability", toolCallId: "tc_1", result: "first result" },
      { name: "capture_lead", toolCallId: "tc_2", result: "second result" },
    ]);
    expect(vi.mocked(runTool)).toHaveBeenCalledTimes(2);
  });

  it("fails open and still reaches the tool when the rate limiter throws", async () => {
    const { runTool } = await import("@/lib/voice/tools");
    const { rateLimit } = await import("@/lib/ratelimit");
    vi.mocked(rateLimit).mockRejectedValueOnce(new Error("upstash blip"));

    const callId = uniqueCall();
    const rawBody = toolCallsBody(callId, [
      { id: "tc_1", name: "check_availability", parameters: {} },
    ]);

    const req = buildRequest(rawBody, { [VAPI_SECRET_HEADER]: SECRET });
    const res = await POST(req);

    // A limiter outage is not the security boundary (the secret already is),
    // so it must degrade to allowing the call rather than taking the phone
    // line down with a 500.
    expect(res.status).toBe(200);
    expect(vi.mocked(runTool)).toHaveBeenCalledWith("check_availability", callId, {});
  });

  it("gives send_recap_sms its own tighter per-call budget, not the shared 40", async () => {
    const callId = uniqueCall();
    const rawBody = toolCallsBody(callId, [
      {
        id: "tc_1",
        name: "send_recap_sms",
        parameters: { personaId: "electrician", phone: "+353833378541", kind: "callback", name: "Bob" },
      },
    ]);

    const req = buildRequest(rawBody, { [VAPI_SECRET_HEADER]: SECRET });
    await POST(req);

    // The shared limiter is spent across all tools in the batch, so on its own
    // a single authenticated call could text 40 different numbers.
    expect(vi.mocked(rateLimit)).toHaveBeenCalledWith(
      "voice-recap-sms",
      callId,
      limits.voice.recapSmsPerCall.tokens,
      limits.voice.recapSmsPerCall.window
    );
  });

  it("does not spend the recap budget on a tool that sends no text", async () => {
    const rawBody = toolCallsBody(uniqueCall(), [
      { id: "tc_1", name: "check_availability", parameters: {} },
    ]);

    const req = buildRequest(rawBody, { [VAPI_SECRET_HEADER]: SECRET });
    await POST(req);

    const names = vi.mocked(rateLimit).mock.calls.map((c) => c[0]);
    expect(names).not.toContain("voice-recap-sms");
  });

  it("answers the recap limit in speakable words rather than an error, without calling the tool", async () => {
    const { runTool } = await import("@/lib/voice/tools");
    // First call is the shared voice-tool limiter, second is the recap limiter.
    vi.mocked(rateLimit)
      .mockResolvedValueOnce({ success: true, remaining: 39, reset: 0 })
      .mockResolvedValueOnce({ success: false, remaining: 0, reset: 0 });

    const rawBody = toolCallsBody(uniqueCall(), [
      {
        id: "tc_1",
        name: "send_recap_sms",
        parameters: { personaId: "electrician", phone: "+353833378541", kind: "callback", name: "Bob" },
      },
    ]);

    const req = buildRequest(rawBody, { [VAPI_SECRET_HEADER]: SECRET });
    const res = await POST(req);

    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.results[0].result).toMatch(/text/i);
    expect(vi.mocked(runTool)).not.toHaveBeenCalled();
  });

  /**
   * Pins a deliberate ruling rather than an accident. The speakable-200
   * treatment starts once a tool has been dispatched. Before that there is no
   * identified tool to apologise for, and a malformed body from a sender that
   * authenticated correctly is a platform bug that a 200 would smooth over.
   */
  it("returns 400, not a speakable 200, for an authenticated body that does not parse", async () => {
    const { runTool } = await import("@/lib/voice/tools");
    const rawBody = "{ this is not json";

    const req = buildRequest(rawBody, { [VAPI_SECRET_HEADER]: SECRET });
    const res = await POST(req);

    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body).not.toHaveProperty("results");
    expect(vi.mocked(runTool)).not.toHaveBeenCalled();
  });

  it("returns 400 for an authenticated, parsable body that is not the tool-calls shape", async () => {
    const { runTool } = await import("@/lib/voice/tools");
    const rawBody = JSON.stringify({ message: { type: "end-of-call-report" } });

    const req = buildRequest(rawBody, { [VAPI_SECRET_HEADER]: SECRET });
    const res = await POST(req);

    expect(res.status).toBe(400);
    expect(vi.mocked(runTool)).not.toHaveBeenCalled();
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
    const req = new NextRequest("http://localhost/api/voice/tools", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: erroringBody,
      duplex: "half",
    } as unknown as ConstructorParameters<typeof NextRequest>[1]);

    const res = await POST(req);

    // This request was never authenticated, so it must not receive the
    // speakable-200 treatment reserved for authenticated failures.
    expect(res.status).toBe(400);
    expect(vi.mocked(runTool)).not.toHaveBeenCalled();
  });
});

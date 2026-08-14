import { afterEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";
import { POST } from "@/app/api/voice/tools/[tool]/route";
import { signPayload, SIGNATURE_HEADER, TIMESTAMP_HEADER } from "@/lib/voice/auth";

vi.mock("@/lib/voice/tools", () => ({
  runTool: vi.fn().mockResolvedValue({ result: "spoken result from tool" }),
}));
vi.mock("@/lib/ratelimit", () => ({
  rateLimit: vi.fn().mockResolvedValue({ success: true, remaining: 39, reset: 0 }),
}));

afterEach(() => vi.clearAllMocks());

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

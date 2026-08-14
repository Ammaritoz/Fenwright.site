import { describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";
import { POST } from "@/app/api/voice/tools/[tool]/route";
import { signPayload, SIGNATURE_HEADER, TIMESTAMP_HEADER } from "@/lib/voice/auth";

vi.mock("@/lib/voice/tools", () => ({
  runTool: vi.fn().mockResolvedValue({ result: "spoken result from tool" }),
}));

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
});

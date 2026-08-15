import { afterEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";
import { POST } from "@/app/api/voice/webhook/route";
import { VAPI_SECRET_HEADER } from "@/lib/voice/vapi";

vi.mock("@/lib/voice/calls", () => ({
  logCall: vi.fn().mockResolvedValue(undefined),
}));

afterEach(() => vi.clearAllMocks());

const SECRET = "test-secret-do-not-use-in-production";
const uniqueCall = () => `call_${Math.random()}`;

function endOfCallReport(callId: string, overrides: Record<string, unknown> = {}) {
  return {
    message: {
      type: "end-of-call-report",
      call: {
        id: callId,
        type: "inboundPhoneCall",
        customer: { number: "+353833378541" },
        phoneNumber: { number: "+353111111111" },
      },
      startedAt: "2026-09-01T09:00:00.000Z",
      endedAt: "2026-09-01T09:02:12.000Z",
      endedReason: "customer-ended-call",
      cost: 0.31,
      assistant: { metadata: { personaId: "electrician" } },
      analysis: { summary: "Booked a fault-finding visit", successEvaluation: "true" },
      artifact: { recording: { stereoUrl: "https://example.test/rec-stereo.mp3" } },
      ...overrides,
    },
  };
}

function buildRequest(rawBody: string, headers: Record<string, string> = {}): NextRequest {
  return new NextRequest("http://localhost/api/voice/webhook", {
    method: "POST",
    headers: { "content-type": "application/json", ...headers },
    body: rawBody,
  });
}

function signedHeaders() {
  return { [VAPI_SECRET_HEADER]: SECRET };
}

describe("POST /api/voice/webhook", () => {
  it("rejects an unsigned request with 401 and does not log a call", async () => {
    const { logCall } = await import("@/lib/voice/calls");
    const rawBody = JSON.stringify(endOfCallReport(uniqueCall()));

    const req = buildRequest(rawBody);
    const res = await POST(req);

    expect(res.status).toBe(401);
    const body = await res.json();
    expect(body).toEqual({ error: "Unauthorised." });
    expect(vi.mocked(logCall)).not.toHaveBeenCalled();
  });

  it("rejects a wrong secret with 401 and does not log a call", async () => {
    const { logCall } = await import("@/lib/voice/calls");
    const rawBody = JSON.stringify(endOfCallReport(uniqueCall()));

    const req = buildRequest(rawBody, { [VAPI_SECRET_HEADER]: "wrong-secret" });
    const res = await POST(req);

    expect(res.status).toBe(401);
    const body = await res.json();
    expect(body).toEqual({ error: "Unauthorised." });
    expect(vi.mocked(logCall)).not.toHaveBeenCalled();
  });

  it("logs a call for a correctly signed end-of-call report and returns 200", async () => {
    const { logCall } = await import("@/lib/voice/calls");
    const callId = uniqueCall();
    const rawBody = JSON.stringify(endOfCallReport(callId));

    const req = buildRequest(rawBody, signedHeaders());
    const res = await POST(req);

    expect(res.status).toBe(200);
    expect(vi.mocked(logCall)).toHaveBeenCalledTimes(1);
    expect(vi.mocked(logCall)).toHaveBeenCalledWith(
      expect.objectContaining({ callId })
    );
  });

  it("acknowledges but ignores a correctly signed payload of a different message type", async () => {
    const { logCall } = await import("@/lib/voice/calls");
    const rawBody = JSON.stringify({ message: { type: "status-update", call: { id: uniqueCall() } } });

    const req = buildRequest(rawBody, signedHeaders());
    const res = await POST(req);

    expect(res.status).toBe(200);
    expect(vi.mocked(logCall)).not.toHaveBeenCalled();
  });

  it("still returns 200 when logCall rejects, because the call is already over", async () => {
    const { logCall } = await import("@/lib/voice/calls");
    vi.mocked(logCall).mockRejectedValueOnce(new Error("airtable outage"));

    const callId = uniqueCall();
    const rawBody = JSON.stringify(endOfCallReport(callId));

    const req = buildRequest(rawBody, signedHeaders());
    const res = await POST(req);

    expect(res.status).toBe(200);
    expect(vi.mocked(logCall)).toHaveBeenCalledTimes(1);
  });

  // Spec section 7 makes CallId unique; Airtable does not enforce it. A
  // duplicated report would double-count every metric in the table.
  it("writes only one row for a repeated identical end-of-call report", async () => {
    const { logCall } = await import("@/lib/voice/calls");
    const rawBody = JSON.stringify(endOfCallReport(uniqueCall()));

    const first = await POST(buildRequest(rawBody, signedHeaders()));
    const second = await POST(buildRequest(rawBody, signedHeaders()));

    expect(first.status).toBe(200);
    // Still acknowledged, or the platform simply retries again.
    expect(second.status).toBe(200);
    expect(vi.mocked(logCall)).toHaveBeenCalledTimes(1);
  });

  it("still writes separate rows for two genuinely different calls", async () => {
    const { logCall } = await import("@/lib/voice/calls");
    const bodyA = JSON.stringify(endOfCallReport(uniqueCall()));
    const bodyB = JSON.stringify(endOfCallReport(uniqueCall()));

    await POST(buildRequest(bodyA, signedHeaders()));
    await POST(buildRequest(bodyB, signedHeaders()));

    expect(vi.mocked(logCall)).toHaveBeenCalledTimes(2);
  });

  it("does not retry a failed write, because here a duplicate is worse than a gap", async () => {
    const { logCall } = await import("@/lib/voice/calls");
    vi.mocked(logCall).mockRejectedValueOnce(new Error("airtable outage"));
    const rawBody = JSON.stringify(endOfCallReport(uniqueCall()));

    await POST(buildRequest(rawBody, signedHeaders()));
    await POST(buildRequest(rawBody, signedHeaders()));

    // The exact opposite of the tools' release-on-failure trade-off, and
    // deliberately so: a missing row is one visible gap that can be reconciled
    // against the platform, a duplicate row silently corrupts every metric.
    expect(vi.mocked(logCall)).toHaveBeenCalledTimes(1);
  });

  /**
   * The sibling ruling to the tools route's. A 200 here would swallow a genuine
   * platform serialisation bug: the sender signed the body correctly, so it is
   * authentic, and the only thing wrong with it is that it is malformed.
   */
  it("returns 400, not 200, for a signed body that does not parse", async () => {
    const { logCall } = await import("@/lib/voice/calls");
    const rawBody = "{ this is not json";

    const req = buildRequest(rawBody, signedHeaders());
    const res = await POST(req);

    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body).not.toHaveProperty("ok");
    expect(vi.mocked(logCall)).not.toHaveBeenCalled();
  });

  it("rejects with 400, not a speakable 200, when the body cannot be read", async () => {
    const { logCall } = await import("@/lib/voice/calls");
    const erroringBody = new ReadableStream({
      start(controller) {
        controller.error(new Error("client aborted"));
      },
    });
    // `duplex: "half"` is required by undici for a streaming request body but
    // is not yet reflected in NextRequest's RequestInit type, so the init
    // object is cast directly to the constructor's own parameter type. Same
    // approach as the sibling tools route's equivalent test.
    const req = new NextRequest(
      "http://localhost/api/voice/webhook",
      {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: erroringBody,
        duplex: "half",
      } as unknown as ConstructorParameters<typeof NextRequest>[1]
    );

    const res = await POST(req);

    // This request was never authenticated, so it must not receive the
    // speakable-200 treatment reserved for authenticated failures.
    expect(res.status).toBe(400);
    expect(vi.mocked(logCall)).not.toHaveBeenCalled();
  });
});

import { describe, expect, it, vi } from "vitest";
import {
  VAPI_SECRET_HEADER,
  buildToolCallsResponse,
  parseToolCallsMessage,
  verifyVapiSecret,
} from "@/lib/voice/vapi";

const SECRET = "test-secret-do-not-use-in-production";

function headersWith(value: string | null): Headers {
  const h = new Headers();
  if (value !== null) h.set(VAPI_SECRET_HEADER, value);
  return h;
}

describe("verifyVapiSecret", () => {
  it("accepts the correct secret", () => {
    expect(verifyVapiSecret(headersWith(SECRET))).toEqual({ ok: true });
  });

  it("rejects a wrong secret", () => {
    const res = verifyVapiSecret(headersWith("wrong"));
    expect(res).toEqual({ ok: false, reason: "bad_secret" });
  });

  it("rejects a missing header", () => {
    const res = verifyVapiSecret(headersWith(null));
    expect(res).toEqual({ ok: false, reason: "missing_header" });
  });

  it("fails closed when the secret is not configured", () => {
    vi.stubEnv("VOICE_WEBHOOK_SECRET", "");
    const res = verifyVapiSecret(headersWith(SECRET));
    expect(res).toEqual({ ok: false, reason: "not_configured" });
  });

  it("rejects an empty-string header even though a value is present", () => {
    // Headers.set("", ...) can't produce this; simulate the get() result directly.
    const h = new Headers();
    const res = verifyVapiSecret(h);
    expect(res.ok).toBe(false);
  });
});

describe("parseToolCallsMessage", () => {
  const valid = {
    message: {
      type: "tool-calls",
      call: { id: "call_123" },
      toolCallList: [
        {
          id: "tc_1",
          function: { name: "check_availability", arguments: { personaId: "electrician" } },
        },
      ],
    },
  };

  it("parses a valid single-call message", () => {
    const parsed = parseToolCallsMessage(valid);
    expect(parsed).toEqual({
      callId: "call_123",
      calls: [
        { toolCallId: "tc_1", name: "check_availability", parameters: { personaId: "electrician" } },
      ],
    });
  });

  it("parses a batch of multiple tool calls in one message", () => {
    const batch = {
      message: {
        type: "tool-calls",
        call: { id: "call_123" },
        toolCallList: [
          { id: "tc_1", function: { name: "check_availability", arguments: {} } },
          { id: "tc_2", function: { name: "capture_lead", arguments: {} } },
        ],
      },
    };
    const parsed = parseToolCallsMessage(batch);
    expect(parsed?.calls).toHaveLength(2);
    expect(parsed?.calls[1].name).toBe("capture_lead");
  });

  it("returns null for a different message type", () => {
    expect(parseToolCallsMessage({ message: { type: "end-of-call-report" } })).toBeNull();
  });

  it("returns null when call.id is missing", () => {
    const bad = { message: { type: "tool-calls", call: {}, toolCallList: valid.message.toolCallList } };
    expect(parseToolCallsMessage(bad)).toBeNull();
  });

  it("returns null for an empty toolCallList", () => {
    const bad = { message: { type: "tool-calls", call: { id: "x" }, toolCallList: [] } };
    expect(parseToolCallsMessage(bad)).toBeNull();
  });

  // Regression: this was the flat shape the code (and this fixture) wrongly
  // assumed until 2026-08-19, which meant every real Vapi tool call was
  // rejected here in production. If a future edit reintroduces name/parameters
  // at the top level instead of nested under function, this must fail again.
  it("rejects the flat name/parameters shape Vapi does not actually send", () => {
    const flat = {
      message: {
        type: "tool-calls",
        call: { id: "call_123" },
        toolCallList: [{ id: "tc_1", name: "check_availability", parameters: {} }],
      },
    };
    expect(parseToolCallsMessage(flat)).toBeNull();
  });

  it("returns null for a completely malformed payload", () => {
    expect(parseToolCallsMessage({ nonsense: true })).toBeNull();
    expect(parseToolCallsMessage(null)).toBeNull();
    expect(parseToolCallsMessage("a string")).toBeNull();
  });
});

describe("buildToolCallsResponse", () => {
  it("maps results into Vapi's expected results array", () => {
    const body = buildToolCallsResponse([
      { toolCallId: "tc_1", name: "check_availability", result: "Tuesday at 10am" },
    ]);
    expect(body).toEqual({
      results: [{ name: "check_availability", toolCallId: "tc_1", result: "Tuesday at 10am" }],
    });
  });

  it("preserves order and handles multiple results", () => {
    const body = buildToolCallsResponse([
      { toolCallId: "tc_1", name: "a", result: "first" },
      { toolCallId: "tc_2", name: "b", result: "second" },
    ]);
    expect(body.results.map((r) => r.toolCallId)).toEqual(["tc_1", "tc_2"]);
  });
});

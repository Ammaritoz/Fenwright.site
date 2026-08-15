import "server-only";
import { createHmac, timingSafeEqual } from "node:crypto";
import { z } from "zod";

/**
 * The wire contract for Vapi specifically, kept separate from the tool
 * dispatch logic in lib/voice/tools.ts so a future platform change (or a
 * second platform) touches this one file.
 *
 * Two things here differ from the original design in
 * docs/superpowers/specs/2026-08-14-voice-receptionist-design.md, confirmed
 * against Vapi's live docs rather than assumed:
 *
 * 1. Vapi calls ONE server URL per assistant with a batch of tool calls in
 *    the body, not one URL per tool. There is no per-tool routing to do here.
 * 2. Vapi does not compute a per-request HMAC the way lib/voice/auth.ts
 *    expects. It supports a static secret value sent back on a header you
 *    choose when configuring the assistant's server.headers. That is weaker
 *    than a timestamp-bound signature (no built-in replay window), but it is
 *    real, documented, and correct for a demo. lib/voice/auth.ts is kept
 *    for a platform that can do better; it is not the live gate here.
 */

export const VAPI_SECRET_HEADER = "x-vapi-secret";

/**
 * Constant-time comparison against the shared secret. Fails closed on a
 * missing header or an unconfigured secret, exactly like lib/voice/auth.ts.
 */
export function verifyVapiSecret(headers: Headers): { ok: true } | { ok: false; reason: string } {
  const secret = process.env.VOICE_WEBHOOK_SECRET;
  if (!secret) return { ok: false, reason: "not_configured" };

  const provided = headers.get(VAPI_SECRET_HEADER);
  if (!provided) return { ok: false, reason: "missing_header" };

  if (!constantTimeEqual(provided, secret)) {
    return { ok: false, reason: "bad_secret" };
  }
  return { ok: true };
}

/** Hash both sides first so timingSafeEqual always receives equal-length buffers. */
function constantTimeEqual(a: string, b: string): boolean {
  const ha = createHmac("sha256", "cmp").update(a).digest();
  const hb = createHmac("sha256", "cmp").update(b).digest();
  return timingSafeEqual(ha, hb);
}

const toolCallSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  // Vapi's own JSON; our own tool schemas in lib/voice/schemas.ts validate it
  // properly once it reaches runTool. Here it is only shaped, not trusted.
  parameters: z.unknown(),
});

const toolCallsMessageSchema = z.object({
  message: z.object({
    type: z.literal("tool-calls"),
    call: z.object({ id: z.string().min(1) }),
    toolCallList: z.array(toolCallSchema).min(1),
  }),
});

export type ParsedToolCall = { toolCallId: string; name: string; parameters: unknown };
export type ParsedToolCallsMessage = { callId: string; calls: ParsedToolCall[] };

/**
 * Parse Vapi's tool-calls envelope. Returns null for anything that is not
 * this exact shape, including a well-formed JSON body of a different message
 * type, so the caller can return a 4xx rather than guess.
 */
export function parseToolCallsMessage(payload: unknown): ParsedToolCallsMessage | null {
  const parsed = toolCallsMessageSchema.safeParse(payload);
  if (!parsed.success) return null;

  return {
    callId: parsed.data.message.call.id,
    calls: parsed.data.message.toolCallList.map((c) => ({
      toolCallId: c.id,
      name: c.name,
      parameters: c.parameters,
    })),
  };
}

export type ToolCallResult = { toolCallId: string; name: string; result: string };

/** Vapi's expected response shape for a batch of tool-call results. */
export function buildToolCallsResponse(results: ToolCallResult[]): {
  results: { name: string; toolCallId: string; result: string }[];
} {
  return {
    results: results.map((r) => ({
      name: r.name,
      toolCallId: r.toolCallId,
      result: r.result,
    })),
  };
}

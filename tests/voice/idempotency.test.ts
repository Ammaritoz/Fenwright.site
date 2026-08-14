import { describe, expect, it } from "vitest";
import { claimOnce, idempotencyKey } from "@/lib/voice/idempotency";

describe("claimOnce", () => {
  it("returns true the first time and false after", async () => {
    const key = `test-${Math.random()}`;
    expect(await claimOnce(key)).toBe(true);
    expect(await claimOnce(key)).toBe(false);
    expect(await claimOnce(key)).toBe(false);
  });

  it("treats different keys independently", async () => {
    expect(await claimOnce(`a-${Math.random()}`)).toBe(true);
    expect(await claimOnce(`b-${Math.random()}`)).toBe(true);
  });
});

describe("idempotencyKey", () => {
  it("is stable for identical arguments", () => {
    const a = idempotencyKey("call1", "book", { slot: "10:00" });
    const b = idempotencyKey("call1", "book", { slot: "10:00" });
    expect(a).toBe(b);
  });

  it("differs when arguments differ", () => {
    const a = idempotencyKey("call1", "book", { slot: "10:00" });
    const b = idempotencyKey("call1", "book", { slot: "11:00" });
    expect(a).not.toBe(b);
  });

  it("differs across calls", () => {
    const a = idempotencyKey("call1", "book", { slot: "10:00" });
    const b = idempotencyKey("call2", "book", { slot: "10:00" });
    expect(a).not.toBe(b);
  });

  it("ignores key order in the arguments object", () => {
    const a = idempotencyKey("call1", "book", { x: 1, y: 2 });
    const b = idempotencyKey("call1", "book", { y: 2, x: 1 });
    expect(a).toBe(b);
  });
});

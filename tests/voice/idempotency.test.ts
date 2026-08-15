import { afterEach, describe, expect, it, vi } from "vitest";
import { claimOnce, idempotencyKey, releaseClaim } from "@/lib/voice/idempotency";

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

describe("releaseClaim", () => {
  it("allows a subsequent claimOnce to succeed again after release", async () => {
    const key = `release-${Math.random()}`;
    expect(await claimOnce(key)).toBe(true);
    expect(await claimOnce(key)).toBe(false);

    await releaseClaim(key);

    expect(await claimOnce(key)).toBe(true);
  });

  it("resolves without throwing for a key that was never claimed", async () => {
    const key = `never-claimed-${Math.random()}`;
    await expect(releaseClaim(key)).resolves.toBeUndefined();
  });
});

/**
 * hasUpstash is read once at module load, so these tests stub the env and
 * re-import rather than trying to flip it in place.
 */
async function loadWithUpstash(redisImpl: Record<string, unknown>) {
  vi.resetModules();
  vi.stubEnv("UPSTASH_REDIS_REST_URL", "https://redis.example.test");
  vi.stubEnv("UPSTASH_REDIS_REST_TOKEN", "test-token");
  vi.doMock("@upstash/redis", () => ({
    Redis: class {
      set = redisImpl.set;
      del = redisImpl.del;
    },
  }));
  return import("@/lib/voice/idempotency");
}

describe("claimOnce during a Redis outage", () => {
  afterEach(() => {
    vi.doUnmock("@upstash/redis");
    vi.resetModules();
  });

  // Regression: this await was unguarded, so one Upstash incident took every
  // booking, lead capture and recap SMS offline for its duration.
  it("falls back to the in-memory store rather than rejecting", async () => {
    const outage = () => Promise.reject(new Error("upstash outage"));
    const { claimOnce } = await loadWithUpstash({ set: outage, del: outage });

    const key = `outage-${Math.random()}`;
    await expect(claimOnce(key)).resolves.toBe(true);
    // The per-instance fallback still catches the common same-warm-instance
    // retry, which is the case the platform's timeout retry actually produces.
    await expect(claimOnce(key)).resolves.toBe(false);
  });

  it("keeps releaseClaim behaving the same way, so one outage means one behaviour", async () => {
    const outage = () => Promise.reject(new Error("upstash outage"));
    const { claimOnce, releaseClaim } = await loadWithUpstash({ set: outage, del: outage });

    const key = `outage-release-${Math.random()}`;
    expect(await claimOnce(key)).toBe(true);
    await expect(releaseClaim(key)).resolves.toBeUndefined();
    expect(await claimOnce(key)).toBe(true);
  });

  it("uses Redis normally when it is healthy", async () => {
    const set = vi.fn().mockResolvedValue("OK");
    const { claimOnce } = await loadWithUpstash({ set, del: vi.fn() });

    await expect(claimOnce("healthy-key")).resolves.toBe(true);
    expect(set).toHaveBeenCalledOnce();
  });
});

describe("unconfigured Upstash", () => {
  afterEach(() => vi.resetModules());

  // The tools route always calls rateLimit first, so its warnOnce covered this
  // module by accident. The webhook route reaches claimOnce without touching a
  // limiter, so the warning has to live here too.
  it("warns once that the in-memory store is not production configuration", async () => {
    vi.resetModules();
    vi.stubEnv("UPSTASH_REDIS_REST_URL", "");
    vi.stubEnv("UPSTASH_REDIS_REST_TOKEN", "");
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});

    const { claimOnce, releaseClaim } = await import("@/lib/voice/idempotency");
    await claimOnce(`unconfigured-${Math.random()}`);
    await claimOnce(`unconfigured-${Math.random()}`);
    await releaseClaim(`unconfigured-${Math.random()}`);

    const upstashWarnings = warn.mock.calls.filter((c) => String(c[0]).includes("Upstash"));
    expect(upstashWarnings).toHaveLength(1);
    warn.mockRestore();
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

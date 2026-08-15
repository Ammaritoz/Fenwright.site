import "server-only";
import { createHash } from "node:crypto";
import { Redis } from "@upstash/redis";
import { errMeta } from "@/lib/log";

const hasUpstash = Boolean(
  process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN
);

let redis: Redis | null = null;
function getRedis(): Redis {
  if (!redis) {
    redis = new Redis({
      url: process.env.UPSTASH_REDIS_REST_URL!,
      token: process.env.UPSTASH_REDIS_REST_TOKEN!,
    });
  }
  return redis;
}

/**
 * Same shape as lib/ratelimit.ts. It is repeated here rather than shared
 * because the coupling that let it be omitted no longer holds: the tools route
 * always calls rateLimit first, so its warning covered this module too, but the
 * webhook route reaches claimOnce without touching a limiter at all. An unset
 * Upstash config in production must be visible from either entry point.
 */
let warned = false;
function warnOnce() {
  if (!warned && !hasUpstash) {
    warned = true;
    console.warn(
      "[fenwright] Upstash env vars not set. Using in-memory idempotency store. " +
        "This is fine for local dev but MUST be configured in production."
    );
  }
}

const memStore = new Map<string, number>();

function memClaim(namespaced: string, ttlSeconds: number): boolean {
  const now = Date.now();
  const expiresAt = memStore.get(namespaced);
  if (expiresAt && expiresAt > now) return false;
  memStore.set(namespaced, now + ttlSeconds * 1000);
  return true;
}

/**
 * Claim a key exactly once within the TTL.
 *
 * Returns true for the first caller and false for every repeat, so a retried
 * tool call cannot book twice. The in-memory fallback is per-process and exists
 * only so local dev works without Redis; production must set the Upstash vars.
 */
export async function claimOnce(key: string, ttlSeconds = 3600): Promise<boolean> {
  warnOnce();
  const namespaced = `fenwright:once:${key}`;

  if (hasUpstash) {
    try {
      const res = await getRedis().set(namespaced, "1", { nx: true, ex: ttlSeconds });
      return res === "OK";
    } catch (err) {
      // Degrade to the in-memory path rather than throwing.
      //
      // This await was the last unguarded Upstash call in the live call path.
      // releaseClaim below already caught, and the tools route was deliberately
      // made fail-open for exactly this outage, so a single Redis incident used
      // to produce three different behaviours inside one request. Worse, a
      // throw here takes every booking, lead capture and recap SMS offline for
      // as long as the outage lasts.
      //
      // The fallback is per-instance, which still catches the common case: the
      // platform retries on timeout and usually lands back on the same warm
      // instance. Across instances it is weaker, so a narrow double-booking
      // window opens while Redis is down. That is the better failure. A caller
      // booked twice can be rung and sorted out; a receptionist that cannot
      // book at all is a lost job on every call.
      console.error(
        "[fenwright] claimOnce Redis unavailable, falling back to memory:",
        errMeta(err)
      );
      return memClaim(namespaced, ttlSeconds);
    }
  }

  return memClaim(namespaced, ttlSeconds);
}

/**
 * Release a claim so a failed action can genuinely be retried.
 *
 * claimOnce is deliberately claim-before-act, because the platform retries on
 * timeout and the first attempt may still be in flight. That ordering is what
 * prevents a double booking, but it means a failed action would otherwise hold
 * its key for the full TTL and report false success to an honest retry.
 */
export async function releaseClaim(key: string): Promise<void> {
  warnOnce();
  const namespaced = `fenwright:once:${key}`;

  if (hasUpstash) {
    try {
      await getRedis().del(namespaced);
      return;
    } catch (err) {
      // Deliberately the same shape as claimOnce: log and fall through to the
      // in-memory path. Best effort either way, since a claim Redis is still
      // holding expires with its TTL.
      console.error(
        "[fenwright] releaseClaim Redis unavailable, falling back to memory:",
        errMeta(err)
      );
    }
  }

  memStore.delete(namespaced);
}

/** Stable key for a tool invocation. Object key order must not matter. */
export function idempotencyKey(callId: string, tool: string, args: unknown): string {
  const canonical = JSON.stringify(sortDeep(args));
  const digest = createHash("sha256").update(canonical).digest("hex").slice(0, 32);
  return `${callId}:${tool}:${digest}`;
}

function sortDeep(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(sortDeep);
  if (value && typeof value === "object") {
    return Object.fromEntries(
      Object.entries(value as Record<string, unknown>)
        .sort(([a], [b]) => a.localeCompare(b))
        .map(([k, v]) => [k, sortDeep(v)])
    );
  }
  return value;
}

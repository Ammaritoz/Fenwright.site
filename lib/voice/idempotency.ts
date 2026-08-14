import "server-only";
import { createHash } from "node:crypto";
import { Redis } from "@upstash/redis";

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

const memStore = new Map<string, number>();

/**
 * Claim a key exactly once within the TTL.
 *
 * Returns true for the first caller and false for every repeat, so a retried
 * tool call cannot book twice. The in-memory fallback is per-process and exists
 * only so local dev works without Redis; production must set the Upstash vars.
 */
export async function claimOnce(key: string, ttlSeconds = 3600): Promise<boolean> {
  const namespaced = `fenwright:once:${key}`;

  if (hasUpstash) {
    const res = await getRedis().set(namespaced, "1", { nx: true, ex: ttlSeconds });
    return res === "OK";
  }

  const now = Date.now();
  const expiresAt = memStore.get(namespaced);
  if (expiresAt && expiresAt > now) return false;
  memStore.set(namespaced, now + ttlSeconds * 1000);
  return true;
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

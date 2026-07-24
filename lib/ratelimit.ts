import "server-only";
import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";

/**
 * Rate limiting with Upstash Redis in production, and an in-memory fallback
 * for local dev when the Upstash env vars are absent.
 *
 * The in-memory limiter is per-process and resets on restart. It exists only so
 * `npm run dev` works without a Redis account. Production MUST use Upstash.
 */

type Duration = `${number} ${"s" | "m" | "h" | "d"}`;

export type LimitResult = { success: boolean; remaining: number; reset: number };

const hasUpstash = Boolean(
  process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN
);

let warned = false;
function warnOnce() {
  if (!warned && !hasUpstash) {
    warned = true;
    console.warn(
      "[fenwright] Upstash env vars not set. Using in-memory rate limiter. " +
        "This is fine for local dev but MUST be configured in production."
    );
  }
}

// ---- Upstash path ----
let redis: Redis | null = null;
const upstashLimiters = new Map<string, Ratelimit>();

function upstashLimiter(name: string, tokens: number, window: Duration): Ratelimit {
  if (!redis) {
    redis = new Redis({
      url: process.env.UPSTASH_REDIS_REST_URL!,
      token: process.env.UPSTASH_REDIS_REST_TOKEN!,
    });
  }
  const key = `${name}:${tokens}:${window}`;
  let limiter = upstashLimiters.get(key);
  if (!limiter) {
    limiter = new Ratelimit({
      redis,
      limiter: Ratelimit.slidingWindow(tokens, window),
      prefix: `fenwright:rl:${name}`,
      analytics: false,
    });
    upstashLimiters.set(key, limiter);
  }
  return limiter;
}

// ---- In-memory fallback ----
type Bucket = { count: number; resetAt: number };
const memStore = new Map<string, Bucket>();

function parseWindowMs(window: Duration): number {
  const [num, unit] = window.split(" ");
  const n = Number(num);
  const mult = unit === "s" ? 1e3 : unit === "m" ? 6e4 : unit === "h" ? 36e5 : 864e5;
  return n * mult;
}

function memLimit(
  name: string,
  identifier: string,
  tokens: number,
  window: Duration
): LimitResult {
  const now = Date.now();
  const key = `${name}:${identifier}`;
  const windowMs = parseWindowMs(window);
  const bucket = memStore.get(key);

  if (!bucket || bucket.resetAt <= now) {
    const resetAt = now + windowMs;
    memStore.set(key, { count: 1, resetAt });
    return { success: true, remaining: tokens - 1, reset: resetAt };
  }

  if (bucket.count < tokens) {
    bucket.count += 1;
    return { success: true, remaining: tokens - bucket.count, reset: bucket.resetAt };
  }

  return { success: false, remaining: 0, reset: bucket.resetAt };
}

/**
 * Consume one token from a named limiter for the given identifier.
 * `name` groups a limiter family (e.g. "demo-reply"), identifier is usually an IP or phone.
 */
export async function rateLimit(
  name: string,
  identifier: string,
  tokens: number,
  window: Duration
): Promise<LimitResult> {
  warnOnce();
  if (hasUpstash) {
    const res = await upstashLimiter(name, tokens, window).limit(identifier);
    return { success: res.success, remaining: res.remaining, reset: res.reset };
  }
  return memLimit(name, identifier, tokens, window);
}

/**
 * A simple monotonic daily counter, used for the global demo SMS cap.
 * Returns the value AFTER incrementing. Uses Upstash INCR + EXPIRE, or memory.
 */
export async function incrementDailyCounter(name: string): Promise<number> {
  warnOnce();
  const day = new Date().toISOString().slice(0, 10); // YYYY-MM-DD (UTC)
  const key = `fenwright:count:${name}:${day}`;

  if (hasUpstash) {
    if (!redis) {
      redis = new Redis({
        url: process.env.UPSTASH_REDIS_REST_URL!,
        token: process.env.UPSTASH_REDIS_REST_TOKEN!,
      });
    }
    const value = await redis.incr(key);
    if (value === 1) {
      // first write today: expire after 48h so it self-cleans
      await redis.expire(key, 60 * 60 * 48);
    }
    return value;
  }

  const now = Date.now();
  const bucket = memStore.get(key);
  if (!bucket || bucket.resetAt <= now) {
    memStore.set(key, { count: 1, resetAt: now + 864e5 });
    return 1;
  }
  bucket.count += 1;
  return bucket.count;
}

export const usingUpstash = hasUpstash;

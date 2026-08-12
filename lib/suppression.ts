import "server-only";
import { Redis } from "@upstash/redis";
import { errMeta } from "@/lib/log";

/**
 * Cold-outreach unsubscribe list, stored as a Redis set in the same Upstash
 * instance already required for rate limiting. There is no in-memory/local
 * fallback here (unlike ratelimit.ts): an unsubscribe that silently didn't
 * persist is a compliance problem, not a degraded-but-safe fallback, so a
 * misconfigured deployment should fail loudly (addUnsubscribe returns false)
 * rather than pretend to succeed.
 *
 * The outreach pipeline (a separate local project, see
 * outreach/send_drip.py) reads this same set over Upstash's REST API and
 * merges new entries into its own suppression.csv on every send run.
 */
const SUPPRESSION_SET_KEY = "fenwright:unsubscribed";

let redis: Redis | null = null;

function getRedis(): Redis | null {
  const url = process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN;
  if (!url || !token) return null;
  if (!redis) {
    redis = new Redis({ url, token });
  }
  return redis;
}

/** Adds an email to the unsubscribe set. Idempotent. Returns false only if Upstash isn't configured or the write failed. */
export async function addUnsubscribe(email: string): Promise<boolean> {
  const r = getRedis();
  if (!r) {
    console.warn("[fenwright] Upstash not configured, cannot record unsubscribe:", email);
    return false;
  }
  try {
    await r.sadd(SUPPRESSION_SET_KEY, email.toLowerCase().trim());
    return true;
  } catch (err) {
    console.error("[fenwright] failed to record unsubscribe:", errMeta(err));
    return false;
  }
}

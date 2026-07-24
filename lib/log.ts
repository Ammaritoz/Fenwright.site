/**
 * Extract non-PII metadata from a thrown error for server-side logging.
 *
 * Twilio and Airtable error objects can embed visitor PII (phone numbers,
 * message bodies, or the request payload) in their `.message`. We log only
 * stable, non-identifying fields so that PII never lands in server logs. For
 * Twilio this also happens to preserve the most useful signal: the numeric
 * error `code` (e.g. 21608 "unverified number", 21408 "geo permission").
 */
export function errMeta(err: unknown): Record<string, unknown> {
  if (err && typeof err === "object") {
    const e = err as Record<string, unknown>;
    return {
      name: e.name,
      code: e.code,
      status: e.status ?? e.statusCode,
    };
  }
  return { value: String(err) };
}

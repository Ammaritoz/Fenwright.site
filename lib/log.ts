/**
 * Extract non-PII metadata from a thrown error for server-side logging.
 *
 * Carrier and Airtable error objects can embed visitor PII (phone numbers,
 * message bodies, or the request payload) in their `.message`. We log only
 * stable, non-identifying fields so that PII never lands in server logs. For
 * SMS failures this also preserves the most useful signal: the provider's
 * numeric error `code`.
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

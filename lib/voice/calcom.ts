import "server-only";
import { errMeta } from "@/lib/log";
import { limits } from "@/config/limits";

const DEFAULT_TZ = "Europe/Dublin";

/**
 * Cal.com's EU data-residency accounts (app.cal.eu) run on genuinely separate
 * infrastructure from api.cal.com, including auth: a key issued in an EU
 * tenant is not recognised there and fails "Invalid API Key" with no hint
 * that the host is the actual problem. Overridable per client via
 * CALCOM_API_BASE rather than hardcoded, since a future client may be on
 * either host. Confirmed empirically against a live cal.eu account.
 */
function apiBase(): string {
  return process.env.CALCOM_API_BASE || "https://api.cal.com/v2";
}

/**
 * A tool handler has 8 seconds before the live conversation notices, so neither
 * request here is allowed to run to fetch's own (effectively unbounded) default.
 * Both resolve to this module's existing failure sentinel on expiry, because a
 * receptionist who says "I do not have anything showing" is recoverable and one
 * who says nothing at all is not.
 */
const TIMEOUT_MS = limits.voice.externalTimeoutMs;

export type Slot = { startIso: string; spoken: string };

export type PartOfDay = "morning" | "afternoon" | "evening" | "any";

/**
 * Render an instant the way a receptionist says it out loud.
 * "Tuesday the 1st of September at 10am" reads correctly through text-to-speech;
 * an ISO string does not.
 */
export function spokenTime(iso: string, timeZone: string = DEFAULT_TZ): string {
  const date = new Date(iso);
  const parts = new Intl.DateTimeFormat("en-IE", {
    timeZone,
    weekday: "long",
    day: "numeric",
    month: "long",
    hour: "numeric",
    minute: "numeric",
    hour12: true,
  }).formatToParts(date);

  const get = (type: string) => parts.find((p) => p.type === type)?.value ?? "";
  const day = Number(get("day"));
  const hour = get("hour");
  const minute = get("minute");
  const meridiem = get("dayPeriod").toLowerCase().replace(/\./g, "").replace(/\s/g, "");
  const clock = minute === "00" ? `${hour}${meridiem}` : `${hour}.${minute}${meridiem}`;

  return `${get("weekday")} the ${ordinal(day)} of ${get("month")} at ${clock}`;
}

function ordinal(n: number): string {
  const suffix =
    n % 10 === 1 && n % 100 !== 11
      ? "st"
      : n % 10 === 2 && n % 100 !== 12
      ? "nd"
      : n % 10 === 3 && n % 100 !== 13
      ? "rd"
      : "th";
  return `${n}${suffix}`;
}

function hourInZone(iso: string, timeZone: string): number {
  return Number(
    new Intl.DateTimeFormat("en-GB", { timeZone, hour: "numeric", hour12: false }).format(
      new Date(iso)
    )
  );
}

function matchesPartOfDay(iso: string, part: PartOfDay, timeZone: string): boolean {
  if (part === "any") return true;
  const hour = hourInZone(iso, timeZone);
  if (part === "morning") return hour < 12;
  if (part === "afternoon") return hour >= 12 && hour < 17;
  return hour >= 17;
}

/**
 * Real availability from Cal.com. Returns at most `limit` options because a
 * caller cannot hold more than three times in their head.
 * Never throws: a booking failure must become spoken words, not a 500.
 */
export async function getAvailability({
  fromIso,
  partOfDay = "any",
  limit = 3,
  timeZone = DEFAULT_TZ,
}: {
  fromIso?: string;
  partOfDay?: PartOfDay;
  limit?: number;
  timeZone?: string;
}): Promise<Slot[]> {
  const apiKey = process.env.CALCOM_API_KEY;
  const eventTypeId = process.env.CALCOM_EVENT_TYPE_ID;
  if (!apiKey || !eventTypeId) {
    console.warn("[fenwright] Cal.com not configured, returning no availability");
    return [];
  }

  // Same AbortController shape as forwardToN8n in app/api/contact/route.ts.
  const controller = new AbortController();
  let timedOut = false;
  const timer = setTimeout(() => {
    timedOut = true;
    controller.abort();
  }, TIMEOUT_MS);

  try {
    const start = fromIso ? new Date(fromIso) : new Date();
    const end = new Date(start.getTime() + 14 * 864e5);

    const url = new URL(`${apiBase()}/slots`);
    url.searchParams.set("eventTypeId", eventTypeId);
    // start/end.toISOString() throw on an invalid fromIso (e.g. a malformed
    // caller argument), so date maths lives inside this try alongside the
    // network call: any failure here must also become [], never a throw.
    url.searchParams.set("start", start.toISOString());
    url.searchParams.set("end", end.toISOString());
    url.searchParams.set("timeZone", timeZone);

    const res = await fetch(url, {
      headers: { Authorization: `Bearer ${apiKey}`, "cal-api-version": "2024-09-04" },
      cache: "no-store",
      signal: controller.signal,
    });
    if (!res.ok) {
      // A non-ok response returns [] the same as genuine "no slots", which is
      // right for the caller: both are "nothing to offer". But silently, that
      // is indistinguishable from a misconfigured key, wrong host, or an
      // event type that no longer exists, and the receptionist would say "I
      // do not have anything showing" forever with no trace of why. Log the
      // status so a misconfiguration is loud here even though it stays quiet
      // on the call.
      console.error(
        `[fenwright] Cal.com availability request failed: ${res.status} ${await res.text()}`
      );
      return [];
    }
    const body = (await res.json()) as {
      data?: { slots?: Record<string, Array<{ start: string }>> };
    };

    const all = Object.values(body.data?.slots ?? {}).flat();
    if (all.length === 0) {
      // A 200 with no slots is indistinguishable from "genuinely fully
      // booked" on the phone, which is correct there, but it is also what a
      // wrong-but-real event type ID looks like: Cal.com answers 200 for any
      // event type it can find, whether or not it is the one this persona
      // means. The env var name is safe to log; it holds no secret.
      console.warn(
        `[fenwright] Cal.com returned zero slots for eventTypeId=${eventTypeId} in the queried window`
      );
    }
    return all
      .map((s) => s.start)
      .filter((iso) => matchesPartOfDay(iso, partOfDay, timeZone))
      .slice(0, limit)
      .map((iso) => ({ startIso: iso, spoken: spokenTime(iso, timeZone) }));
  } catch (err) {
    if (timedOut) {
      console.error(`[fenwright] Cal.com availability timed out after ${TIMEOUT_MS}ms`);
    } else {
      console.error("[fenwright] Cal.com availability failed:", errMeta(err));
    }
    return [];
  } finally {
    clearTimeout(timer);
  }
}

/** Create a booking. Never throws; the caller turns the result into speech. */
export async function createBooking({
  slotStart,
  name,
  phone,
  notes,
  timeZone = DEFAULT_TZ,
}: {
  slotStart: string;
  name: string;
  phone: string;
  notes?: string;
  timeZone?: string;
}): Promise<{ ok: boolean; ref?: string; reason?: string }> {
  const apiKey = process.env.CALCOM_API_KEY;
  const eventTypeId = process.env.CALCOM_EVENT_TYPE_ID;
  if (!apiKey || !eventTypeId) return { ok: false, reason: "not_configured" };

  const controller = new AbortController();
  let timedOut = false;
  const timer = setTimeout(() => {
    timedOut = true;
    controller.abort();
  }, TIMEOUT_MS);

  try {
    const res = await fetch(`${apiBase()}/bookings`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
        "cal-api-version": "2024-08-13",
      },
      body: JSON.stringify({
        start: slotStart,
        eventTypeId: Number(eventTypeId),
        attendee: { name, phoneNumber: phone, timeZone, language: "en" },
        bookingFieldsResponses: notes ? { notes } : undefined,
      }),
      cache: "no-store",
      signal: controller.signal,
    });

    const body = (await res.json().catch(() => ({}))) as { data?: { uid?: string } };
    if (!res.ok) return { ok: false, reason: `http_${res.status}` };
    return { ok: true, ref: body.data?.uid };
  } catch (err) {
    if (timedOut) {
      // Distinct from "network" so the caller's claim release and the logs can
      // tell "Cal.com said no" apart from "Cal.com never answered in time".
      console.error(`[fenwright] Cal.com booking timed out after ${TIMEOUT_MS}ms`);
      return { ok: false, reason: "timeout" };
    }
    console.error("[fenwright] Cal.com booking failed:", errMeta(err));
    return { ok: false, reason: "network" };
  } finally {
    clearTimeout(timer);
  }
}

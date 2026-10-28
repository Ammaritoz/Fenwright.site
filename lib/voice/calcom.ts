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
  // On the hour, "10am" reads correctly. Anything else goes out in words:
  // "7.30am" was read on a live call as "seven dot three zero", and a colon is
  // no safer a bet with text-to-speech.
  const clock =
    minute === "00"
      ? `${hour}${meridiem}`
      : `${hour} ${minuteWords(Number(minute))} ${partOfDayPhrase(hourInZone(iso, timeZone))}`;

  return `${get("weekday")} the ${ordinal(day)} of ${get("month")} at ${clock}`;
}

const UNITS = ["", "one", "two", "three", "four", "five", "six", "seven", "eight", "nine"];
const TEENS = ["ten", "eleven", "twelve", "thirteen", "fourteen", "fifteen", "sixteen", "seventeen", "eighteen", "nineteen"];
const TENS = ["", "", "twenty", "thirty", "forty", "fifty"];

/** 1 to 59 as a clock reads it aloud: "oh five", "fifteen", "forty five". */
function minuteWords(m: number): string {
  if (m < 10) return `oh ${UNITS[m]}`;
  if (m < 20) return TEENS[m - 10];
  return [TENS[Math.floor(m / 10)], UNITS[m % 10]].filter(Boolean).join(" ");
}

function partOfDayPhrase(hour24: number): string {
  if (hour24 < 12) return "in the morning";
  if (hour24 < 17) return "in the afternoon";
  return "in the evening";
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

type Ymd = { year: number; month: number; day: number };

function ymdInZone(date: Date, timeZone: string): Ymd {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(date);
  const get = (t: string) => Number(parts.find((p) => p.type === t)?.value);
  return { year: get("year"), month: get("month"), day: get("day") };
}

function addDays({ year, month, day }: Ymd, delta: number): Ymd {
  const d = new Date(Date.UTC(year, month - 1, day + delta));
  return { year: d.getUTCFullYear(), month: d.getUTCMonth() + 1, day: d.getUTCDate() };
}

/** Offset of `timeZone` from UTC, in minutes, at the given instant (DST-aware). */
function offsetMinutes(timeZone: string, instant: Date): number {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone,
    hour12: false,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  }).formatToParts(instant);
  const get = (t: string) => Number(parts.find((p) => p.type === t)?.value);
  const asUtc = Date.UTC(get("year"), get("month") - 1, get("day"), get("hour"), get("minute"), get("second"));
  return (asUtc - instant.getTime()) / 60_000;
}

/** The UTC instant of local midnight for {year, month, day} in timeZone. */
function localMidnightIso({ year, month, day }: Ymd, timeZone: string): string {
  const guess = Date.UTC(year, month - 1, day, 0, 0, 0);
  const offset = offsetMinutes(timeZone, new Date(guess));
  return new Date(guess - offset * 60_000).toISOString();
}

const WEEKDAYS = ["sunday", "monday", "tuesday", "wednesday", "thursday", "friday", "saturday"];

/**
 * Resolve the caller's own word for a day ("today", "tomorrow", a weekday
 * name) to a real calendar date, against the live server clock.
 *
 * The model is never asked to compute this itself: an LLM has no reliable
 * sense of what day it actually is beyond its training data, and in
 * production a caller who said "tomorrow" had it matched against a date over
 * a year in the past. The model's only job is to transcribe the caller's own
 * word; this function does the arithmetic, every time, against the real
 * clock, so it can never go stale between deploys.
 *
 * Returns null for anything that is not one of these recognised words, so the
 * caller can fall back to treating the value as an explicit date instead.
 */
export function resolveRelativeDay(
  word: string,
  timeZone: string = DEFAULT_TZ,
  now: Date = new Date()
): string | null {
  const lower = word.trim().toLowerCase();
  const today = ymdInZone(now, timeZone);

  if (lower === "today") return localMidnightIso(today, timeZone);
  if (lower === "tomorrow") return localMidnightIso(addDays(today, 1), timeZone);

  const targetWeekday = WEEKDAYS.indexOf(lower);
  if (targetWeekday === -1) return null;

  const todayWeekday = new Date(Date.UTC(today.year, today.month - 1, today.day)).getUTCDay();
  // 0 when the caller names today's own weekday, matching how someone would
  // naturally mean "yes, today" rather than "in exactly seven days".
  const daysAhead = (targetWeekday - todayWeekday + 7) % 7;
  return localMidnightIso(addDays(today, daysAhead), timeZone);
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
    // Cal.com's v2 slots response nests each date directly under `data`,
    // keyed by day, with no intermediate "slots" property. Confirmed against
    // a real response after this module's original assumption of
    // data.slots turned out wrong: it silently parsed to undefined on every
    // real call, and every test mock had encoded the same wrong shape, so
    // nothing ever caught it.
    const body = (await res.json()) as {
      data?: Record<string, Array<{ start: string }>>;
    };

    const all = Object.values(body.data ?? {}).flat();
    if (all.length === 0) {
      // A 200 with no slots is indistinguishable from "genuinely fully
      // booked" on the phone, which is correct there, but it is also what a
      // wrong-but-real event type ID, a stale schedule, or a date-window bug
      // looks like: Cal.com answers 200 for any query it can parse. The full
      // request URL is safe to log; the key is sent as a header, never a
      // query param, so nothing secret is in it.
      // A matching URL with a mismatched key is otherwise invisible: the key
      // never appears in the URL, only the Authorization header, which is
      // deliberately never logged in full. A short prefix fingerprints it
      // without exposing enough to reuse.
      console.warn(
        `[fenwright] Cal.com returned zero slots for ${url.toString()} using key prefix ${apiKey.slice(0, 12)}...`
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

/**
 * Find Cal.com's own free slot for the day and time the caller agreed.
 *
 * The model only ever hears slots as spoken words, so the timestamp it hands
 * to book_appointment is its own reconstruction, and on a live call it sent
 * "2025-10-30T07:00:00" in 2026: the right day and time, the wrong year, no
 * zone, rejected by Cal.com every time. Same rule as resolveRelativeDay: the
 * model supplies what the caller agreed, the server does the date arithmetic.
 * The year and any zone suffix are ignored; month, day and local wall time are
 * kept, the next such date on or after today is searched, and only a slot
 * Cal.com itself reports free there is returned. Never throws.
 */
export async function findFreeSlot(
  slotStart: string,
  timeZone: string = DEFAULT_TZ,
  now: Date = new Date()
): Promise<Slot | null> {
  const m = /^\d{4}-(\d{2})-(\d{2})[T ](\d{2}):(\d{2})/.exec(slotStart.trim());
  if (!m) return null;
  const [month, day, hour, minute] = m.slice(1).map(Number);

  const today = ymdInZone(now, timeZone);
  const passed = month < today.month || (month === today.month && day < today.day);
  const target = { year: today.year + (passed ? 1 : 0), month, day };

  // Every slot that day, not the usual three: the agreed time may not be
  // among the first few.
  const slots = await getAvailability({
    fromIso: localMidnightIso(target, timeZone),
    limit: 200,
    timeZone,
  });
  return (
    slots.find((s) => {
      const local = ymdInZone(new Date(s.startIso), timeZone);
      return (
        local.month === month &&
        local.day === day &&
        hourInZone(s.startIso, timeZone) === hour &&
        new Date(s.startIso).getUTCMinutes() === minute
      );
    }) ?? null
  );
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
        // Cal.com's booking form treats email as a required attendee field
        // even when it collects nothing else, confirmed against a live
        // booking that otherwise rejected with "responses - {email}
        // error_required_field". The voice flow never asks a caller to
        // spell out an email on the phone, so this is a synthetic
        // placeholder, not a real address. example.com, not .invalid: Cal.com
        // validates that the domain can receive mail (rejecting .invalid,
        // which is reserved specifically to never resolve, with
        // "email_domain_cannot_receive_mail"), confirmed against a second
        // live booking. example.com is IANA-reserved for documentation
        // (RFC 2606) and genuinely resolves, so it passes that check while
        // staying universally recognised as a placeholder, never a real
        // client's own domain.
        attendee: {
          name,
          email: `${phone.replace(/[^\d]/g, "")}@example.com`,
          phoneNumber: phone,
          timeZone,
          language: "en",
        },
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

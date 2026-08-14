import type { Persona } from "@/config/personas";
import { stripContactVectors, toGsm7 } from "@/lib/receptionist";

/** One GSM-7 segment. Going over silently doubles the cost of every message. */
const MAX_SEGMENT = 160;
/** Bounds on caller-supplied fragments, so the fixed template text always survives. */
const MAX_NAME = 20;
const MAX_SPOKEN_TIME = 40;

/**
 * Caller-supplied fragments reach us as model output transcribed from a live
 * phone call. Strip anything that could turn our own SMS into a phishing
 * message, exactly as generateFenwrightReply does, then bound the length.
 */
function fragment(value: string, max: number): string {
  return stripContactVectors(value).trim().slice(0, max).trim();
}

function firstName(name: string): string {
  return name.trim().split(/\s+/)[0] || name.trim();
}

/** Never emit more than a single segment, whatever the inputs were. */
function oneSegment(body: string): string {
  return toGsm7(body).slice(0, MAX_SEGMENT).trim();
}

export function bookingRecap(
  persona: Persona,
  { name, spokenTime }: { name: string; spokenTime: string }
): string {
  const who = fragment(firstName(name), MAX_NAME) || "there";
  const when = fragment(spokenTime, MAX_SPOKEN_TIME);
  const body =
    `Hi ${who}, you are booked in with ${persona.identity.businessName} for ${when}. ` +
    `If that no longer suits, just reply here.`;
  return oneSegment(body);
}

export function callbackRecap(persona: Persona, { name }: { name: string }): string {
  const who = fragment(firstName(name), MAX_NAME) || "there";
  const body =
    `Hi ${who}, thanks for calling ${persona.identity.businessName}. ` +
    `We have your details and will be in touch shortly.`;
  return oneSegment(body);
}

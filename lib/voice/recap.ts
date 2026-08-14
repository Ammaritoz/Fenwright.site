import type { Persona } from "@/config/personas";
import { stripContactVectors, toGsm7 } from "@/lib/receptionist";

/** One GSM-7 segment. Going over silently doubles the cost of every message. */
const MAX_SEGMENT = 160;
/** Bounds on caller-supplied fragments, so the fixed template text always survives. */
const MAX_NAME = 15;
const MAX_SPOKEN_TIME = 65;

/**
 * Caller-supplied fragments reach us as model output transcribed from a live
 * phone call. Strip anything that could turn our own SMS into a phishing
 * message, exactly as generateFenwrightReply does, then bound the length.
 * Truncate at word boundaries to avoid dropping the appointment time mid-word.
 */
function fragment(value: string, max: number): string {
  const stripped = stripContactVectors(value).trim();
  if (stripped.length <= max) {
    return stripped;
  }
  // Truncate to max, then back off to last whitespace if cut landed inside a word
  const truncated = stripped.slice(0, max);
  const lastSpace = truncated.lastIndexOf(" ");
  if (lastSpace > 0) {
    return truncated.slice(0, lastSpace);
  }
  return truncated; // no space found, return the truncation anyway
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
  const core = `Hi ${who}, you are booked in with ${persona.identity.businessName} for ${when}.`;
  const withInvite = toGsm7(`${core} If that no longer suits, just reply here.`);
  return withInvite.length <= MAX_SEGMENT ? withInvite : oneSegment(core);
}

export function callbackRecap(persona: Persona, { name }: { name: string }): string {
  const who = fragment(firstName(name), MAX_NAME) || "there";
  const body =
    `Hi ${who}, thanks for calling ${persona.identity.businessName}. ` +
    `We have your details and will be in touch shortly.`;
  return oneSegment(body);
}

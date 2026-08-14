import "server-only";
import Airtable from "airtable";
import { errMeta } from "@/lib/log";

export type CallOutcome =
  | "booked"
  | "lead_captured"
  | "answered"
  | "transferred"
  | "voicemail"
  | "abandoned"
  | "failed";

export type CallRecord = {
  callId: string;
  direction: "inbound" | "outbound";
  personaId: string;
  fromNumber: string;
  toNumber: string;
  startedAt: string;
  durationSeconds: number;
  outcome: CallOutcome;
  booked: boolean;
  escalated: boolean;
  intent?: string;
  summary?: string;
  transcriptUrl?: string;
  recordingUrl?: string;
  platformCostUsd?: number;
};

/** Same protection as lib/airtable.ts: a caller can dictate a name starting with "=". */
function deFormula(value: string): string {
  return /^[=+\-@\t\r]/.test(value) ? `'${value}` : value;
}

/**
 * Calls worth a human listen: anything escalated or failed. This is what the
 * weekly review view filters on, so it is computed here rather than by hand.
 */
function needsReview(record: CallRecord): boolean {
  return record.escalated || record.outcome === "failed" || record.outcome === "abandoned";
}

export function buildCallFields(record: CallRecord): Record<string, unknown> {
  const fields: Record<string, unknown> = {
    CallId: record.callId,
    Direction: record.direction,
    PersonaId: record.personaId,
    FromNumber: deFormula(record.fromNumber),
    ToNumber: deFormula(record.toNumber),
    StartedAt: record.startedAt,
    DurationSeconds: record.durationSeconds,
    Outcome: record.outcome,
    Booked: record.booked,
    Escalated: record.escalated,
    ReviewFlag: needsReview(record),
  };

  if (record.intent) fields.Intent = deFormula(record.intent);
  if (record.summary) fields.Summary = deFormula(record.summary);
  if (record.transcriptUrl) fields.TranscriptUrl = record.transcriptUrl;
  if (record.recordingUrl) fields.RecordingUrl = record.recordingUrl;
  if (typeof record.platformCostUsd === "number") {
    fields.PlatformCostUsd = record.platformCostUsd;
  }

  return fields;
}

let base: Airtable.Base | null = null;
function getBase(): Airtable.Base | null {
  const apiKey = process.env.AIRTABLE_API_KEY;
  const baseId = process.env.AIRTABLE_BASE_ID;
  if (!apiKey || !baseId) return null;
  if (!base) base = new Airtable({ apiKey }).base(baseId);
  return base;
}

/** Best-effort, matching lib/airtable.ts: logging must never break a call. */
export async function logCall(record: CallRecord): Promise<void> {
  const b = getBase();
  if (!b) {
    console.warn("[fenwright] Airtable not configured, skipping call log");
    return;
  }
  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await b("Calls").create([{ fields: buildCallFields(record) as any }]);
  } catch (err) {
    console.error("[fenwright] Airtable logCall failed:", errMeta(err));
  }
}

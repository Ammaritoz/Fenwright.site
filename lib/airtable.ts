import "server-only";
import Airtable from "airtable";
import { errMeta } from "@/lib/log";
import {
  AGREEMENTS_TABLE,
  FEEDBACK_TABLE,
  UPLOADS_TABLE,
  COMPLETIONS_TABLE,
  SITE_LEADS_TABLE,
} from "@/lib/airtable-schema";

/**
 * Logs leads to the Airtable "Fenwright" base, `Leads` table.
 * Best-effort: logging failures must never break the visitor-facing flow, so
 * callers should await inside try/catch and swallow errors (logging them).
 */

export type LeadRecord = {
  name?: string;
  phone?: string;
  message?: string;
  industry?: string;
  /**
   * Voice-captured leads only (spec section 7). Ties a lead back to the call it
   * came from, so a Calls row and the lead it produced can be read together
   * rather than matched up by phone number and timestamp.
   */
  callId?: string;
  source: "site-demo" | "site-contact" | "voice-inbound" | "voice-outbound";
};

let base: Airtable.Base | null = null;
let recordsBase: Airtable.Base | null = null;

/**
 * The client-records base, separate from the marketing/leads base above.
 *
 * Signed agreements are legal evidence and client feedback is confidential;
 * neither belongs in the same base as inbound leads, which is shared with
 * automations and exported casually. Separate base, separate env var, so
 * widening access to one never widens access to the other.
 *
 * Falls back to AIRTABLE_API_KEY when no dedicated key is set, since a single
 * personal access token can be scoped to both bases.
 */
function getRecordsBase(): Airtable.Base | null {
  const apiKey = process.env.AIRTABLE_RECORDS_API_KEY || process.env.AIRTABLE_API_KEY;
  const baseId = process.env.AIRTABLE_RECORDS_BASE_ID;
  if (!apiKey || !baseId) return null;
  if (!recordsBase) {
    recordsBase = new Airtable({ apiKey }).base(baseId);
  }
  return recordsBase;
}

function getBase(): Airtable.Base | null {
  const apiKey = process.env.AIRTABLE_API_KEY;
  const baseId = process.env.AIRTABLE_BASE_ID;
  if (!apiKey || !baseId) return null;
  if (!base) {
    base = new Airtable({ apiKey }).base(baseId);
  }
  return base;
}

/**
 * Neutralise spreadsheet formula injection.
 *
 * Lead values are visitor-supplied. Airtable itself treats them as plain text,
 * but the moment the Leads table is exported to CSV and opened in Excel, Sheets
 * or Numbers, a cell beginning with =, +, -, @ or a control character is
 * evaluated as a formula. Prefixing with an apostrophe keeps the value readable
 * while forcing every spreadsheet to treat it as text.
 */
function deFormula(value: string): string {
  return /^[=+\-@\t\r]/.test(value) ? `'${value}` : value;
}

/**
 * Website enquiries go to "Site Leads", NOT "Leads".
 *
 * "Leads" belongs to the n8n receptionist product: its rows are our CLIENTS'
 * customers, keyed on Lead Phone with a Business Name and a Twilio Number, and
 * automations filter it on Status. A person who fills in the contact form on
 * fenwright.ie is a different entity entirely -- our own prospect -- and does
 * not have those fields. Writing them into the same table both fails schema
 * validation and puts rows in front of workflows that should never see them.
 *
 * Table names and field lists live in lib/airtable-schema.ts so that
 * `npm run airtable:check` verifies exactly what these functions write.
 */
export async function logLead(lead: LeadRecord): Promise<void> {
  const b = getBase();
  if (!b) {
    console.warn("[fenwright] Airtable not configured, skipping lead log:", lead.source);
    return;
  }

  const fields: Record<string, string> = {
    Source: lead.source,
    Timestamp: new Date().toISOString(),
  };
  if (lead.name) fields.Name = deFormula(lead.name);
  if (lead.phone) fields.Phone = deFormula(lead.phone);
  if (lead.message) fields.Message = deFormula(lead.message);
  if (lead.industry) fields.Industry = deFormula(lead.industry);
  if (lead.callId) fields.CallId = deFormula(lead.callId);

  try {
    // typecast lets Airtable add a new Source option rather than rejecting the
    // whole record. Without it, adding a source to LeadRecord without also
    // adding the choice in Airtable would silently drop every lead from that
    // surface -- which is exactly the class of bug this function had.
    await b(SITE_LEADS_TABLE).create([{ fields }], { typecast: true });
  } catch (err) {
    // Do not throw: logging is not allowed to break the response. But do make
    // the failure loud in the log, with the message intact. errMeta alone
    // reduced an UNKNOWN_FIELD_NAME to a bare 422, which is how a total
    // field-name mismatch went unnoticed.
    console.error(
      "[fenwright] Airtable logLead failed:",
      err instanceof Error ? err.message : errMeta(err),
      errMeta(err)
    );
  }
}

/**
 * Record acceptance of a client agreement.
 *
 * Unlike logLead above, this deliberately THROWS on failure. Lead logging is
 * best-effort because a dropped log costs a row in a spreadsheet. This is the
 * evidence that a contract was accepted: if the write fails, the client must be
 * told to try again rather than shown a page claiming they have signed.
 */
/**
 * Turn Airtable's opaque 403 into the instruction that actually fixes it.
 *
 * Airtable personal access tokens carry an explicit list of bases, fixed when
 * the token is created. A base created later is NOT added automatically, so a
 * correctly configured base id still returns
 * INVALID_PERMISSIONS_OR_MODEL_NOT_FOUND. That reads as a config bug and costs
 * an hour; naming the fix here costs nothing.
 */
function recordsWriteError(err: unknown, what: string): Error {
  const status = (err as { statusCode?: number; status?: number })?.statusCode
    ?? (err as { status?: number })?.status;
  if (status === 403) {
    return new Error(
      `Airtable refused the ${what} write (403). The personal access token most ` +
        `likely does not list the records base. Add it at ` +
        `https://airtable.com/create/tokens under the token's Access section, or ` +
        `grant the token all current and future bases in the workspace.`
    );
  }
  return err instanceof Error ? err : new Error(String(err));
}

export async function logAgreementAcceptance(input: {
  clientSlug: string;
  businessName: string;
  documentSlug: string;
  signatoryName: string;
  ip: string;
  userAgent: string;
}): Promise<void> {
  const b = getRecordsBase();
  if (!b) {
    throw new Error(
      "AIRTABLE_RECORDS_BASE_ID is not set; cannot record agreement acceptance."
    );
  }

  try {
    await b(AGREEMENTS_TABLE).create([
    {
      fields: {
        ClientSlug: deFormula(input.clientSlug),
        BusinessName: deFormula(input.businessName),
        Document: deFormula(input.documentSlug),
        SignatoryName: deFormula(input.signatoryName),
        AcceptedAt: new Date().toISOString(),
        Ip: deFormula(input.ip),
        UserAgent: deFormula(input.userAgent.slice(0, 500)),
      },
    },
    ]);
  } catch (err) {
    throw recordsWriteError(err, "agreement acceptance");
  }
}

/** Escape a value for use inside a single-quoted Airtable formula string. */
function formulaString(value: string): string {
  return value.replace(/\\/g, "\\\\").replace(/'/g, "\\'");
}

export type AgreementAcceptance = { name: string; at: string };
export type FeedbackSubmission = { name: string; at: string };

/**
 * The earliest record a client has left in an Airtable table for one document.
 *
 * What a client has signed or submitted is read from the record we actually
 * saved, not from a flag someone has to remember to edit in the client file.
 * Returns null when there is no record, and also when Airtable cannot be read
 * (not configured, offline): the form then simply shows, and the write path
 * still surfaces its own error.
 */
async function findClientRecord(
  table: string,
  clientSlug: string,
  documentSlug: string,
  nameField: string,
  timeField: string
): Promise<{ name: string; at: string } | null> {
  const b = getRecordsBase();
  if (!b) return null;
  try {
    const rows = await b(table)
      .select({
        maxRecords: 1,
        fields: [nameField, timeField],
        sort: [{ field: timeField, direction: "asc" }],
        filterByFormula: `AND({ClientSlug}='${formulaString(clientSlug)}',{Document}='${formulaString(documentSlug)}')`,
      })
      .firstPage();
    const f = rows[0]?.fields;
    if (!f) return null;
    return { name: String(f[nameField] ?? ""), at: String(f[timeField] ?? "") };
  } catch (err) {
    console.error("[fenwright] record lookup failed:", err instanceof Error ? err.message : errMeta(err));
    return null;
  }
}

/** Has this client already signed this agreement document? */
export function getAgreementAcceptance(clientSlug: string, documentSlug: string): Promise<AgreementAcceptance | null> {
  return findClientRecord(AGREEMENTS_TABLE, clientSlug, documentSlug, "SignatoryName", "AcceptedAt");
}

/** Has this client already sent this feedback form? */
export function getFeedbackSubmission(clientSlug: string, documentSlug: string): Promise<FeedbackSubmission | null> {
  return findClientRecord(FEEDBACK_TABLE, clientSlug, documentSlug, "RespondentName", "SubmittedAt");
}

/**
 * Store a completed client feedback form. Throws on failure so the client is
 * asked to resubmit rather than silently losing what they wrote.
 */
export async function logClientFeedback(input: {
  clientSlug: string;
  businessName: string;
  documentSlug: string;
  /** Pre-serialised "label: score" lines. */
  ratings: string;
  /** Pre-serialised "question: answer" blocks. */
  answers: string;
  testimonial: string;
  respondentName: string;
}): Promise<void> {
  const b = getRecordsBase();
  if (!b) {
    throw new Error("AIRTABLE_RECORDS_BASE_ID is not set; cannot record client feedback.");
  }

  try {
    await b(FEEDBACK_TABLE).create([
    {
      fields: {
        ClientSlug: deFormula(input.clientSlug),
        BusinessName: deFormula(input.businessName),
        Document: deFormula(input.documentSlug),
        Ratings: deFormula(input.ratings),
        Answers: deFormula(input.answers),
        Testimonial: deFormula(input.testimonial),
        RespondentName: deFormula(input.respondentName),
        SubmittedAt: new Date().toISOString(),
      },
    },
    ]);
  } catch (err) {
    throw recordsWriteError(err, "client feedback");
  }
}


export type ReceivedUpload = { at: string; bytes: number };

/**
 * Record that an encrypted upload reached storage.
 *
 * The pipeline deletes each object from storage once it collects it, so storage
 * cannot tell a client "we have your file" afterwards. This row can. It is
 * written once per object (a repeat call finds the existing row), and it never
 * throws: a missing Uploads table must not make a successful upload look failed.
 *
 * Returns "created" for a new upload, "exists" for one already recorded, and
 * "unavailable" when Airtable could not be used. The caller texts the operator
 * only when it is not "exists", so replaying the request cannot spam their phone.
 */
export async function logUpload(input: {
  clientSlug: string;
  objectKey: string;
  bytes: number;
}): Promise<"created" | "exists" | "unavailable"> {
  const b = getRecordsBase();
  if (!b) return "unavailable";
  try {
    const found = await b(UPLOADS_TABLE)
      .select({ maxRecords: 1, fields: ["ObjectKey"], filterByFormula: `{ObjectKey}='${formulaString(input.objectKey)}'` })
      .firstPage();
    if (found.length > 0) return "exists";
    await b(UPLOADS_TABLE).create([
      {
        fields: {
          ClientSlug: deFormula(input.clientSlug),
          ObjectKey: deFormula(input.objectKey),
          SizeBytes: input.bytes,
          ReceivedAt: new Date().toISOString(),
        },
      },
    ]);
    return "created";
  } catch (err) {
    console.error("[fenwright] upload record failed:", err instanceof Error ? err.message : errMeta(err));
    return "unavailable";
  }
}

/** Uploads this client has sent, newest first. Empty when none, or when Airtable cannot be read. */
export async function listUploads(clientSlug: string): Promise<ReceivedUpload[]> {
  const b = getRecordsBase();
  if (!b) return [];
  try {
    const rows = await b(UPLOADS_TABLE)
      .select({
        maxRecords: 50,
        fields: ["SizeBytes", "ReceivedAt"],
        sort: [{ field: "ReceivedAt", direction: "desc" }],
        filterByFormula: `{ClientSlug}='${formulaString(clientSlug)}'`,
      })
      .firstPage();
    return rows.map((r) => ({ at: String(r.fields.ReceivedAt ?? ""), bytes: Number(r.fields.SizeBytes ?? 0) }));
  } catch (err) {
    console.error("[fenwright] upload list failed:", err instanceof Error ? err.message : errMeta(err));
    return [];
  }
}


/**
 * Record that a client marked an attention item as done.
 *
 * It is the client's own statement ("I have approved and submitted this"), not
 * proof of anything: for a report draft, the filing itself happens on ENISA's
 * platform. Idempotent per client and item, so a double click stores one row.
 * Throws on failure, so the client is told to try again instead of seeing the
 * item disappear without a record.
 */
export async function logCompletion(input: {
  clientSlug: string;
  itemId: string;
  kind: string;
  title: string;
  ip: string;
}): Promise<void> {
  const b = getRecordsBase();
  if (!b) throw new Error("AIRTABLE_RECORDS_BASE_ID is not set; cannot record completion.");
  try {
    const found = await b(COMPLETIONS_TABLE)
      .select({
        maxRecords: 1,
        fields: ["ItemId"],
        filterByFormula: `AND({ClientSlug}='${formulaString(input.clientSlug)}',{ItemId}='${formulaString(input.itemId)}')`,
      })
      .firstPage();
    if (found.length > 0) return;
    await b(COMPLETIONS_TABLE).create([
      {
        fields: {
          ItemId: deFormula(input.itemId),
          ClientSlug: deFormula(input.clientSlug),
          Kind: deFormula(input.kind),
          Title: deFormula(input.title.slice(0, 300)),
          CompletedAt: new Date().toISOString(),
          Ip: deFormula(input.ip),
        },
      },
    ]);
  } catch (err) {
    throw recordsWriteError(err, "completion");
  }
}

/** Ids of the items this client has marked done. Empty when none, or when Airtable cannot be read. */
export async function listCompletions(clientSlug: string): Promise<Set<string>> {
  const b = getRecordsBase();
  if (!b) return new Set();
  try {
    const rows = await b(COMPLETIONS_TABLE)
      .select({ maxRecords: 200, fields: ["ItemId"], filterByFormula: `{ClientSlug}='${formulaString(clientSlug)}'` })
      .firstPage();
    return new Set(rows.map((r) => String(r.fields.ItemId ?? "")).filter(Boolean));
  } catch (err) {
    console.error("[fenwright] completion list failed:", err instanceof Error ? err.message : errMeta(err));
    return new Set();
  }
}

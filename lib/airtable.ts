import "server-only";
import Airtable from "airtable";
import { errMeta } from "@/lib/log";
import {
  AGREEMENTS_TABLE,
  FEEDBACK_TABLE,
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

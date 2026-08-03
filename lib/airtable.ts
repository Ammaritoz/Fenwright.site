import "server-only";
import Airtable from "airtable";
import { errMeta } from "@/lib/log";

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
  source: "site-demo" | "site-contact";
};

let base: Airtable.Base | null = null;

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

  try {
    await b("Leads").create([{ fields }]);
  } catch (err) {
    // Do not throw: logging is not allowed to break the response.
    console.error("[fenwright] Airtable logLead failed:", errMeta(err));
  }
}

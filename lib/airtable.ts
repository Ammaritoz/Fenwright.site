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
  if (lead.name) fields.Name = lead.name;
  if (lead.phone) fields.Phone = lead.phone;
  if (lead.message) fields.Message = lead.message;
  if (lead.industry) fields.Industry = lead.industry;

  try {
    await b("Leads").create([{ fields }]);
  } catch (err) {
    // Do not throw: logging is not allowed to break the response.
    console.error("[fenwright] Airtable logLead failed:", errMeta(err));
  }
}

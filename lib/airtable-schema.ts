/**
 * What this codebase expects each Airtable table to look like.
 *
 * Deliberately free of "server-only" and of the Airtable SDK, so both the
 * writers in lib/airtable.ts and the checker in scripts/airtable-check.ts can
 * import it. One declaration, two consumers: the check cannot drift from the
 * code the way a hand-maintained copy would.
 *
 * This exists because mocked unit tests assert what the code WRITES and can
 * never assert what Airtable will ACCEPT. logLead spent months writing Name,
 * Phone and Message to a table whose fields were Lead Phone, Business Name and
 * Conversation. Every call failed with a 422 that logLead swallowed by design,
 * so the site looked healthy while every enquiry was dropped.
 *
 * Run `npm run airtable:check` after changing anything here.
 */

/** Which base a table lives in. The two are kept separate on purpose. */
export type BaseKind =
  /** Marketing and product data: AIRTABLE_BASE_ID. */
  | "leads"
  /** Signed agreements and client feedback: AIRTABLE_RECORDS_BASE_ID. */
  | "records";

export type TableExpectation = {
  base: BaseKind;
  table: string;
  /** Every field this codebase writes. Airtable may have extras; that is fine. */
  fields: readonly string[];
  writtenBy: string;
};

export const airtableExpectations: readonly TableExpectation[] = [
  {
    base: "leads",
    table: "Site Leads",
    fields: ["Name", "Phone", "Message", "Industry", "Source", "CallId", "Timestamp"],
    writtenBy: "logLead()",
  },
  {
    base: "records",
    table: "Agreements",
    fields: [
      "ClientSlug",
      "BusinessName",
      "Document",
      "SignatoryName",
      "AcceptedAt",
      "Ip",
      "UserAgent",
    ],
    writtenBy: "logAgreementAcceptance()",
  },
  {
    base: "records",
    table: "Feedback",
    fields: [
      "ClientSlug",
      "BusinessName",
      "Document",
      "Ratings",
      "Answers",
      "Testimonial",
      "RespondentName",
      "SubmittedAt",
    ],
    writtenBy: "logClientFeedback()",
  },
] as const;

/** Named so the writers reference the same string the checker verifies. */
export const SITE_LEADS_TABLE = "Site Leads";
export const AGREEMENTS_TABLE = "Agreements";
export const FEEDBACK_TABLE = "Feedback";

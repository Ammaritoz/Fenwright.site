/**
 * Client portal data model.
 *
 * One typed module per client under content/clients/. TypeScript rather than
 * JSON on purpose: a missing invoice due date should be a build failure, not
 * `undefined` rendered on a document a paying client is reading. This mirrors
 * how config/site.ts and config/personas.ts already treat data as typed
 * modules rather than loose config.
 */

/** ISO 4217. Ireland and the UK are both served (see config/site.ts). */
export type Currency = "EUR" | "GBP";

/**
 * Money is an integer in minor units (cents / pence). Never a float: 0.1 + 0.2
 * on an invoice line is a real, visible bug. Format via lib/portal/money.ts.
 */
export type Money = number;

/** ISO 8601 date, `YYYY-MM-DD`. Formatted server-side by lib/portal/format.ts. */
export type IsoDate = string;

/** Every document type the portal can render. The URL slug is separate. */
export type DocType =
  | "agreement"
  | "welcome"
  | "invoice"
  | "brief"
  | "delivery"
  | "report"
  | "payment"
  | "thank-you"
  | "feedback"
  | "packages";

// --- Shared building blocks -------------------------------------------------

export type Person = {
  name: string;
  /** e.g. "Practice Manager". Optional; omitted cleanly when blank. */
  role?: string;
  email?: string;
  phone?: string;
};

export type LineItem = {
  /** Short category for the leftmost column, e.g. "Build", "Retainer". */
  kind: string;
  description: string;
  quantity: number;
  /** Price per unit, minor units. */
  unitPrice: Money;
};

export type PaymentMilestone = {
  label: string;
  amount: Money;
  /** Free text rather than IsoDate: real schedules say "on signature". */
  due: string;
  note?: string;
};

// --- Per-document payloads --------------------------------------------------

export type AgreementDoc = {
  type: "agreement";
  /**
   * Gates the amber draft band. Leave false until a solicitor has actually
   * read this. See components/portal/docs/Agreement.tsx.
   */
  solicitorReviewed: boolean;
  /** What Fenwright is engaged to do. One bullet per line. */
  scope: string[];
  /** Explicitly outside the engagement. Prevents the most common scope fight. */
  exclusions: string[];
  totalFee: Money;
  schedule: PaymentMilestone[];
  /** Notice period in days for ending an ongoing retainer. */
  noticeDays: number;
  /** Third-party services the client pays for on their own accounts. */
  passThroughServices: string[];
  /**
   * Set once acceptance is confirmed in Airtable (the accept form writes
   * there, not here). While unset, the dashboard asks the client to sign.
   */
  acceptedOn?: IsoDate;
};

export type WelcomeDoc = {
  type: "welcome";
  projectName: string;
  startDate: IsoDate;
  targetDelivery: IsoDate;
  /** Who at Fenwright the client talks to day to day. */
  pointOfContact: string;
  /** Overrides documents.onboardingSteps when a client's process differs. */
  steps?: { title: string; body: string }[];
};

export type InvoiceDoc = {
  type: "invoice";
  /** e.g. "INV-001". Shown large; also used as the payment reference. */
  number: string;
  issued: IsoDate;
  due: IsoDate;
  /** The client's own PO or reference, if they use one. */
  purchaseOrder?: string;
  projectReference?: string;
  lines: LineItem[];
  /** Already-paid deposit to subtract from the total. Minor units. */
  amountPaid?: Money;
  /**
   * Stripe's hosted invoice page, printed by `npm run stripe:invoice`. Shows a
   * "Pay online" button. Bank transfer details still show either way.
   */
  payUrl?: string;
  paid?: boolean;
};

export type BriefDoc = {
  type: "brief";
  projectTitle: string;
  deadline: IsoDate;
  /** The business outcome, not the feature list. */
  objective: string;
  /**
   * The products in scope. One row per product family; list the firmware
   * versions still on the market, since Article 14 covers those too.
   */
  products: {
    name: string;
    /** e.g. "3.2 to 3.4.1". */
    versions: string;
    /** Where the ingredients list comes from, e.g. "Yocto build" or "Firmware image only". */
    source: string;
  }[];
  /** Written success criteria, agreed up front. Pilots are judged against these. */
  successCriteria: string[];
  /** Who does what. The client always approves and submits reports. */
  responsibilities: { fenwright: string[]; client: string[] };
  constraints?: string[];
};

export type DeliveryDoc = {
  type: "delivery";
  deliveredOn: IsoDate;
  /** The systems handed over, with where they live and who owns the account. */
  systems: {
    name: string;
    whatItDoes: string;
    /** e.g. "Airtable", "Cal.com", "Telnyx". */
    platform: string;
    /** Account holder. Drives the handover checklist. */
    accountOwner: "Client" | "Fenwright";
    url?: string;
  }[];
  /** Day-to-day operating notes: what to click, what to check weekly. */
  runbook: { title: string; body: string }[];
  /** What the client must do to keep it running (billing, access, renewals). */
  clientActions: string[];
  supportNote?: string;
};

export type ReportMetrics = {
  /** Software components across all the client's products and versions. */
  componentsMonitored: number;
  /** New vulnerabilities that matched one of those components this month. */
  vulnerabilitiesMatched: number;
  /** Matches checked and closed as not affecting the shipped product. */
  assessedNotAffected: number;
  /** Matches checked and confirmed as affecting the product. */
  assessedAffected: number;
  /** Events that met the Article 14 threshold and needed a report. */
  reportableEvents: number;
  /**
   * Median hours from the signal arriving to a reviewed assessment. The
   * headline number: it is the promise the service sells. Null in a month
   * where nothing was assessed, so the portal never shows a flattering 0.
   * Generated by `fenwright-watch monthly`.
   */
  medianHoursToAssessment: number | null;
};

export type ReportDoc = {
  type: "report";
  /** `YYYY-MM`. Rendered as "August 2026". */
  period: string;
  /** Two or three sentences in plain English. Written by hand each month. */
  summary: string;
  /**
   * Shaped so a live Airtable fetch can replace these values later without
   * touching the layout. `previous` drives the change indicator; omit it in
   * the first month, when there is nothing honest to compare against.
   */
  metrics: ReportMetrics & { previous?: ReportMetrics };
  /** What Fenwright changed or watched this month. */
  actionsTaken: string[];
  /** What happens next month. */
  nextMonth: string[];
};

export type PaymentDoc = {
  type: "payment";
  /** Shown as the payment reference so a transfer can be matched to a client. */
  reference: string;
  /** Overrides the default terms from config/documents.ts. */
  termsNote?: string;
};

export type ThankYouDoc = {
  type: "thank-you";
  projectName: string;
  startDate: IsoDate;
  completedDate: IsoDate;
  /** A short personal note. This is the doc that earns the referral. */
  note: string;
  /** Concrete things the client should do over the next few weeks. */
  whatNext: string[];
};

export type FeedbackDoc = {
  type: "feedback";
  projectName: string;
  /** Set true once submitted, so the form renders as complete. */
  submitted?: boolean;
};

export type PackageTier = {
  name: string;
  /** Minor units. Zero renders as a bracketed placeholder. */
  price: Money;
  /** Shown instead of a price, e.g. "Coming 2027", for a tier not yet on sale. */
  priceLabel?: string;
  /** How the price is charged. Defaults to "month". */
  per?: "month" | "one-off";
  /** Short label on the highlighted tier, e.g. "Founding price". Never a claim we can't back up. */
  badge?: string;
  /** Who it suits, one sentence. */
  suitedTo: string;
  includes: string[];
  /** Exactly one tier should set this. */
  highlighted?: boolean;
};

export type PackagesDoc = {
  type: "packages";
  /** Overrides config/documents.ts packageTiers for a bespoke quote. */
  tiers?: PackageTier[];
  intro?: string;
};

export type DocPayload =
  | AgreementDoc
  | WelcomeDoc
  | InvoiceDoc
  | BriefDoc
  | DeliveryDoc
  | ReportDoc
  | PaymentDoc
  | ThankYouDoc
  | FeedbackDoc
  | PackagesDoc;

/**
 * Where a document is in the engagement.
 *
 * An engagement runs over months: a client who signed on Monday should not be
 * looking at a Delivery Guide or a Monthly Report. But those documents are
 * often written well before they are handed over, so they need somewhere to
 * live that is not "not in the file yet".
 *
 * - `live`     Listed and readable. The default.
 * - `upcoming` Listed, greyed out, not clickable. Tells the client what is
 *              still to come, which is reassuring rather than mysterious.
 * - `hidden`   Not listed at all. For a document you are still drafting.
 *
 * Both `upcoming` and `hidden` still render if you visit the URL directly, so
 * you can proofread before releasing. That is deliberate: the whole portal sits
 * behind a passcode, so this controls tidiness, not access.
 */
export type DocStatus = "live" | "upcoming" | "hidden";

/**
 * A document as it appears in a client's portal. `slug` is the URL segment and
 * must be unique within the client, which is what lets invoices and reports
 * recur (`invoice-001`, `report-2026-08`) through a single [doc] route.
 */
export type DocRecord = {
  slug: string;
  /** Shown on the portal index and as the page heading. */
  title: string;
  /** One line on the index card explaining what this document is for. */
  blurb: string;
  /** Defaults to "live" when omitted. */
  status?: DocStatus;
  /**
   * When an `upcoming` document will arrive, in the client's terms: "After
   * handover", "Start of each month". Shown instead of a link.
   */
  expected?: string;
  payload: DocPayload;
};

export type Client = {
  /**
   * URL segment. Include a random suffix so portal URLs cannot be guessed or
   * enumerated, e.g. "lowmoor-controls-8f3a91c2".
   */
  slug: string;
  business: {
    name: string;
    contact: Person;
    /** Billing address, printed on the invoice. */
    address?: string;
    /** The client's own VAT number, if they have one. */
    vatNumber?: string;
  };
  currency: Currency;
  /**
   * SHA-256 of `passcode + passcodeSalt`, hex. Generate the pair with
   * `npm run portal:passcode`. The plaintext passcode is never stored.
   */
  passcodeHash: string;
  passcodeSalt: string;
  docs: DocRecord[];
  /**
   * How far onboarding has got: the number of documents.onboardingSteps that
   * are done. Drives the progress tracker on the dashboard. Once the pipeline
   * reports monitoring as live, every step shows as done regardless.
   */
  engagement?: { completedSteps: number };
  /**
   * Whether this client should be asked for firmware. On by default: the portal
   * has its own Upload page that makes a short-lived link for the signed-in
   * client, so nothing needs running per client. Set `firmwareUpload: false`
   * once their files have arrived to stop asking.
   */
  firmwareUpload?: boolean;
  /**
   * Whether this client may pay invoices by card through the portal. On by
   * default. Set `onlinePayment: false` for a demo or test client, so a real
   * card cannot be charged from it. It is enforced on the server as well as
   * hidden in the page.
   */
  onlinePayment?: boolean;
  /**
   * Legacy: a one-off link from `npm run intake:link`. Only needed to point a
   * client at somewhere other than the built-in Upload page.
   */
  uploadUrl?: string;
};

// --- Live dashboard data (fenwright-watch -> Neon) --------------------------

/**
 * The payload `fenwright-watch sync` writes to Neon's portal_snapshot table,
 * produced by gather() in fenwright-watch's dashboard.py. Validated at runtime
 * by lib/portal/dashboard-schema.ts, so a pipeline change that drifts from
 * this shape shows the client "data unavailable" rather than a broken page.
 * All timestamps are full ISO 8601 with a timezone.
 */
export type FindingStatus = "affected" | "not_affected" | "under_investigation" | "unassessed";

export type DashboardData = {
  generatedAt: string;
  /** True once every product in scope is under continuous monitoring. */
  monitoring: boolean;
  products: {
    name: string;
    version: string;
    components: number;
    lastScanned: string;
    monitoredSince?: string;
  }[];
  totals: {
    components: number;
    matches: number;
    exploited: number;
    affected: number;
    notAffected: number;
    underInvestigation: number;
    unassessed: number;
    awaitingReview: number;
  };
  findings: {
    cve: string;
    product: string;
    component: string;
    cvss: number | null;
    exploited: boolean;
    status: FindingStatus;
    reviewed: boolean;
    justification?: string;
    reasoning?: string;
    decidedAt?: string;
  }[];
  /** Article 14 drafts. `dueAt` is the reporting deadline the draft serves. */
  reports: { cve: string; stage: string; createdAt: string | null; dueAt?: string }[];
  log: {
    at: string;
    event: string;
    by: string | null;
    detail: string;
    product?: string;
    cve?: string;
  }[];
  /** Questions for the client's engineer that block an assessment. */
  questions?: {
    cve: string;
    product: string;
    component: string;
    question: string;
    askedAt?: string;
  }[];
  /** The monthly report numbers for the current month and the one before. */
  monthly?: {
    period: string;
    current: ReportMetrics;
    previous: ReportMetrics | null;
  };
};

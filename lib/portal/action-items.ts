import type { Client, DashboardData, InvoiceDoc } from "@/content/clients/types";

/**
 * "Needs your attention": the top of the client dashboard.
 *
 * Pure, with `now` passed in, so the rules are testable and the server render
 * never disagrees with itself. Every item links to a flow that already exists
 * (the agreement accept form, Stripe's hosted invoice, the upload page, a
 * draft's document). Report drafts and engineer questions have no flow of their
 * own to complete, so those two kinds carry a "Mark as done" button (see
 * markItemDone in app/portal/[client]/actions.ts).
 */

export type ActionItem = {
  id: string;
  kind: "agreement" | "invoice" | "upload" | "report" | "question";
  title: string;
  detail: string;
  href: string;
  /** Opens off-site (Stripe, the upload page). */
  external: boolean;
  /** ISO timestamp or YYYY-MM-DD the item is due by. */
  due?: string;
  urgency: "overdue" | "soon" | "normal";
  /** The client can clear this themselves with "Mark as done". */
  completable: boolean;
};

/** Short stable hash, so a question keeps its id when the list around it changes. */
function shortHash(text: string): string {
  let h = 5381;
  for (let i = 0; i < text.length; i++) h = ((h << 5) + h + text.charCodeAt(i)) | 0;
  return (h >>> 0).toString(36);
}

export function reportItemId(r: { cve: string; stage: string }): string {
  return `report:${r.cve}:${r.stage}`;
}

export function questionItemId(q: { cve: string; question: string }): string {
  return `question:${q.cve}:${shortHash(q.question)}`;
}

export const STAGE_LABELS: Record<string, string> = {
  early_warning: "24-hour early warning",
  notification: "72-hour notification",
  final: "final report",
  advisory: "customer advisory",
};

export function stageLabel(stage: string): string {
  return STAGE_LABELS[stage] ?? stage.replace(/_/g, " ");
}

const DAY = 86_400_000;

function dueTime(due: string): number {
  // A bare date is due at the end of that day, Irish business time being
  // close enough to UTC that a client is never told "overdue" on the day.
  return /^\d{4}-\d{2}-\d{2}$/.test(due)
    ? new Date(`${due}T23:59:59Z`).getTime()
    : new Date(due).getTime();
}

function urgencyFor(due: string | undefined, now: Date, soonWithinMs: number): ActionItem["urgency"] {
  if (!due) return "normal";
  const left = dueTime(due) - now.getTime();
  if (left < 0) return "overdue";
  return left <= soonWithinMs ? "soon" : "normal";
}

export function deriveActionItems(
  client: Client,
  dashboard: DashboardData | null,
  now: Date,
  /** Slugs of agreement documents already signed (looked up from Airtable). */
  signedDocs: ReadonlySet<string> = new Set(),
  /** Slugs of invoice documents already paid in full (flag in the file, or Stripe). */
  settledInvoices: ReadonlySet<string> = new Set(),
  /** How many uploads this client has already sent. Once any have arrived we stop asking. */
  uploadsReceived = 0
): ActionItem[] {
  const base = `/portal/${client.slug}`;
  const items: ActionItem[] = [];
  // Same default as docStatus() in content/clients/index.ts, inlined so this
  // module stays free of the registry and testable on its own.
  const live = client.docs.filter((d) => (d.status ?? "live") === "live");

  for (const doc of live) {
    const p = doc.payload;
    if (p.type === "agreement" && !p.acceptedOn && !signedDocs.has(doc.slug)) {
      items.push({
        id: `agreement:${doc.slug}`,
        kind: "agreement",
        title: "Sign the client agreement",
        detail: "Read it through, then type your name to accept. Onboarding starts once it is signed.",
        href: `${base}/${doc.slug}`,
        external: false,
        urgency: "normal",
        completable: false,
      });
    }
    if (p.type === "invoice" && !p.paid && !settledInvoices.has(doc.slug)) {
      const inv = p as InvoiceDoc;
      items.push({
        id: `invoice:${doc.slug}`,
        kind: "invoice",
        title: `Pay invoice ${inv.number}`,
        detail: "Pay online by card or bank transfer, or use the details on the invoice.",
        href: inv.payUrl ?? `${base}/${doc.slug}`,
        external: Boolean(inv.payUrl),
        due: inv.due,
        urgency: urgencyFor(inv.due, now, 3 * DAY),
        completable: false,
      });
    }
  }

  // Firmware: the portal's own Upload page by default, an external link only
  // when the client file sets one. `firmwareUpload: false` stops asking.
  if (uploadsReceived === 0 && (client.uploadUrl || client.firmwareUpload !== false)) {
    items.push({
      id: "upload",
      kind: "upload",
      title: "Send us your firmware and build files",
      detail: "Upload them here. Files are encrypted in your browser and stay in the EU.",
      href: client.uploadUrl ?? `${base}/upload`,
      external: Boolean(client.uploadUrl),
      urgency: "normal",
      completable: false,
    });
  }

  if (dashboard) {
    for (const r of dashboard.reports) {
      // Drafts carry no "submitted" flag, so one whose deadline has passed may
      // well be done. Only open deadlines are asked for; past ones stay in
      // the activity feed.
      if (!r.dueAt || dueTime(r.dueAt) < now.getTime()) continue;
      items.push({
        id: reportItemId(r),
        kind: "report",
        title: `Approve the ${stageLabel(r.stage)} for ${r.cve}`,
        detail: "We have sent you the draft. Approve it and submit it on ENISA's Single Reporting Platform.",
        href: `${base}/findings#${r.cve}`,
        external: false,
        due: r.dueAt,
        urgency: urgencyFor(r.dueAt, now, 6 * 3_600_000),
        completable: true,
      });
    }

    for (const q of dashboard.questions ?? []) {
      items.push({
        id: questionItemId(q),
        kind: "question",
        title: `A question about ${q.component}`,
        detail: q.question,
        href: `${base}/findings#${q.cve}`,
        external: false,
        urgency: "normal",
        completable: true,
      });
    }
  }

  const rank = { overdue: 0, soon: 1, normal: 2 } as const;
  return items.sort((a, b) => {
    if (rank[a.urgency] !== rank[b.urgency]) return rank[a.urgency] - rank[b.urgency];
    const ad = a.due ? dueTime(a.due) : Infinity;
    const bd = b.due ? dueTime(b.due) : Infinity;
    return ad - bd;
  });
}

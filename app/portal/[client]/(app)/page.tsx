import { notFound } from "next/navigation";
import { getClient } from "@/content/clients";
import type { Client, DashboardData, InvoiceDoc } from "@/content/clients/types";
import { documents } from "@/config/documents";
import { getDashboard } from "@/lib/portal/dashboard";
import { getAgreementAcceptance, listCompletions, listUploads } from "@/lib/airtable";
import { questionItemId, reportHref, reportItemId } from "@/lib/portal/action-items";
import { clientCanPayOnline, invoiceBalance, isSettled, stripePaidAmount } from "@/lib/portal/checkout";
import { deriveActionItems, type ActionItem } from "@/lib/portal/action-items";
import { formatMoney } from "@/lib/portal/format";
import {
  ActivityFeed,
  BillingCard,
  DataUnavailable,
  DeadlinePanel,
  EngagementProgress,
  Figures,
  NeedsYou,
  OpenMatchesChart,
  Outcomes,
  SupportCard,
  type BillingSummary,
  type Deadline,
} from "@/components/portal/dashboard/Widgets";
import { MonthPicker } from "@/components/portal/dashboard/MonthPicker";
import { monthLabel, monthOptions, monthView, pickMonth } from "@/lib/portal/periods";

/**
 * The client's landing page: what needs them, how monitoring is going, where
 * onboarding is, and what they owe. Documents live one click away.
 *
 * Live figures come from Neon via getDashboard(); everything else comes from
 * the client's own file. If Neon cannot be read, the client-file parts still
 * render, so a database blip never locks a client out of signing or paying.
 */
export default async function DashboardPage({
  params,
  searchParams,
}: {
  params: { client: string };
  searchParams: { month?: string };
}) {
  const client = getClient(params.client);
  if (!client) notFound();

  const now = new Date();
  const result = await getDashboard(client.slug);
  // What the client has already marked done is hidden everywhere it would show.
  const done = await listCompletions(client.slug);
  const data = result.ok
    ? {
        ...result.data,
        reports: result.data.reports.filter((r) => !done.has(reportItemId(r))),
        questions: (result.data.questions ?? []).filter((q) => !done.has(questionItemId(q))),
      }
    : null;
  const signedDocs = new Set<string>();
  for (const d of client.docs) {
    if (d.payload.type === "agreement" && (d.status ?? "live") === "live" && (await getAgreementAcceptance(client.slug, d.slug))) {
      signedDocs.add(d.slug);
    }
  }
  // What Stripe has already collected for each live invoice, looked up once and
  // shared by the attention list and the billing card, so both agree with it.
  const paidOnline = new Map<string, number>();
  await Promise.all(
    client.docs.map(async (d) => {
      if (d.payload.type === "invoice" && (d.status ?? "live") === "live") {
        paidOnline.set(d.slug, await stripePaidAmount(client, d.payload));
      }
    })
  );
  const settledInvoices = new Set<string>();
  for (const d of client.docs) {
    if (d.payload.type === "invoice" && isSettled(d.payload, paidOnline.get(d.slug) ?? 0)) settledInvoices.add(d.slug);
  }
  const items = deriveActionItems(client, data, now, signedDocs, settledInvoices, (await listUploads(client.slug)).length);

  // The soonest open reporting deadline gets the clock; everything else that
  // needs the client is listed beside it.
  const deadline = data ? nextDeadline(data, items, now, client.slug) : null;
  const rest = items.filter((i) => i.id !== deadline?.itemId);
  // The month picker: ?month=YYYY-MM, only months the pipeline offers (monitored, at most 12).
  const options = data ? monthOptions(data, now) : [now.toISOString().slice(0, 7)];
  const selected = pickMonth(options, searchParams.month);
  const view = data ? monthView(data, selected, now) : null;
  const hasChart = Boolean(view && view.points.length > 1);
  const live = Boolean(data?.monitoring);

  return (
    <div className="mx-auto max-w-[76rem]">
      <header className="mb-7 flex flex-wrap items-end justify-between gap-x-6 gap-y-2">
        <MonthPicker slug={client.slug} options={options.map((p) => [p, monthLabel(p)])} selected={selected} />
        {!deadline && rest.length === 0 && <p className="text-[0.84rem] text-night-dim">Nothing is waiting on you.</p>}
      </header>

      <div className="space-y-4">
        {(deadline || rest.length > 0) && (
          <div className="grid gap-4 lg:grid-cols-3">
            {deadline && <DeadlinePanel deadline={deadline} now={now} slug={client.slug} />}
            {rest.length > 0 && <NeedsYou items={rest} now={now} slug={client.slug} wide={!deadline} />}
          </div>
        )}

        {data && view ? <Figures data={data} view={view} /> : <DataUnavailable reason={result.ok ? "invalid" : result.reason} />}

        {data && hasChart && (
          <div className="grid gap-4 lg:grid-cols-3">
            <OpenMatchesChart data={data} view={view!} now={now} />
            <Outcomes data={data} />
          </div>
        )}

        <div className="grid gap-4 lg:grid-cols-3">
          {data && <ActivityFeed data={data} now={now} />}
          <div className={`flex flex-col gap-4 ${data ? "" : "lg:col-start-3"}`}>
            {data && !hasChart && <Outcomes data={data} />}
            {!live && (
              <EngagementProgress steps={documents.onboardingSteps} completed={client.engagement?.completedSteps ?? 0} />
            )}
            <BillingCard invoice={billingSummary(client, paidOnline)} documentsHref={`/portal/${client.slug}/documents`} />
            <SupportCard slug={client.slug} />
          </div>
        </div>
      </div>
    </div>
  );
}

/** The soonest report draft still open, if it is also still in the client's list. */
function nextDeadline(data: DashboardData, items: ActionItem[], now: Date, slug: string): Deadline | null {
  const open = data.reports
    .filter((r) => r.dueAt && new Date(r.dueAt).getTime() >= now.getTime())
    .sort((a, b) => a.dueAt!.localeCompare(b.dueAt!));
  for (const r of open) {
    const itemId = reportItemId(r);
    if (!items.some((i) => i.id === itemId)) continue;
    const f = data.findings.find((x) => x.cve === r.cve);
    return {
      cve: r.cve,
      stage: r.stage,
      dueAt: r.dueAt!,
      itemId,
      component: f?.component,
      product: f?.product,
      exploited: Boolean(f?.exploited),
      draftHref: r.fields?.length ? reportHref(slug, r) : null,
    };
  }
  return null;
}

/** The invoice that matters now: the earliest unpaid one, else the latest. */
function billingSummary(client: Client, paidOnline: ReadonlyMap<string, number>): BillingSummary {
  const invoices = client.docs
    .filter((d) => (d.status ?? "live") === "live" && d.payload.type === "invoice")
    .map((d) => ({ slug: d.slug, inv: d.payload as InvoiceDoc }));
  if (invoices.length === 0) return null;

  const unpaid = invoices.filter((i) => !isSettled(i.inv, paidOnline.get(i.slug) ?? 0)).sort((a, b) => a.inv.due.localeCompare(b.inv.due));
  const pick = unpaid[0] ?? [...invoices].sort((a, b) => b.inv.issued.localeCompare(a.inv.issued))[0];
  const totals = invoiceBalance(pick.inv, paidOnline.get(pick.slug) ?? 0);
  const paid = isSettled(pick.inv, paidOnline.get(pick.slug) ?? 0);

  return {
    number: pick.inv.number,
    amount: formatMoney(paid ? totals.total : totals.balanceDue, client.currency),
    due: pick.inv.due,
    paid,
    href: `/portal/${client.slug}/${pick.slug}`,
    payUrl: pick.inv.payUrl,
    slug: client.slug,
    docSlug: pick.slug,
    canPayOnline: clientCanPayOnline(client),
  };
}

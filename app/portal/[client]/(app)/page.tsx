import { notFound } from "next/navigation";
import { getClient } from "@/content/clients";
import type { Client, InvoiceDoc } from "@/content/clients/types";
import { documents } from "@/config/documents";
import { site } from "@/config/site";
import { getDashboard } from "@/lib/portal/dashboard";
import { getAgreementAcceptance, listCompletions, listUploads } from "@/lib/airtable";
import { questionItemId, reportItemId } from "@/lib/portal/action-items";
import { invoiceBalance, isSettled, onlinePaymentAvailable, stripePaidAmount } from "@/lib/portal/checkout";
import { deriveActionItems } from "@/lib/portal/action-items";
import { formatMoney } from "@/lib/portal/format";
import {
  ActionItems,
  ActivityFeed,
  BillingCard,
  DataUnavailable,
  EngagementProgress,
  KpiRow,
  LiveStatus,
  OpenReports,
  type BillingSummary,
} from "@/components/portal/dashboard/Widgets";

/**
 * The client's landing page: what needs them, how monitoring is going, where
 * onboarding is, and what they owe. Documents live one click away.
 *
 * Live figures come from Neon via getDashboard(); everything else comes from
 * the client's own file. If Neon cannot be read, the client-file parts still
 * render, so a database blip never locks a client out of signing or paying.
 */
export default async function DashboardPage({ params }: { params: { client: string } }) {
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

  return (
    <div className="mx-auto max-w-6xl py-2 sm:py-4">
      <header className="mb-8">
        <p className="text-sm text-stone-500">Overview</p>
        <h1 className="mt-2 font-display text-[2rem] font-semibold leading-[1.05] text-ink sm:text-[2.4rem]">
          {client.business.name}
        </h1>
        <div className="mt-3">
          <LiveStatus data={data} now={now} />
        </div>
      </header>

      <div className="space-y-5">
        <ActionItems items={items} now={now} slug={client.slug} />

        {data ? <KpiRow data={data} /> : <DataUnavailable reason={result.ok ? "invalid" : result.reason} />}

        <div className="grid gap-5 lg:grid-cols-3">
          <div className="space-y-5 lg:col-span-2">
            {data && <OpenReports data={data} now={now} />}
            {data && <ActivityFeed data={data} now={now} />}
            {!data && (
              <p className="px-1 text-sm text-stone-500">
                Activity appears here once your figures load. Questions in the meantime:{" "}
                <a href={`mailto:${site.legal.contactEmail}`} className="font-medium text-accent-700 hover:underline">
                  {site.legal.contactEmail}
                </a>
              </p>
            )}
          </div>
          <div className="space-y-5">
            <EngagementProgress
              steps={documents.onboardingSteps}
              completed={client.engagement?.completedSteps ?? 0}
              live={Boolean(data?.monitoring)}
            />
            <BillingCard invoice={billingSummary(client, paidOnline)} documentsHref={`/portal/${client.slug}/documents`} />
          </div>
        </div>
      </div>
    </div>
  );
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
    canPayOnline: onlinePaymentAvailable(),
  };
}

import type { Client, DocRecord, InvoiceDoc } from "@/content/clients/types";
import { DocShell, DocSection, DocText } from "@/components/portal/DocShell";
import { Field, FieldGrid } from "@/components/portal/Field";
import { DocTable, DocRow, DocCell, TotalsRow } from "@/components/portal/DocTable";
import { documents } from "@/config/documents";
import { VAT_RATE, formatDate, formatMoney, invoiceTotals, lineTotal } from "@/lib/portal/format";
import { PayNowForm } from "@/components/portal/PayNowForm";
import { onlinePaymentAvailable } from "@/lib/portal/checkout";
import { site } from "@/config/site";

/**
 * Invoice.
 *
 * The VAT rule here is not cosmetic. site.legal.vatNumber is currently "" --
 * FEN WRIGHT OPERATIONS LIMITED is not VAT registered -- and a business that
 * is not registered must not show or charge VAT. So vatRate is null, the
 * VAT row does not render at all, and a short note says why. Rendering a
 * zero-rated VAT line instead would wrongly imply registration. Set
 * legal.vatNumber in config/site.ts and the row appears automatically.
 */

export function Invoice({
  client,
  doc,
  payload,
  payment,
  paidOnline = 0,
}: {
  client: Client;
  doc: DocRecord;
  payload: InvoiceDoc;
  /** `success` or `cancelled`, from Stripe's return redirect. */
  payment?: string;
  /** Already collected through Stripe for this invoice. */
  paidOnline?: number;
}) {
  const l = site.legal;
  const vatRegistered = Boolean(l.vatNumber);

  const totals = invoiceTotals(payload.lines, {
    vatRate: vatRegistered ? VAT_RATE : null,
    amountPaid: (payload.amountPaid ?? 0) + paidOnline,
  });

  const settled = payload.paid || totals.balanceDue <= 0;

  return (
    <DocShell
      docType="Invoice"
      subtitle={payload.number}
      clientName={client.business.name}
      meta={[
        { label: "Issued", value: formatDate(payload.issued) },
        { label: "Due", value: formatDate(payload.due) },
      ]}
    >
      <div className="grid gap-8 sm:grid-cols-2">
        <div>
          <h2 className="text-xs text-stone-400">From</h2>
          <div className="mt-2 text-[0.94rem] leading-relaxed text-stone-600">
            <p className="font-semibold text-ink">{site.brand.name}</p>
            <p>{l.entityName}</p>
            {l.address && <p>{l.address}</p>}
            {l.registrationNumber && <p>Company no. {l.registrationNumber}</p>}
            {l.vatNumber && <p>VAT {l.vatNumber}</p>}
            <p>{l.contactEmail}</p>
          </div>
        </div>
        <div>
          <h2 className="text-xs text-stone-400">Bill to</h2>
          <div className="mt-2 text-[0.94rem] leading-relaxed text-stone-600">
            <p className="font-semibold text-ink">{client.business.name}</p>
            <p>{client.business.contact.name}</p>
            {client.business.address && <p>{client.business.address}</p>}
            {client.business.vatNumber && <p>VAT {client.business.vatNumber}</p>}
            {client.business.contact.email && <p>{client.business.contact.email}</p>}
          </div>
        </div>
      </div>

      <DocSection title="Invoice details">
        <FieldGrid>
          <Field label="Invoice number" value={payload.number} />
          <Field label="Payment terms" value={`${documents.agreement.paymentTermDays} days`} />
          <Field label="Project" value={payload.projectReference} />
          <Field label="Purchase order" value={payload.purchaseOrder} />
        </FieldGrid>
      </DocSection>

      <DocSection title="Services">
        <DocTable
          columns={[
            { key: "kind", label: "Type", width: "w-24" },
            { key: "desc", label: "Description" },
            { key: "qty", label: "Qty", align: "right", width: "w-14" },
            { key: "rate", label: "Rate", align: "right", width: "w-24" },
            { key: "amount", label: "Amount", align: "right", width: "w-28" },
          ]}
        >
          {payload.lines.map((line, i) => (
            <DocRow key={i}>
              <DocCell muted>{line.kind}</DocCell>
              <DocCell>{line.description}</DocCell>
              <DocCell align="right">{line.quantity}</DocCell>
              <DocCell align="right">{formatMoney(line.unitPrice, client.currency)}</DocCell>
              <DocCell align="right" strong>
                {formatMoney(lineTotal(line), client.currency)}
              </DocCell>
            </DocRow>
          ))}
        </DocTable>

        <div className="mt-6 flex justify-end">
          <div className="w-full max-w-xs">
            <TotalsRow label="Subtotal" value={formatMoney(totals.subtotal, client.currency)} />
            {totals.vat && (
              <TotalsRow
                label={`VAT at ${Math.round(totals.vat.rate * 100)}%`}
                value={formatMoney(totals.vat.amount, client.currency)}
              />
            )}
            <TotalsRow label="Total" value={formatMoney(totals.total, client.currency)} />
            {totals.paid > 0 && (
              <TotalsRow
                label="Already paid"
                value={`- ${formatMoney(totals.paid, client.currency)}`}
              />
            )}
            <TotalsRow
              label={settled ? "Paid in full" : "Balance due"}
              value={formatMoney(settled ? 0 : totals.balanceDue, client.currency)}
              emphasis
            />
          </div>
        </div>

        {!vatRegistered && (
          <p className="mt-5 text-xs leading-relaxed text-stone-500">
            No VAT is charged on this invoice. {l.entityName} is not registered for VAT.
          </p>
        )}
      </DocSection>

      {!settled && (
        <DocSection title="How to pay">
          <DocText>
            Payable by {formatDate(payload.due)}, quoting reference{" "}
            <span className="font-semibold text-ink">{payload.number}</span>. Full bank
            details are in your Payment Details document. We will never email you asking
            you to change our bank details: if you receive a message like that, ring us
            before you send anything.
          </DocText>
          {payment === "success" && (
            <p className="mt-4 rounded-lg border border-accent/40 bg-accent-soft/60 px-4 py-3 text-sm text-ink print:hidden">
              Thank you. Your payment has gone through to Stripe. We mark an invoice paid once
              the money reaches us, so this page may show it as unpaid until then.
            </p>
          )}
          {payment === "cancelled" && (
            <p className="mt-4 rounded-lg border border-stone-300 bg-stone-50 px-4 py-3 text-sm text-stone-700 print:hidden">
              No payment was taken. You can try again whenever you are ready.
            </p>
          )}
          {!payload.payUrl && onlinePaymentAvailable() && (
            <div className="mt-4">
              <PayNowForm slug={client.slug} docSlug={doc.slug} label={`Pay ${formatMoney(totals.balanceDue, client.currency)} online`} />
              <p className="mt-2 text-xs text-stone-500 print:hidden">
                Opens Stripe&apos;s secure payment page. Card or bank transfer.
              </p>
            </div>
          )}
          {payload.payUrl?.startsWith("https://invoice.stripe.com/") && (
            <p className="mt-4 print:hidden">
              <a
                href={payload.payUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center rounded-lg bg-ink px-4 py-2.5 text-sm font-semibold text-white hover:bg-ink/90"
              >
                Pay online by card or bank transfer
              </a>
              <span className="ml-3 text-xs text-stone-500">Opens Stripe&apos;s secure payment page.</span>
            </p>
          )}
        </DocSection>
      )}
    </DocShell>
  );
}

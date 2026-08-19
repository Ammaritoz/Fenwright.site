import type { Client, InvoiceDoc } from "@/content/clients/types";
import { DocShell, DocSection, DocText } from "@/components/portal/DocShell";
import { Field, FieldGrid } from "@/components/portal/Field";
import { DocTable, DocRow, DocCell, TotalsRow } from "@/components/portal/DocTable";
import { documents } from "@/config/documents";
import { formatDate, formatMoney, invoiceTotals, lineTotal } from "@/lib/portal/format";
import { site } from "@/config/site";

/**
 * Invoice.
 *
 * The VAT rule here is not cosmetic. site.legal.vatNumber is currently "" --
 * Fenwright trades as a sole trader and is not VAT registered -- and a business
 * that is not registered must not show or charge VAT. So vatRate is null, the
 * VAT row does not render at all, and a short note says why. Rendering a
 * zero-rated VAT line instead would wrongly imply registration. Set
 * legal.vatNumber in config/site.ts and the row appears automatically.
 */
const VAT_RATE = 0.23; // Irish standard rate, applied only once registered.

export function Invoice({ client, payload }: { client: Client; payload: InvoiceDoc }) {
  const l = site.legal;
  const vatRegistered = Boolean(l.vatNumber);

  const totals = invoiceTotals(payload.lines, {
    vatRate: vatRegistered ? VAT_RATE : null,
    amountPaid: payload.amountPaid,
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
          <h2 className="text-[0.65rem] uppercase tracking-[0.14em] text-stone-400">From</h2>
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
          <h2 className="text-[0.65rem] uppercase tracking-[0.14em] text-stone-400">Bill to</h2>
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
        </DocSection>
      )}
    </DocShell>
  );
}

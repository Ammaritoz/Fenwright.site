import type { Client, PaymentDoc } from "@/content/clients/types";
import { DocShell, DocSection, DocCallout, DocText } from "@/components/portal/DocShell";
import { Field, FieldGrid } from "@/components/portal/Field";
import { documents } from "@/config/documents";
import { site } from "@/config/site";

/**
 * How to pay us.
 *
 * documents.paymentDetails ships blank on purpose. Rather than rendering a
 * confident-looking page nobody can actually pay from, an unfilled account
 * shows a visible warning -- the failure is loud at the moment it can still be
 * fixed, instead of silent until a client emails asking where to send money.
 */
export function PaymentDetails({ client, payload }: { client: Client; payload: PaymentDoc }) {
  const p = documents.paymentDetails;
  const hasSepa = Boolean(p.accountName && p.iban);
  const hasUk = Boolean(p.ukSortCode && p.ukAccountNumber);
  const anyMethod = hasSepa || hasUk || Boolean(p.stripeLink);

  return (
    <DocShell
      docType="Payment Details"
      subtitle="How to pay"
      clientName={client.business.name}
      meta={[{ label: "Reference", value: payload.reference }]}
    >
      {!anyMethod && (
        <div className="mb-7 break-inside-avoid rounded-xl border-2 border-amber-500/60 bg-amber-50 px-5 py-4">
          <p className="text-sm font-semibold text-amber-900">
            Payment details not filled in yet
          </p>
          <p className="mt-1 text-sm leading-relaxed text-amber-800">
            Fill in <code className="font-mono text-[0.85em]">documents.paymentDetails</code>{" "}
            in <code className="font-mono text-[0.85em]">config/documents.ts</code> before
            sending this to a client. This warning is only visible while they are blank.
          </p>
        </div>
      )}

      <DocCallout>
        <p className="font-semibold">Use this reference: {payload.reference}</p>
        <p className="mt-1 text-stone-600">
          It is how we match your payment to your account. Without it, a transfer can sit
          unallocated for days and you may get a reminder you have already paid.
        </p>
      </DocCallout>

      {hasSepa && (
        <DocSection title={client.currency === "EUR" ? "Bank transfer (euro)" : "Bank transfer (SEPA)"}>
          <FieldGrid>
            <Field label="Account name" value={p.accountName} />
            <Field label="IBAN" value={<span className="font-mono text-[0.9em]">{p.iban}</span>} />
            <Field label="BIC" value={<span className="font-mono text-[0.9em]">{p.bic}</span>} />
            <Field label="Reference" value={payload.reference} />
          </FieldGrid>
        </DocSection>
      )}

      {hasUk && (
        <DocSection title="Bank transfer (sterling)">
          <FieldGrid>
            <Field label="Account name" value={p.accountName} />
            <Field label="Sort code" value={<span className="font-mono text-[0.9em]">{p.ukSortCode}</span>} />
            <Field
              label="Account number"
              value={<span className="font-mono text-[0.9em]">{p.ukAccountNumber}</span>}
            />
            <Field label="Reference" value={payload.reference} />
          </FieldGrid>
        </DocSection>
      )}

      {p.stripeLink && (
        <DocSection title="Card">
          <DocText>
            Prefer to pay by card? Use the secure Stripe link below. Card payments clear
            immediately, which is the fastest way to release a build slot.
          </DocText>
          <a
            href={p.stripeLink}
            className="mt-4 inline-block break-all text-sm font-medium text-accent-700 underline underline-offset-4"
          >
            {p.stripeLink}
          </a>
        </DocSection>
      )}

      <DocSection title="Terms">
        <DocText>
          {payload.termsNote ??
            `Invoices are payable within ${documents.agreement.paymentTermDays} days of the invoice date. Where a deposit is due, work begins once it clears.`}
        </DocText>
      </DocSection>

      <DocSection title="A word on fraud">
        <div className="break-inside-avoid rounded-xl border border-stone-300 bg-stone-50 px-5 py-4 print:bg-transparent">
          <p className="text-[0.94rem] leading-relaxed text-stone-700">{p.note}</p>
          <p className="mt-3 text-[0.94rem] leading-relaxed text-stone-700">
            If anything about a payment request from us looks even slightly off, ring us on
            the number you already have, or email {site.legal.contactEmail}. We will never
            be annoyed at being asked to confirm.
          </p>
        </div>
      </DocSection>
    </DocShell>
  );
}

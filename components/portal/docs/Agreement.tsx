import type { AgreementDoc, Client, DocRecord } from "@/content/clients/types";
import { DocShell, DocSection, DocList } from "@/components/portal/DocShell";
import { Field, FieldGrid } from "@/components/portal/Field";
import { DocTable, DocRow, DocCell } from "@/components/portal/DocTable";
import { AcceptForm } from "@/components/portal/AcceptForm";
import { documents } from "@/config/documents";
import { formatMoney } from "@/lib/portal/format";
import { site } from "@/config/site";

/**
 * The client agreement.
 *
 * Two things here are load-bearing rather than decorative:
 *
 * 1. The amber draft band, shown while payload.solicitorReviewed is false. This
 *    document was drafted to be readable and to cover the right ground, but it
 *    has not been reviewed by a lawyer. The band makes it structurally awkward
 *    to send an unreviewed contract to a paying client, which is the failure
 *    this design is guarding against.
 *
 * 2. The data protection section. Fenwright's systems handle the client's
 *    customers' names, phone numbers and enquiry contents, which makes
 *    Fenwright a processor under GDPR Article 28. Those clauses are a legal
 *    requirement of that relationship, not boilerplate padding.
 */

/** Substitutes {tokens} in clause bodies from the client's own figures. */
function fill(body: string, values: Record<string, string>): string {
  return body.replace(/\{(\w+)\}/g, (match, key: string) => values[key] ?? match);
}

export function Agreement({
  client,
  doc,
  payload,
}: {
  client: Client;
  doc: DocRecord;
  payload: AgreementDoc;
}) {
  const a = documents.agreement;
  const tokens = {
    paymentTermDays: String(a.paymentTermDays),
    noticeDays: String(payload.noticeDays),
    dataRetention: site.legal.dataRetention,
  };

  return (
    <DocShell
      docType="Client Agreement"
      subtitle="Service agreement"
      clientName={client.business.name}
    >
      {!payload.solicitorReviewed && (
        <div className="mb-8 break-inside-avoid rounded-xl border-2 border-amber-500/60 bg-amber-50 px-5 py-4">
          <p className="text-[0.6rem] font-semibold uppercase tracking-[0.16em] text-amber-700">
            Internal notice, not for the client
          </p>
          <p className="mt-1.5 text-sm font-semibold text-amber-900">
            Draft: this agreement has not been reviewed by a solicitor.
          </p>
          <p className="mt-1 text-sm leading-relaxed text-amber-800">
            Do not send this link to a client while this band is showing. Have a solicitor
            read the agreement, then set{" "}
            <code className="font-mono text-[0.85em]">solicitorReviewed: true</code> in{" "}
            <code className="font-mono text-[0.85em]">content/clients/{client.slug}.ts</code>{" "}
            to clear it.
          </p>
        </div>
      )}

      <DocSection title="Parties to this agreement">
        <FieldGrid>
          <Field label="Service provider" value={site.brand.name} />
          <Field label="Client" value={client.business.name} />
          <Field label="Legal entity" value={site.legal.entityName} />
          <Field label="Client contact" value={client.business.contact.name} />
          <Field label="Address" value={site.legal.address} />
          <Field label="Client address" value={client.business.address} />
          <Field label="Email" value={site.legal.contactEmail} />
          <Field label="Client email" value={client.business.contact.email} />
          <Field label="Company number" value={site.legal.registrationNumber} />
          <Field label="Client VAT number" value={client.business.vatNumber} />
        </FieldGrid>
      </DocSection>

      <DocSection title="Introduction">
        <p className="text-[0.94rem] leading-relaxed text-stone-600">{a.intro}</p>
      </DocSection>

      <DocSection title="Scope of work">
        <DocList items={payload.scope} />
      </DocSection>

      <DocSection title="Not included">
        <DocList items={payload.exclusions} />
        <p className="mt-3 text-xs leading-relaxed text-stone-500">
          Anything above is outside this agreement and would be quoted separately before it
          begins.
        </p>
      </DocSection>

      <DocSection title="Fees and payment schedule">
        <div className="break-inside-avoid rounded-xl border border-stone-300 bg-paper/60 px-5 py-4 print:bg-transparent">
          <p className="text-[0.65rem] uppercase tracking-[0.14em] text-stone-400">
            Total project fee
          </p>
          <p className="mt-1 font-display text-3xl font-bold text-ink">
            {formatMoney(payload.totalFee, client.currency)}
          </p>
          {!site.legal.vatNumber && (
            <p className="mt-1 text-xs text-stone-500">
              No VAT is chargeable. {site.legal.entityName} is not registered for VAT.
            </p>
          )}
        </div>

        <div className="mt-5">
          <DocTable
            columns={[
              { key: "label", label: "Payment", width: "w-28" },
              { key: "amount", label: "Amount", align: "right", width: "w-28" },
              { key: "due", label: "Due", width: "w-32" },
              { key: "note", label: "Description" },
            ]}
          >
            {payload.schedule.map((m) => (
              <DocRow key={m.label}>
                <DocCell strong>{m.label}</DocCell>
                <DocCell align="right" strong>
                  {formatMoney(m.amount, client.currency)}
                </DocCell>
                <DocCell muted>{m.due}</DocCell>
                <DocCell>{m.note ?? ""}</DocCell>
              </DocRow>
            ))}
          </DocTable>
        </div>
      </DocSection>

      <DocSection title="Third party services you pay for directly">
        <DocList items={payload.passThroughServices} />
      </DocSection>

      <DocSection title="Terms and conditions">
        <ol className="space-y-5">
          {a.clauses.map((clause, i) => (
            <li key={clause.title} className="flex gap-4 break-inside-avoid">
              <span className="w-5 shrink-0 pt-0.5 text-sm font-semibold text-stone-400">
                {i + 1}.
              </span>
              <div>
                <h3 className="font-display text-base font-semibold text-ink">
                  {clause.title}
                </h3>
                <p className="mt-1 text-[0.92rem] leading-relaxed text-stone-600">
                  {fill(clause.body, tokens)}
                </p>
              </div>
            </li>
          ))}
        </ol>
      </DocSection>

      <DocSection title={a.dataProtection.title}>
        <p className="text-[0.92rem] leading-relaxed text-stone-600">
          {a.dataProtection.intro}
        </p>
        <ol className="mt-5 space-y-5">
          {a.dataProtection.clauses.map((clause, i) => (
            <li key={clause.title} className="flex gap-4 break-inside-avoid">
              <span className="w-8 shrink-0 pt-0.5 text-sm font-semibold text-stone-400">
                {a.clauses.length + i + 1}.
              </span>
              <div>
                <h3 className="font-display text-base font-semibold text-ink">
                  {clause.title}
                </h3>
                <p className="mt-1 text-[0.92rem] leading-relaxed text-stone-600">
                  {fill(clause.body, tokens)}
                </p>
              </div>
            </li>
          ))}
        </ol>

        <div className="mt-6">
          <h3 className="text-[0.65rem] uppercase tracking-[0.14em] text-stone-400">
            Approved sub-processors
          </h3>
          <div className="mt-2">
            <DocTable
              columns={[
                { key: "name", label: "Service", width: "w-28" },
                { key: "purpose", label: "What it is used for" },
                { key: "location", label: "Location", width: "w-32" },
              ]}
            >
              {documents.subProcessors.map((sp) => (
                <DocRow key={sp.name}>
                  <DocCell strong>{sp.name}</DocCell>
                  <DocCell>{sp.purpose}</DocCell>
                  <DocCell muted>{sp.location}</DocCell>
                </DocRow>
              ))}
            </DocTable>
          </div>
          <p className="mt-3 text-xs leading-relaxed text-stone-500">
            Transfers to sub-processors outside the EEA are made under the European
            Commission&rsquo;s Standard Contractual Clauses or another lawful transfer
            mechanism.
          </p>
        </div>
      </DocSection>

      <DocSection title="Acceptance">
        <p className="text-[0.92rem] leading-relaxed text-stone-600">{a.signatureNote}</p>
        <AcceptForm
          slug={client.slug}
          docSlug={doc.slug}
          businessName={client.business.name}
          contactName={client.business.contact.name}
        />
      </DocSection>
    </DocShell>
  );
}

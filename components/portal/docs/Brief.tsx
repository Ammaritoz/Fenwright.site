import type { BriefDoc, Client } from "@/content/clients/types";
import { DocShell, DocSection, DocList, DocText } from "@/components/portal/DocShell";
import { Field, FieldGrid } from "@/components/portal/Field";
import { DocTable, DocRow, DocCell } from "@/components/portal/DocTable";
import { formatDate } from "@/lib/portal/format";

/**
 * The scope, agreed before onboarding starts. Its job is to be corrected:
 * a client reading this and saying "that is not quite it" on day two is the
 * cheapest possible time to find out.
 */
export function Brief({ client, payload }: { client: Client; payload: BriefDoc }) {
  return (
    <DocShell
      docType="Service Brief"
      subtitle="Scope document"
      clientName={client.business.name}
      meta={[{ label: "Deadline", value: formatDate(payload.deadline) }]}
    >
      <DocSection title="Overview">
        <FieldGrid>
          <Field label="Project" value={payload.projectTitle} />
          <Field label="Deadline" value={formatDate(payload.deadline)} />
          <Field label="Client" value={client.business.name} />
          <Field label="Main contact" value={client.business.contact.name} />
        </FieldGrid>
      </DocSection>

      <DocSection title="Objective">
        <DocText>{payload.objective}</DocText>
      </DocSection>

      <DocSection title="Products in scope">
        <DocTable
          columns={[
            { key: "name", label: "Product" },
            { key: "versions", label: "Versions" },
            { key: "source", label: "Ingredients list from" },
          ]}
        >
          {payload.products.map((p) => (
            <DocRow key={p.name}>
              <DocCell strong>{p.name}</DocCell>
              <DocCell>{p.versions}</DocCell>
              <DocCell muted>{p.source}</DocCell>
            </DocRow>
          ))}
        </DocTable>
      </DocSection>

      <DocSection title="How we will know it worked">
        <DocList items={payload.successCriteria} />
      </DocSection>

      <DocSection title="Who does what">
        <div className="grid gap-5 sm:grid-cols-2">
          {[
            { label: "Fenwright", items: payload.responsibilities.fenwright },
            { label: client.business.name, items: payload.responsibilities.client },
          ].map((side) => (
            <div
              key={side.label}
              className="break-inside-avoid rounded-xl border border-stone-200 bg-paper/60 p-4 print:bg-transparent"
            >
              <p className="text-xs text-stone-400">{side.label}</p>
              <div className="mt-3">
                <DocList items={side.items} />
              </div>
            </div>
          ))}
        </div>
      </DocSection>

      {payload.constraints && payload.constraints.length > 0 && (
        <DocSection title="Constraints">
          <DocList items={payload.constraints} />
        </DocSection>
      )}

      <DocSection title="Sign-off">
        <DocText>
          Read this and tell us what we got wrong. A product or firmware version missing
          from the list above is a version we are not watching, so it is far cheaper to fix
          now. Once you confirm this brief, it is what we work to, and adding products is
          quoted separately.
        </DocText>
      </DocSection>
    </DocShell>
  );
}

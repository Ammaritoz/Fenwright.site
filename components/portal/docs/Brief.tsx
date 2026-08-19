import type { BriefDoc, Client } from "@/content/clients/types";
import { DocShell, DocSection, DocCallout, DocList, DocText } from "@/components/portal/DocShell";
import { Field, FieldGrid } from "@/components/portal/Field";
import { formatDate } from "@/lib/portal/format";

/**
 * The scope, agreed before anything gets built. Its job is to be corrected:
 * a client reading this and saying "that is not quite it" on day two is the
 * cheapest possible time to find out.
 */
export function Brief({ client, payload }: { client: Client; payload: BriefDoc }) {
  return (
    <DocShell
      docType="Project Brief"
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

      <DocSection title="Who this is for">
        <div className="grid gap-5 sm:grid-cols-3">
          {[
            { label: "Who they are", value: payload.audience.who },
            { label: "Their problem", value: payload.audience.painPoint },
            { label: "What they care about", value: payload.audience.cares },
          ].map((item) => (
            <div
              key={item.label}
              className="break-inside-avoid rounded-xl border border-stone-200 bg-paper/60 p-4 print:bg-transparent"
            >
              <p className="text-[0.63rem] uppercase tracking-[0.13em] text-stone-400">
                {item.label}
              </p>
              <p className="mt-2 text-[0.88rem] leading-relaxed text-stone-600">{item.value}</p>
            </div>
          ))}
        </div>
      </DocSection>

      <DocSection title="Key message">
        <DocCallout>
          <p className="font-display text-lg font-semibold italic leading-snug">
            &ldquo;{payload.keyMessage}&rdquo;
          </p>
        </DocCallout>
      </DocSection>

      <DocSection title="How we will know it worked">
        <DocList items={payload.successCriteria} />
      </DocSection>

      {payload.constraints && payload.constraints.length > 0 && (
        <DocSection title="Constraints">
          <DocList items={payload.constraints} />
        </DocSection>
      )}

      <DocSection title="Sign-off">
        <DocText>
          Read this and tell us what we got wrong. Anything we have misheard is far cheaper
          to fix now than after it is built. Once you confirm this brief, it is what we
          build against, and changes to it are quoted separately.
        </DocText>
      </DocSection>
    </DocShell>
  );
}

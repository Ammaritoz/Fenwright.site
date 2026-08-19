import type { Client, DeliveryDoc } from "@/content/clients/types";
import { DocShell, DocSection, DocCallout, DocList, DocText } from "@/components/portal/DocShell";
import { DocTable, DocRow, DocCell } from "@/components/portal/DocTable";
import { formatDate } from "@/lib/portal/format";
import { site } from "@/config/site";

/**
 * Systems handover.
 *
 * Not a list of files in a Drive folder: what each system does, which account
 * it runs on, and what the client has to do to keep it alive. The accountOwner
 * column is the part clients thank you for a year later, when they want to know
 * what they are actually paying for each month.
 */
export function Delivery({ client, payload }: { client: Client; payload: DeliveryDoc }) {
  return (
    <DocShell
      docType="Delivery Guide"
      subtitle="Systems handover"
      clientName={client.business.name}
      meta={[{ label: "Delivered", value: formatDate(payload.deliveredOn) }]}
    >
      <DocCallout>
        <p className="font-semibold">Your systems are live.</p>
        <p className="mt-1 text-stone-600">
          Everything below is running now. Read this guide once, then keep it. It is the
          answer to almost every question you will have in the next six months.
        </p>
      </DocCallout>

      <DocSection title="What we built">
        <DocTable
          columns={[
            { key: "name", label: "System" },
            { key: "does", label: "What it does" },
            { key: "platform", label: "Runs on", width: "w-28" },
            { key: "owner", label: "Account", width: "w-24" },
          ]}
        >
          {payload.systems.map((s) => (
            <DocRow key={s.name}>
              <DocCell strong>{s.name}</DocCell>
              <DocCell>{s.whatItDoes}</DocCell>
              <DocCell muted>{s.platform}</DocCell>
              <DocCell muted>{s.accountOwner}</DocCell>
            </DocRow>
          ))}
        </DocTable>
        <p className="mt-3 text-xs leading-relaxed text-stone-500">
          Where the account is in your name, you own it outright and keep it whatever
          happens between us. That is deliberate.
        </p>
      </DocSection>

      <DocSection title="Running it day to day">
        <div className="space-y-5">
          {payload.runbook.map((item) => (
            <div key={item.title} className="break-inside-avoid">
              <h3 className="font-display text-base font-semibold text-ink">{item.title}</h3>
              <p className="mt-1 text-[0.94rem] leading-relaxed text-stone-600">{item.body}</p>
            </div>
          ))}
        </div>
      </DocSection>

      <DocSection title="What we need you to keep on top of">
        <DocList items={payload.clientActions} />
      </DocSection>

      {payload.supportNote && (
        <DocSection title="Support">
          <DocText>{payload.supportNote}</DocText>
        </DocSection>
      )}

      <DocSection title="If something breaks">
        <DocText>
          Tell us before you change anything. Most problems are a third party service
          having a bad ten minutes, and switching things off makes it harder to see what
          happened. Email {site.legal.contactEmail}, or text the mobile number in your
          welcome pack if enquiries are actively going unanswered.
        </DocText>
      </DocSection>
    </DocShell>
  );
}

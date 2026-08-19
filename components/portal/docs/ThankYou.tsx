import Link from "next/link";
import type { Client, ThankYouDoc } from "@/content/clients/types";
import { DocShell, DocSection, DocList, DocText } from "@/components/portal/DocShell";
import { Field, FieldGrid } from "@/components/portal/Field";
import { formatDate } from "@/lib/portal/format";

/** Project close. The document that decides whether there is a second project. */
export function ThankYou({ client, payload }: { client: Client; payload: ThankYouDoc }) {
  const feedbackDoc = client.docs.find((d) => d.payload.type === "feedback");

  return (
    <DocShell
      docType="Thank You"
      subtitle="Project complete"
      clientName={client.business.name}
      meta={[{ label: "Completed", value: formatDate(payload.completedDate) }]}
    >
      <h2 className="font-display text-2xl font-bold leading-snug text-ink sm:text-3xl">
        It has been a pleasure working with you.
      </h2>
      <DocText>{payload.note}</DocText>

      <DocSection title="Project recap">
        <FieldGrid>
          <Field label="Project" value={payload.projectName} />
          <Field label="Started" value={formatDate(payload.startDate)} />
          <Field label="Completed" value={formatDate(payload.completedDate)} />
          <Field label="Delivered to" value={client.business.name} />
        </FieldGrid>
      </DocSection>

      <DocSection title="What to do next">
        <DocList items={payload.whatNext} />
      </DocSection>

      {feedbackDoc && (
        <DocSection title="One favour">
          <DocText>
            If we did right by you, two minutes of feedback helps us more than anything
            else. It tells us what to keep doing, and it helps the next owner deciding
            whether to trust us with their front door.
          </DocText>
          <Link
            href={`/portal/${client.slug}/${feedbackDoc.slug}`}
            className="btn-primary mt-5 text-sm print:hidden"
          >
            Leave feedback
          </Link>
        </DocSection>
      )}
    </DocShell>
  );
}

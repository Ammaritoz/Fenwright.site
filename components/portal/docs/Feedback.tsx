import type { Client, DocRecord, FeedbackDoc } from "@/content/clients/types";
import { DocShell, DocSection, DocCallout } from "@/components/portal/DocShell";
import { FeedbackForm } from "@/components/portal/FeedbackForm";
import { documents } from "@/config/documents";

/** Client experience survey. Ratings plus the three questions worth asking. */
export function Feedback({
  client,
  doc,
  payload,
}: {
  client: Client;
  doc: DocRecord;
  payload: FeedbackDoc;
}) {
  return (
    <DocShell
      docType="Feedback Request"
      subtitle="Client experience"
      clientName={client.business.name}
    >
      <DocCallout>
        <p className="font-semibold">Your feedback matters, genuinely.</p>
        <p className="mt-1 text-stone-600">{documents.feedback.intro}</p>
      </DocCallout>

      <DocSection title={payload.projectName}>
        <FeedbackForm
          slug={client.slug}
          docSlug={doc.slug}
          alreadySubmitted={payload.submitted ?? false}
          ratings={documents.feedback.ratings}
          questions={documents.feedback.questions}
          testimonialLabel={documents.feedback.testimonialLabel}
        />
      </DocSection>
    </DocShell>
  );
}

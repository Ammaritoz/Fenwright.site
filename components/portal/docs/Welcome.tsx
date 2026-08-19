import type { Client, WelcomeDoc } from "@/content/clients/types";
import { DocShell, DocSection, DocCallout, DocText } from "@/components/portal/DocShell";
import { Field, FieldGrid } from "@/components/portal/Field";
import { documents } from "@/config/documents";
import { formatDate } from "@/lib/portal/format";
import { site } from "@/config/site";

/** Onboarding pack: what happens over the next few weeks, and who to ask. */
export function Welcome({ client, payload }: { client: Client; payload: WelcomeDoc }) {
  const steps = payload.steps ?? documents.onboardingSteps;

  return (
    <DocShell
      docType="Welcome Pack"
      subtitle="Onboarding"
      clientName={client.business.name}
      meta={[{ label: "Start", value: formatDate(payload.startDate) }]}
    >
      <h2 className="font-display text-2xl font-bold leading-snug text-ink sm:text-3xl">
        Welcome to Fenwright, {client.business.name}.
      </h2>
      <DocText>
        We are glad to be working with you. This is everything you need to know about how
        the next few weeks run, so nothing comes as a surprise and you always know what we
        need from you.
      </DocText>

      <DocSection title="Your project at a glance">
        <FieldGrid>
          <Field label="Project" value={payload.projectName} />
          <Field label="Start date" value={formatDate(payload.startDate)} />
          <Field label="Target delivery" value={formatDate(payload.targetDelivery)} />
          <Field label="Your point of contact" value={payload.pointOfContact} />
          <Field label="Main contact at your end" value={client.business.contact.name} />
          <Field label="Reaching us" value={site.legal.contactEmail} />
        </FieldGrid>
      </DocSection>

      <DocSection title="What happens next">
        <ol className="space-y-5">
          {steps.map((step, i) => (
            <li key={step.title} className="flex gap-4 break-inside-avoid">
              <span
                aria-hidden="true"
                className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-ink text-[0.7rem] font-semibold text-paper"
              >
                {String(i + 1).padStart(2, "0")}
              </span>
              <div>
                <h3 className="font-display text-base font-semibold text-ink">{step.title}</h3>
                <p className="mt-1 text-[0.94rem] leading-relaxed text-stone-600">{step.body}</p>
              </div>
            </li>
          ))}
        </ol>
      </DocSection>

      <DocSection title="What we need from you">
        <DocCallout>
          The one thing that slows a build down is waiting on a decision or an account
          login. If we ask for something, a reply the same day keeps your delivery date
          where it is. If you go quiet for a week, the date moves. We would rather say that
          now than explain it later.
        </DocCallout>
      </DocSection>

      <DocSection title="How to reach us">
        <DocText>
          Email {site.legal.contactEmail} for anything that can wait until tomorrow. For
          anything that cannot, text or ring the mobile number we gave you on the call.
          You are not going through a support desk. You are talking to the two people who
          built your systems.
        </DocText>
      </DocSection>
    </DocShell>
  );
}

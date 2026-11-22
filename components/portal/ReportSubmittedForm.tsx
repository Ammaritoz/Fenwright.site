"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useFormState, useFormStatus } from "react-dom";
import { markReportSubmitted, type ActionState } from "@/app/portal/[client]/actions";
import { night } from "@/components/portal/night";

const initialState: ActionState = {};

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <button type="submit" disabled={pending} className={night.btnPrimary}>
      {pending ? "Saving..." : "Record as submitted"}
    </button>
  );
}

/**
 * "I've submitted it": the client's own record that they filed this draft on
 * ENISA's platform. A tick box first, so it is never recorded by a stray
 * click. Receives the slug, CVE and stage only; the server checks the draft
 * exists for this client before recording anything.
 */
export function ReportSubmittedForm({ slug, cve, stage }: { slug: string; cve: string; stage: string }) {
  const [state, formAction] = useFormState(markReportSubmitted, initialState);
  const router = useRouter();

  useEffect(() => {
    if (state.ok) router.refresh();
  }, [state.ok, router]);

  return (
    <form action={formAction} className="flex flex-col gap-3 print:hidden">
      <input type="hidden" name="slug" value={slug} />
      <input type="hidden" name="cve" value={cve} />
      <input type="hidden" name="stage" value={stage} />
      <label className="flex items-start gap-3 text-[0.86rem] leading-relaxed text-night-dim">
        <input
          type="checkbox"
          name="confirmed"
          value="yes"
          required
          className="mt-1 h-4 w-4 shrink-0 rounded border-night-edge bg-night-raised accent-[#6FD6A8]"
        />
        I have submitted this report on ENISA&apos;s Single Reporting Platform.
      </label>
      <div>
        <SubmitButton />
      </div>
      {state.error && (
        <p role="alert" className="text-sm text-signal-orange">
          {state.error}
        </p>
      )}
    </form>
  );
}

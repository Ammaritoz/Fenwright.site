"use client";

import { useFormState, useFormStatus } from "react-dom";
import { acceptAgreement, type ActionState } from "@/app/portal/[client]/actions";

const initialState: ActionState = {};

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <button type="submit" disabled={pending} className="btn-primary mt-5 disabled:opacity-60">
      {pending ? "Recording..." : "Agree and sign"}
    </button>
  );
}

/**
 * Typed acceptance of the client agreement.
 *
 * Receives only the four fields it needs, never the whole client record, so no
 * fees or contract terms cross into the client bundle. The server action is the
 * thing that actually records acceptance; if that write fails the client is told
 * to try again rather than shown a false confirmation.
 */
export function AcceptForm({
  slug,
  docSlug,
  businessName,
  contactName,
}: {
  slug: string;
  docSlug: string;
  businessName: string;
  contactName: string;
}) {
  const [state, formAction] = useFormState(acceptAgreement, initialState);

  if (state.ok) {
    return (
      <div className="mt-6 break-inside-avoid rounded-xl border border-accent/40 bg-accent-soft/60 px-5 py-4 print:bg-transparent">
        <p className="font-display text-base font-semibold text-ink">Agreement accepted.</p>
        <p className="mt-1 text-[0.94rem] leading-relaxed text-stone-600">
          Thank you. We have recorded your acceptance and kept a timestamped copy. You will
          get a confirmation by email, and we will be in touch to get started. Save this
          page as a PDF if you would like your own copy.
        </p>
      </div>
    );
  }

  return (
    <form action={formAction} className="mt-6 print:hidden">
      <input type="hidden" name="slug" value={slug} />
      <input type="hidden" name="docSlug" value={docSlug} />

      <div className="max-w-sm">
        <label htmlFor="fullName" className="block text-sm font-medium text-ink">
          Your full name
        </label>
        <input
          id="fullName"
          name="fullName"
          type="text"
          required
          autoComplete="name"
          defaultValue=""
          placeholder={contactName}
          aria-describedby={state.error ? "accept-error" : undefined}
          aria-invalid={state.error ? true : undefined}
          className="mt-2 w-full rounded-xl border border-stone-300 bg-white px-3.5 py-3 text-base text-ink outline-none transition placeholder:text-stone-400 focus:border-accent focus:ring-2 focus:ring-accent/30"
        />
      </div>

      <label className="mt-4 flex max-w-xl cursor-pointer items-start gap-3 text-[0.92rem] leading-relaxed text-stone-600">
        <input
          type="checkbox"
          name="confirmed"
          required
          className="mt-1 h-4 w-4 shrink-0 rounded border-stone-400 text-accent focus:ring-2 focus:ring-accent/40"
        />
        <span>
          I have authority to enter this agreement on behalf of {businessName}, and I accept
          these terms.
        </span>
      </label>

      {state.error && (
        <p role="alert" id="accept-error" className="mt-3 max-w-xl text-sm text-red-600">
          {state.error}
        </p>
      )}

      <SubmitButton />
    </form>
  );
}

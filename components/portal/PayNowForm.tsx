"use client";

import { useFormState, useFormStatus } from "react-dom";
import { startPayment, type ActionState } from "@/app/portal/[client]/actions";

const initialState: ActionState = {};

function PayButton({ label }: { label: string }) {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="inline-flex w-full items-center justify-center rounded-full bg-ink px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-ink-700 disabled:opacity-60 sm:w-auto"
    >
      {pending ? "Opening payment page..." : label}
    </button>
  );
}

/**
 * "Pay online". Receives only the slug and the document slug: the amount is
 * worked out on the server from the invoice, never sent from here.
 */
export function PayNowForm({
  slug,
  docSlug,
  label = "Pay online",
}: {
  slug: string;
  docSlug: string;
  label?: string;
}) {
  const [state, formAction] = useFormState(startPayment, initialState);
  return (
    <form action={formAction} className="print:hidden">
      <input type="hidden" name="slug" value={slug} />
      <input type="hidden" name="docSlug" value={docSlug} />
      <PayButton label={label} />
      {state.error && (
        <p role="alert" className="mt-2 text-sm text-red-600">
          {state.error}
        </p>
      )}
    </form>
  );
}

"use client";

import { useFormState, useFormStatus } from "react-dom";
import { startPayment, type ActionState } from "@/app/portal/[client]/actions";
import { night } from "@/components/portal/night";

const initialState: ActionState = {};

type Tone = "paper" | "night";

function PayButton({ label, tone }: { label: string; tone: Tone }) {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className={
        tone === "night"
          ? night.btnPrimary
          : "inline-flex w-full items-center justify-center rounded-full bg-ink px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-ink-700 disabled:opacity-60 sm:w-auto"
      }
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
  tone = "paper",
}: {
  slug: string;
  docSlug: string;
  label?: string;
  /** "paper" inside a document (the invoice), "night" on the dark dashboard. */
  tone?: Tone;
}) {
  const [state, formAction] = useFormState(startPayment, initialState);
  return (
    <form action={formAction} className="print:hidden">
      <input type="hidden" name="slug" value={slug} />
      <input type="hidden" name="docSlug" value={docSlug} />
      <PayButton label={label} tone={tone} />
      {state.error && (
        <p role="alert" className={`mt-2 text-sm ${tone === "night" ? "text-signal-orange" : "text-red-600"}`}>
          {state.error}
        </p>
      )}
    </form>
  );
}

"use client";

import { useFormState, useFormStatus } from "react-dom";
import { unlockPortal, type ActionState } from "@/app/portal/[client]/actions";

const initialState: ActionState = {};

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <button type="submit" disabled={pending} className="btn-primary mt-5 w-full disabled:opacity-60">
      {pending ? "Checking..." : "Open my documents"}
    </button>
  );
}

/**
 * Passcode entry. Takes only the slug and the redirect target as props -- no
 * client record crosses the server/client boundary, so nothing about the
 * business is in the JavaScript served to someone who has not unlocked yet.
 */
export function UnlockForm({ slug, next }: { slug: string; next: string | null }) {
  const [state, formAction] = useFormState(unlockPortal, initialState);

  return (
    <form action={formAction} className="mt-6">
      <input type="hidden" name="slug" value={slug} />
      {next && <input type="hidden" name="next" value={next} />}

      <label htmlFor="passcode" className="block text-sm font-medium text-ink">
        Passcode
      </label>
      <input
        id="passcode"
        name="passcode"
        type="text"
        required
        autoFocus
        autoComplete="off"
        autoCapitalize="characters"
        spellCheck={false}
        placeholder="XXXXX-XXXXX"
        aria-describedby={state.error ? "passcode-error" : undefined}
        aria-invalid={state.error ? true : undefined}
        className={`mt-2 w-full rounded-xl border bg-white px-3.5 py-3 font-mono text-base tracking-[0.12em] text-ink outline-none transition placeholder:font-sans placeholder:tracking-normal placeholder:text-stone-400 focus:ring-2 ${
          state.error
            ? "border-red-500 focus:border-red-500 focus:ring-red-500/30"
            : "border-stone-300 focus:border-accent focus:ring-accent/30"
        }`}
      />

      {state.error && (
        <p id="passcode-error" role="alert" className="mt-2 text-sm text-red-600">
          {state.error}
        </p>
      )}

      <SubmitButton />
    </form>
  );
}

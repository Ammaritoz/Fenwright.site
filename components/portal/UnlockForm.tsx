"use client";

import { useState } from "react";
import { useFormState, useFormStatus } from "react-dom";
import { unlockPortal, type ActionState } from "@/app/portal/[client]/actions";

const initialState: ActionState = {};

/** Show the code as XXXXX-XXXXX while it is typed or pasted, so nobody types the dash. */
function formatPasscode(raw: string): string {
  const core = raw.replace(/[^A-Za-z0-9]/g, "").toUpperCase().slice(0, 10);
  return core.length > 5 ? `${core.slice(0, 5)}-${core.slice(5)}` : core;
}

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
  const [passcode, setPasscode] = useState("");

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
        value={passcode}
        onChange={(e) => setPasscode(formatPasscode(e.target.value))}
        maxLength={11}
        inputMode="text"
        placeholder="XXXXX-XXXXX"
        aria-describedby={state.error ? "passcode-error" : undefined}
        aria-invalid={state.error ? true : undefined}
        className={`mt-2 w-full rounded-xl border bg-white px-3.5 py-3 font-mono text-base tracking-[0.12em] text-ink outline-none transition-colors placeholder:font-sans placeholder:tracking-normal placeholder:text-stone-400 focus:ring-2 ${
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

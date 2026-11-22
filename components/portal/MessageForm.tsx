"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useFormState, useFormStatus } from "react-dom";
import { postMessage, type ActionState } from "@/app/portal/[client]/actions";
import { night } from "@/components/portal/night";

const initial: ActionState = {};

function Send({ recheck }: { recheck: boolean }) {
  const { pending } = useFormStatus();
  return (
    <button type="submit" disabled={pending} className={night.btnPrimary}>
      {pending ? "Sending..." : recheck ? "Ask for a recheck" : "Send"}
    </button>
  );
}

/**
 * Write on a finding or report thread. Sends only the slug, the topic and the
 * words; the server checks the topic belongs to this client. On success the
 * page refreshes from the server, so the message shows because it was saved.
 */
export function MessageForm({
  slug,
  topic,
  reasons,
  allowRecheck,
  hint,
  max,
}: {
  slug: string;
  topic: string;
  reasons: readonly string[];
  allowRecheck: boolean;
  hint: string;
  max: number;
}) {
  const [state, action] = useFormState(postMessage, initial);
  const [recheck, setRecheck] = useState(false);
  const [length, setLength] = useState(0);
  const form = useRef<HTMLFormElement>(null);
  const router = useRouter();
  const id = `msg-${topic.replace(/[^A-Za-z0-9-]/g, "-")}`;

  useEffect(() => {
    if (!state.ok) return;
    form.current?.reset();
    setRecheck(false);
    setLength(0);
    router.refresh();
  }, [state, router]);

  return (
    <form ref={form} action={action} className="space-y-3" noValidate>
      <input type="hidden" name="slug" value={slug} />
      <input type="hidden" name="topic" value={topic} />
      <label htmlFor={id} className="sr-only">
        Message
      </label>
      <textarea
        id={id}
        name="body"
        rows={3}
        maxLength={max}
        onChange={(e) => setLength(e.target.value.length)}
        aria-describedby={`${id}-hint`}
        placeholder={recheck ? "What should we look at again? A version, a build flag or what you saw helps." : "Ask a question or add context."}
        className="w-full resize-y rounded-lg border border-night-edge bg-night-raised px-3.5 py-3 text-[0.88rem] text-night-text outline-none placeholder:text-night-faint focus:border-signal-mint focus:ring-2 focus:ring-signal-mint/25"
      />
      {allowRecheck && (
        <div className="space-y-2">
          <label className="flex cursor-pointer items-center gap-2.5 text-[0.84rem] text-night-text">
            <input
              type="checkbox"
              name="wantsRecheck"
              checked={recheck}
              onChange={(e) => setRecheck(e.target.checked)}
              className="h-4 w-4 accent-[#6FD6A8]"
            />
            Ask us to recheck this decision
          </label>
          {recheck && (
            <div>
              <label htmlFor={`${id}-reason`} className="sr-only">
                Reason for the recheck
              </label>
              <select
                id={`${id}-reason`}
                name="recheck"
                defaultValue=""
                className="w-full rounded-lg border border-night-edge bg-night-raised px-3 py-2.5 text-[0.86rem] text-night-text outline-none focus:border-signal-mint sm:w-auto"
              >
                <option value="" disabled>
                  Why?
                </option>
                {reasons.map((r) => (
                  <option key={r} value={r}>
                    {r}
                  </option>
                ))}
              </select>
            </div>
          )}
        </div>
      )}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p id={`${id}-hint`} className="text-[0.76rem] text-night-mute">
          {hint}
          {length > max * 0.8 && <span className="ml-2 font-mono">{length}/{max}</span>}
        </p>
        <Send recheck={recheck} />
      </div>
      {state.error && (
        <p role="alert" className="text-sm text-signal-orange">
          {state.error}
        </p>
      )}
    </form>
  );
}

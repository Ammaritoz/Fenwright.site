"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useFormState, useFormStatus } from "react-dom";
import { markItemDone, type ActionState } from "@/app/portal/[client]/actions";
import { night } from "@/components/portal/night";

const initialState: ActionState = {};

function DoneButton() {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className={night.btn}
    >
      {pending ? "Saving..." : "Mark as done"}
    </button>
  );
}

/**
 * Clears a report draft or an engineer question from "Needs your attention".
 *
 * Receives only the slug and the item id. The server checks that id against the
 * items actually open for this client before it records anything. On success
 * the page refreshes from the server, so the item disappears because it is
 * recorded as done, not because the browser hid it.
 */
export function MarkDoneForm({ slug, itemId }: { slug: string; itemId: string }) {
  const [state, formAction] = useFormState(markItemDone, initialState);
  const router = useRouter();

  useEffect(() => {
    if (state.ok) router.refresh();
  }, [state.ok, router]);

  return (
    <form action={formAction} className="shrink-0">
      <input type="hidden" name="slug" value={slug} />
      <input type="hidden" name="itemId" value={itemId} />
      <DoneButton />
      {state.error && (
        <p role="alert" className="mt-1.5 max-w-[16rem] text-xs text-signal-orange">
          {state.error}
        </p>
      )}
    </form>
  );
}

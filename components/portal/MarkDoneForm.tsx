"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useFormState, useFormStatus } from "react-dom";
import { markItemDone, type ActionState } from "@/app/portal/[client]/actions";

const initialState: ActionState = {};

function DoneButton() {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="inline-flex h-9 items-center justify-center whitespace-nowrap rounded-full border border-stone-300 bg-white px-4 text-sm font-semibold text-ink transition-colors hover:border-accent hover:text-accent-700 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent disabled:opacity-60"
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
        <p role="alert" className="mt-1.5 max-w-[16rem] text-xs text-red-600">
          {state.error}
        </p>
      )}
    </form>
  );
}

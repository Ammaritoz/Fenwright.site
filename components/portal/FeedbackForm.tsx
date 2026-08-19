"use client";

import { useFormState, useFormStatus } from "react-dom";
import { submitFeedback, type ActionState } from "@/app/portal/[client]/actions";

const initialState: ActionState = {};
const SCORES = [1, 2, 3, 4, 5];

type Rating = { id: string; label: string };
type Question = { id: string; label: string };

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <button type="submit" disabled={pending} className="btn-primary mt-7 disabled:opacity-60">
      {pending ? "Sending..." : "Send feedback"}
    </button>
  );
}

/**
 * Ratings and free text.
 *
 * The scores and answers are serialised into two hidden fields on submit rather
 * than sent as a dozen separate ones, so the server action and the Airtable
 * columns do not need changing every time a question is added to
 * config/documents.ts.
 */
export function FeedbackForm({
  slug,
  docSlug,
  alreadySubmitted,
  ratings,
  questions,
  testimonialLabel,
}: {
  slug: string;
  docSlug: string;
  alreadySubmitted: boolean;
  ratings: readonly Rating[];
  questions: readonly Question[];
  testimonialLabel: string;
}) {
  const [state, formAction] = useFormState(submitFeedback, initialState);

  if (alreadySubmitted || state.ok) {
    return (
      <div className="break-inside-avoid rounded-xl border border-accent/40 bg-accent-soft/60 px-5 py-4 print:bg-transparent">
        <p className="font-display text-base font-semibold text-ink">Thank you.</p>
        <p className="mt-1 text-[0.94rem] leading-relaxed text-stone-600">
          We have your feedback and we read every word of it. If you raised something that
          needs a reply, expect one from us shortly.
        </p>
      </div>
    );
  }

  /** Collect the per-question inputs into the two fields the action expects. */
  function serialise(form: HTMLFormElement) {
    const data = new FormData(form);
    const ratingLines = ratings
      .map((r) => {
        const v = data.get(`rating_${r.id}`);
        return v ? `${r.label}: ${String(v)}/5` : null;
      })
      .filter(Boolean)
      .join("\n");
    const answerBlocks = questions
      .map((q) => {
        const v = String(data.get(`question_${q.id}`) ?? "").trim();
        return v ? `${q.label}\n${v}` : null;
      })
      .filter(Boolean)
      .join("\n\n");

    (form.elements.namedItem("ratings") as HTMLInputElement).value = ratingLines;
    (form.elements.namedItem("answers") as HTMLInputElement).value = answerBlocks;
  }

  return (
    <form
      action={formAction}
      onSubmit={(e) => serialise(e.currentTarget)}
      className="print:hidden"
    >
      <input type="hidden" name="slug" value={slug} />
      <input type="hidden" name="docSlug" value={docSlug} />
      <input type="hidden" name="ratings" defaultValue="" />
      <input type="hidden" name="answers" defaultValue="" />

      <fieldset>
        <legend className="text-[0.65rem] uppercase tracking-[0.14em] text-stone-400">
          Overall ratings
        </legend>
        <div className="mt-4 space-y-4">
          {ratings.map((r) => (
            <div
              key={r.id}
              className="flex flex-wrap items-center justify-between gap-3 border-b border-stone-200 pb-4 last:border-0"
            >
              <span className="text-[0.94rem] text-stone-600">{r.label}</span>
              <div className="flex gap-1.5">
                {SCORES.map((score) => (
                  <label
                    key={score}
                    className="group cursor-pointer"
                    title={`${score} out of 5`}
                  >
                    <input
                      type="radio"
                      name={`rating_${r.id}`}
                      value={score}
                      className="peer sr-only"
                    />
                    <span className="flex h-9 w-9 items-center justify-center rounded-lg border border-stone-300 text-sm text-stone-500 transition peer-checked:border-accent peer-checked:bg-accent peer-checked:text-white peer-focus-visible:ring-2 peer-focus-visible:ring-accent/40 group-hover:border-stone-400">
                      {score}
                    </span>
                  </label>
                ))}
              </div>
            </div>
          ))}
        </div>
      </fieldset>

      <fieldset className="mt-8">
        <legend className="text-[0.65rem] uppercase tracking-[0.14em] text-stone-400">
          In your own words
        </legend>
        <div className="mt-4 space-y-5">
          {questions.map((q) => (
            <div key={q.id}>
              <label
                htmlFor={`question_${q.id}`}
                className="block text-[0.94rem] font-medium text-ink"
              >
                {q.label}
              </label>
              <textarea
                id={`question_${q.id}`}
                name={`question_${q.id}`}
                rows={3}
                className="mt-2 w-full rounded-xl border border-stone-300 bg-white px-3.5 py-3 text-[0.94rem] text-ink outline-none transition focus:border-accent focus:ring-2 focus:ring-accent/30"
              />
            </div>
          ))}
        </div>
      </fieldset>

      <fieldset className="mt-8">
        <legend className="text-[0.65rem] uppercase tracking-[0.14em] text-stone-400">
          Happy to be quoted?
        </legend>
        <label htmlFor="testimonial" className="mt-4 block text-[0.94rem] text-stone-600">
          {testimonialLabel}
        </label>
        <textarea
          id="testimonial"
          name="testimonial"
          rows={3}
          className="mt-2 w-full rounded-xl border border-stone-300 bg-white px-3.5 py-3 text-[0.94rem] text-ink outline-none transition focus:border-accent focus:ring-2 focus:ring-accent/30"
        />
        <div className="mt-4 max-w-sm">
          <label htmlFor="name" className="block text-sm font-medium text-ink">
            Your name and role
          </label>
          <input
            id="name"
            name="name"
            type="text"
            autoComplete="name"
            className="mt-2 w-full rounded-xl border border-stone-300 bg-white px-3.5 py-3 text-base text-ink outline-none transition focus:border-accent focus:ring-2 focus:ring-accent/30"
          />
        </div>
        <p className="mt-3 text-xs leading-relaxed text-stone-500">
          We will only quote you publicly if you fill this in, and we will always show you
          the wording first.
        </p>
      </fieldset>

      {state.error && (
        <p role="alert" className="mt-4 text-sm text-red-600">
          {state.error}
        </p>
      )}

      <SubmitButton />
    </form>
  );
}

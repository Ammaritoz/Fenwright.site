"use client";

import { useState } from "react";
import { useFormState, useFormStatus } from "react-dom";
import { openBillingPortal, startSubscription, type ActionState } from "@/app/portal/[client]/actions";
import { night } from "@/components/portal/night";

/**
 * The client's two billing controls. Each sends only the slug (and the chosen
 * interval): the price is worked out on the server from the plan.
 */

const initial: ActionState = {};

export type IntervalOption = { value: string; label: string; price: string; per: string };

function Submit({ label, busy, primary }: { label: string; busy: string; primary?: boolean }) {
  const { pending } = useFormStatus();
  return (
    <button type="submit" disabled={pending} className={`${primary ? night.btnPrimary : night.btn} w-full`}>
      {pending ? busy : label}
    </button>
  );
}

export function SubscribeForm({ slug, options, initialValue }: { slug: string; options: IntervalOption[]; initialValue: string }) {
  const [state, action] = useFormState(startSubscription, initial);
  const [value, setValue] = useState(initialValue);
  return (
    <form action={action} className="flex flex-col gap-3">
      <input type="hidden" name="slug" value={slug} />
      <fieldset>
        <legend className="sr-only">How often to be billed</legend>
        <div className="grid grid-cols-2 gap-2">
          {options.map((o) => (
            <label
              key={o.value}
              className={`cursor-pointer rounded-lg border px-3 py-2.5 transition-colors ${
                value === o.value ? "border-signal-mint/60 bg-signal-mint/[0.07]" : "border-night-line hover:border-night-edge"
              }`}
            >
              <input
                type="radio"
                name="interval"
                value={o.value}
                checked={value === o.value}
                onChange={() => setValue(o.value)}
                className="sr-only"
              />
              <span className="block text-[0.8rem] text-night-dim">{o.label}</span>
              <span className="mt-0.5 block font-mono text-[0.95rem] text-night-text">
                {o.price}
                <span className="text-[0.72rem] text-night-mute"> /{o.per}</span>
              </span>
            </label>
          ))}
        </div>
      </fieldset>
      <Submit label="Set up automatic payment" busy="Opening payment page..." primary />
      {state.error && (
        <p role="alert" className="text-sm text-signal-orange">
          {state.error}
        </p>
      )}
    </form>
  );
}

export function ManageBillingForm({ slug }: { slug: string }) {
  const [state, action] = useFormState(openBillingPortal, initial);
  return (
    <form action={action}>
      <input type="hidden" name="slug" value={slug} />
      <Submit label="Change payment method" busy="Opening..." />
      {state.error && (
        <p role="alert" className="mt-2 text-sm text-signal-orange">
          {state.error}
        </p>
      )}
    </form>
  );
}

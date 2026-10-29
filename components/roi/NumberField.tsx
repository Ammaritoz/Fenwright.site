"use client";

import { useEffect, useId, useState } from "react";
import type { Limit } from "@/config/roi";
import { clamp, parseNumber } from "@/lib/roi";

type Props = {
  label: string;
  hint?: string;
  value: number | null;
  onChange: (value: number | null) => void;
  limit: Limit;
  prefix?: string;
  suffix?: string;
};

/**
 * A number someone types while talking. A text input rather than type=number:
 * number inputs change value on a stray scroll wheel, reject "8,000", and
 * report "" for half-typed values, all of which bite on a live call.
 *
 * Keeps its own draft text so "12." survives a keystroke, and only tidies it
 * on blur.
 */
export function NumberField({ label, hint, value, onChange, limit, prefix, suffix }: Props) {
  const id = useId();
  const [draft, setDraft] = useState(value === null ? "" : String(value));

  // Follow outside changes (another field resetting this one) without
  // clobbering what is being typed when the parsed value already matches.
  useEffect(() => {
    setDraft((d) => (parseNumber(d) === value ? d : value === null ? "" : String(value)));
  }, [value]);

  return (
    <div>
      <label htmlFor={id} className="block text-sm font-semibold text-ink">
        {label}
      </label>
      <div className="mt-2 flex items-center rounded-xl border border-stone-300 bg-white transition focus-within:border-accent-600 focus-within:ring-2 focus-within:ring-accent/40">
        {prefix && <span className="pl-4 text-sm font-medium text-stone-500">{prefix}</span>}
        <input
          id={id}
          type="text"
          inputMode="decimal"
          autoComplete="off"
          value={draft}
          aria-describedby={hint ? `${id}-hint` : undefined}
          onChange={(e) => {
            setDraft(e.target.value);
            const n = parseNumber(e.target.value);
            if (n !== undefined) onChange(n === null ? null : clamp(n, limit));
          }}
          onBlur={() => setDraft(value === null ? "" : String(value))}
          className={`w-full min-w-0 rounded-xl bg-transparent py-3 text-base tabular-nums text-ink outline-none ${
            prefix ? "pl-1.5" : "pl-4"
          } ${suffix ? "pr-1.5" : "pr-4"}`}
        />
        {suffix && <span className="pr-4 text-sm font-medium text-stone-500">{suffix}</span>}
      </div>
      {hint && (
        <p id={`${id}-hint`} className="mt-1.5 text-xs leading-relaxed text-stone-500">
          {hint}
        </p>
      )}
    </div>
  );
}

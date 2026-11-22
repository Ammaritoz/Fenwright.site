"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useEffect, useRef } from "react";

/**
 * The dashboard heading doubles as the month picker: "November 2026 ▾" opens
 * the months on offer (only months the client was monitored in, at most 12).
 * Plain links to ?month=YYYY-MM, so it works without JavaScript and a chosen
 * month can be bookmarked; the script only closes the menu after a choice.
 *
 * Receives month labels and the slug only, no client data.
 */
export function MonthPicker({
  slug,
  options,
  selected,
}: {
  slug: string;
  /** Newest first: [period, label], the first being the current month. */
  options: [string, string][];
  selected: string;
}) {
  const ref = useRef<HTMLDetailsElement>(null);
  const params = useSearchParams();
  useEffect(() => {
    if (ref.current) ref.current.open = false;
  }, [params]);

  const label = options.find(([p]) => p === selected)?.[1] ?? options[0][1];
  const heading = "font-ui text-[2.1rem] font-light leading-none tracking-[-0.025em] text-night-text";
  if (options.length < 2) return <h1 className={heading}>{label}</h1>;

  return (
    <details ref={ref} className="group relative">
      <summary
        className="flex cursor-pointer list-none items-center gap-2.5 rounded-lg [&::-webkit-details-marker]:hidden"
        aria-label={`${label}. Choose another month`}
      >
        <h1 className={heading}>{label}</h1>
        <span className="flex h-7 w-7 items-center justify-center rounded-md border border-night-edge bg-night-raised text-night-dim transition-colors group-hover:text-night-text">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" aria-hidden="true" className="transition-transform group-open:rotate-180">
            <path d="M6 9l6 6 6-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </span>
      </summary>
      <ul className="absolute left-0 top-full z-30 mt-2 w-56 rounded-xl border border-night-line bg-night-panel p-1.5 shadow-[0_24px_48px_-24px_rgba(0,0,0,0.8)]">
        {options.map(([period, text], i) => {
          const active = period === selected;
          return (
            <li key={period}>
              <Link
                href={i === 0 ? `/portal/${slug}` : `/portal/${slug}?month=${period}`}
                scroll={false}
                aria-current={active ? "page" : undefined}
                className={`flex h-9 items-center justify-between rounded-lg px-2.5 text-[0.85rem] transition-colors ${
                  active ? "bg-night-raised text-night-text" : "text-night-dim hover:bg-night-raised/60 hover:text-night-text"
                }`}
              >
                {text}
                {i === 0 && <span className="font-mono text-[0.7rem] text-night-mute">now</span>}
              </Link>
            </li>
          );
        })}
      </ul>
    </details>
  );
}

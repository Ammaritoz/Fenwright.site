import type { CSSProperties } from "react";
import { site } from "@/config/site";

/**
 * The hero's "example week": a ledger sheet of ordinary leaks, each struck
 * through in fen green as the fix is written in beside it. Pure CSS motion, so
 * it plays without JS and lands on its final state under reduced motion.
 */
export function WeekLedger() {
  const l = site.hero.ledger;
  return (
    <figure className="relative mx-auto w-full max-w-[30rem] lg:mx-0 lg:ml-auto">
      <div className="rounded-[4px] border border-stone-200 bg-[#FBFAF7] shadow-lift">
        <figcaption className="flex items-baseline justify-between border-b border-stone-200 px-6 py-4 sm:px-7">
          <span className="font-display text-[1.05rem] font-semibold text-ink">{l.label}</span>
          <span className="text-xs font-medium uppercase tracking-[0.12em] text-stone-500">
            {l.range}
          </span>
        </figcaption>

        <ol className="divide-y divide-stone-200/80">
          {l.entries.map((e, i) => {
            const strikeAt = 700 + i * 260;
            return (
              <li
                key={e.day}
                className="grid grid-cols-[3.25rem_1fr] gap-x-4 px-6 py-4 sm:grid-cols-[3.75rem_1fr] sm:px-7"
              >
                <div className="pt-0.5">
                  <p className="font-display text-[0.95rem] font-semibold leading-none text-ink">{e.day}</p>
                  <p className="mt-1.5 text-[0.7rem] font-medium tabular-nums text-stone-500">{e.time}</p>
                </div>
                <div className="border-l border-accent/25 pl-4">
                  <p className="text-[0.95rem] leading-snug">
                    <span
                      className="ledger-strike"
                      style={{ "--strike-delay": `${strikeAt}ms` } as CSSProperties}
                    >
                      {e.leak}
                    </span>
                  </p>
                  <p
                    className="mt-1.5 flex animate-ink-in items-center gap-1.5 font-display text-[0.95rem] italic text-accent"
                    style={{ animationDelay: `${strikeAt + 420}ms` }}
                  >
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" aria-hidden="true" className="shrink-0">
                      <path d="M5 4v7a4 4 0 0 0 4 4h10m-4-4 4 4-4 4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                    {e.fix}
                  </p>
                </div>
              </li>
            );
          })}
        </ol>

        <p className="border-t border-stone-200 px-6 py-4 text-sm leading-relaxed text-stone-600 [text-wrap:balance] sm:px-7">
          {l.footnote}
        </p>
      </div>
    </figure>
  );
}

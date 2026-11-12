import type { CSSProperties } from "react";
import { site } from "@/config/site";
import { Reveal } from "@/components/Reveal";
import { Arrow } from "@/components/Arrow";

/**
 * "An example week": five ordinary leaks, each struck through as the fix is
 * written in beside it. Illustrative, not a client, and the heading says so.
 * Pure CSS motion, so it lands on its final state under reduced motion.
 */
export function WeekLedger() {
  const l = site.hero.ledger;
  return (
    <section className="bg-paper py-24 text-ink sm:py-36">
      <div className="container-px grid gap-12 lg:grid-cols-[0.8fr_1.2fr] lg:gap-20">
        <Reveal>
          <p className="kicker text-accent">{l.label}</p>
          <h2 className="h-card mt-6 max-w-md">{l.footnote}</h2>
        </Reveal>

        <Reveal delay={100}>
          <div className="hidden grid-cols-[6rem_1fr_1fr] gap-x-8 pb-4 text-stone-500 sm:grid" aria-hidden="true">
            <span className="kicker">{l.range}</span>
            <span className="kicker">{l.columns.before}</span>
            <span className="kicker">{l.columns.after}</span>
          </div>
          <ol>
            {l.entries.map((e, i) => {
              const strikeAt = 500 + i * 240;
              return (
                <li
                  key={e.day}
                  className="grid gap-x-8 gap-y-2 border-t border-stone-200 py-5 sm:grid-cols-[6rem_1fr_1fr] sm:py-6"
                >
                  <p className="flex items-baseline gap-3 sm:block">
                    <span className="font-display text-xl">{e.day}</span>
                    <span className="text-sm tabular-nums text-stone-500 sm:mt-1 sm:block">{e.time}</span>
                  </p>
                  <p className="leading-snug">
                    <span className="sr-only">{l.columns.before}: </span>
                    <span className="ledger-strike" style={{ "--strike-delay": `${strikeAt}ms` } as CSSProperties}>
                      {e.leak}
                    </span>
                  </p>
                  <p
                    className="flex animate-ink-in items-start gap-2 font-medium leading-snug"
                    style={{ animationDelay: `${strikeAt + 380}ms` }}
                  >
                    <Arrow className="mt-0.5 text-accent" />
                    <span>
                      <span className="sr-only">{l.columns.after}: </span>
                      {e.fix}
                    </span>
                  </p>
                </li>
              );
            })}
          </ol>
        </Reveal>
      </div>
    </section>
  );
}

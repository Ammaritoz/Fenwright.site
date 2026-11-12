"use client";

import { useCallback, useEffect, useLayoutEffect, useRef, useState, type CSSProperties } from "react";
import { Roll } from "@/components/Roll";

export type DeckCard =
  | { kind: "text"; title: string; body: string }
  | { kind: "photo"; image: string; caption: string };

type Props = {
  cards: DeckCard[];
  /** the surface the deck sits on */
  tone?: "dark" | "light";
  /** names the deck for screen readers, e.g. "How the leads work" */
  label: string;
};

const GAP = 12;

/**
 * A deck of cards after Optiver's "Performance quantified" carousel. The active
 * card sits in the centre at full height (a 4:5 portrait slot) and shows its
 * description; the cards either side drop to two thirds of that height,
 * bottom-aligned, so the active one stands up out of the row. Arrows, a click
 * on a side card, a swipe, or the arrow keys move it along.
 *
 * The heights animate on grid-template-rows, sized off the card's own width
 * with container query units, so nothing is measured per card in JS. Only the
 * card width and the row's offset are computed, from the screen width.
 */
export function Deck({ cards, tone = "dark", label }: Props) {
  const column = useRef<HTMLDivElement | null>(null);
  const [vw, setVw] = useState(0);
  const [active, setActive] = useState(0);
  const touchX = useRef<number | null>(null);

  useLayoutEffect(() => {
    const el = column.current;
    if (!el) return;
    const measure = () => {
      setVw(document.documentElement.clientWidth);
    };
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  // From a frame-by-frame recording of Optiver: three slots in a centred block
  // (about 1340px wide at a 1920px screen, the full width on smaller ones),
  // the active card always in the middle slot. Two slots on tablets; on
  // phones each card is 80% of the screen so the next one peeks in.
  const perView = vw >= 768 ? 3 : vw >= 640 ? 2 : 1.25;
  const edge = vw >= 768 ? 12 : 0;
  const block = Math.min(vw - edge * 2, 1344);
  const cardW = vw ? (block - GAP * (Math.ceil(perView) - 1)) / perView : 0;
  const offset = vw / 2 - (active * (cardW + GAP) + cardW / 2);

  const go = useCallback(
    (i: number) => setActive(Math.max(0, Math.min(cards.length - 1, i))),
    [cards.length]
  );

  useEffect(() => {
    if (active > cards.length - 1) setActive(cards.length - 1);
  }, [active, cards.length]);

  const dark = tone === "dark";
  // Neighbouring cards alternate between two shades, as Optiver's do.
  const textCard = dark ? "bg-ink-700 text-white" : "bg-white text-ink";
  const textCardAlt = dark ? "bg-[#2B4A72] text-white" : "bg-[#DCE4EE] text-ink";
  const bodyText = dark ? "text-white/75" : "text-stone-600";

  return (
    <div
      role="region"
      aria-roledescription="carousel"
      aria-label={label}
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === "ArrowRight") go(active + 1);
        if (e.key === "ArrowLeft") go(active - 1);
      }}
      className="rounded-2xl focus-visible:outline-offset-8"
    >
      <div ref={column} aria-hidden="true" />

      {/* Full-bleed strip so side cards run to the screen edge, clipped there. */}
      <div
        className="relative overflow-hidden"
        // Page width without the scrollbar; 100vw would include it and make
        // the whole page scroll sideways.
        style={{ marginInline: vw ? `calc(50% - ${vw / 2}px)` : 0 }}
        onTouchStart={(e) => (touchX.current = e.touches[0].clientX)}
        onTouchEnd={(e) => {
          if (touchX.current === null) return;
          const dx = e.changedTouches[0].clientX - touchX.current;
          if (Math.abs(dx) > 40) go(active + (dx < 0 ? 1 : -1));
          touchX.current = null;
        }}
      >
        <ul
          className="flex items-end transition-transform duration-1000 ease-[cubic-bezier(0.16,1,0.3,1)] motion-reduce:transition-none"
          style={{ gap: GAP, transform: `translate3d(${offset}px,0,0)`, visibility: cardW ? "visible" : "hidden" }}
        >
          {cards.map((c, i) => {
            const on = i === active;
            const dist = Math.abs(i - active);
            // Height by distance from the active card: full, two thirds, then
            // flat. Cards beyond the neighbours sink to nothing, so a card
            // rises out of the floor as it slides in and sinks back as it
            // leaves, which is what makes the row roll like a wheel.
            const rows =
              dist === 0
                ? "0px calc(100cqw * 5 / 4)"
                : dist === 1
                  ? "calc(100cqw * 5 / 4 - 100cqw * 2 / 3) calc(100cqw * 2 / 3)"
                  : "calc(100cqw * 5 / 4) 0px";
            return (
              <li
                key={i}
                className="shrink-0 [container-type:inline-size]"
                style={{ width: cardW }}
                aria-roledescription="slide"
                aria-label={`${i + 1} of ${cards.length}`}
                aria-current={on ? "true" : undefined}
              >
                <div
                  className="grid aspect-[4/5] transition-[grid-template-rows] duration-500 ease-out motion-reduce:transition-none"
                  style={{ gridTemplateRows: rows } as CSSProperties}
                >
                  <div className="min-h-0" />
                  <button
                    type="button"
                    tabIndex={dist === 1 ? 0 : -1}
                    aria-hidden={dist > 1 ? true : undefined}
                    onClick={() => go(i)}
                    aria-label={on ? undefined : `Show card ${i + 1}`}
                    className={`relative min-h-0 overflow-hidden rounded-2xl text-left ${on ? "cursor-default" : "cursor-pointer"}`}
                  >
                    {/* A card sinking out of view (or rising into it) is a blank
                        slab: its content fades so text never rides the edge. */}
                    <div
                      className="h-full transition-opacity duration-300 ease-out motion-reduce:transition-none"
                      style={{ opacity: dist > 1 ? 0 : 1 }}
                    >
                    {c.kind === "text" ? (
                      <div className={`flex h-full flex-col items-center justify-center px-6 py-8 text-center sm:px-10 lg:px-16 lg:py-16 ${i % 2 ? textCardAlt : textCard}`}>
                        <h3 className="font-sans text-[1.6rem] font-normal leading-[1.15] tracking-normal sm:text-[1.875rem]">{c.title}</h3>
                        {/* Revealed only on the active card. */}
                        <div
                          className="grid w-full transition-[grid-template-rows,opacity] duration-500 ease-out motion-reduce:transition-none"
                          style={{ gridTemplateRows: on ? "1fr" : "0fr", opacity: on ? 1 : 0 }}
                        >
                          <p className={`min-h-0 overflow-hidden pt-6 text-[1.05rem] leading-[1.5] sm:text-[1.15rem] ${bodyText}`}>{c.body}</p>
                        </div>
                      </div>
                    ) : (
                      <figure className="h-full bg-ink">
                        <img src={c.image} alt="" loading="lazy" className="absolute inset-0 h-full w-full object-cover" />
                        <div className="absolute inset-0 bg-[#0C2F5E] opacity-40 mix-blend-color" aria-hidden="true" />
                        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-ink/90" aria-hidden="true" />
                        <figcaption className="absolute inset-x-0 bottom-0 px-6 pb-8 text-center font-sans text-[1.6rem] leading-[1.1] text-white sm:px-10 sm:pb-12 sm:text-[1.875rem]">
                          {c.caption}
                        </figcaption>
                      </figure>
                    )}
                    </div>
                  </button>
                </div>
              </li>
            );
          })}
        </ul>
      </div>

      <div className="mt-8 flex justify-center gap-3">
        <button
          type="button"
          onClick={() => go(active - 1)}
          disabled={active === 0}
          aria-label="Previous card"
          className="btn-primary h-14 w-14 !p-0 disabled:pointer-events-none disabled:opacity-30"
        >
          <Roll>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
              <path d="M19 12H5M11 6l-6 6 6 6" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </Roll>
        </button>
        <button
          type="button"
          onClick={() => go(active + 1)}
          disabled={active === cards.length - 1}
          aria-label="Next card"
          className="btn-primary h-14 w-14 !p-0 disabled:pointer-events-none disabled:opacity-30"
        >
          <Roll>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
              <path d="M5 12h14M13 6l6 6-6 6" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </Roll>
        </button>
      </div>
    </div>
  );
}

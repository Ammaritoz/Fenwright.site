import type { ReactNode } from "react";

/**
 * The results card. Same paper sheet as the hero's example week
 * (components/WeekLedger.tsx), so the calculator reads as part of the site
 * rather than a bolted-on widget.
 */
export function Sheet({ label, range, children }: { label: string; range?: string; children: ReactNode }) {
  return (
    <figure className="break-inside-avoid rounded-[4px] border border-stone-200 bg-[#FBFAF7] shadow-lift print:shadow-none">
      <figcaption className="flex items-baseline justify-between border-b border-stone-200 px-6 py-4 sm:px-7">
        <span className="font-display text-[1.05rem] font-semibold text-ink">{label}</span>
        {range && <span className="text-xs font-medium uppercase tracking-[0.12em] text-stone-500">{range}</span>}
      </figcaption>
      {children}
    </figure>
  );
}

/**
 * The big number at the top of the sheet. aria-live so a screen reader hears it change.
 * Figures here use lining-nums: Fraunces defaults to old-style numerals, which
 * bob above and below the line and make a column of euros look uneven.
 */
export function SheetHeadline({ before, figure, after, note }: { before?: string; figure: string; after: string; note?: string }) {
  return (
    <div className="px-6 py-6 sm:px-7" aria-live="polite">
      {before && <p className="text-sm font-medium text-stone-600">{before}</p>}
      <p className="font-display text-[2.75rem] font-bold leading-none tabular-nums lining-nums text-ink sm:text-[3.25rem]">{figure}</p>
      <p className="mt-2 text-[0.95rem] leading-snug text-stone-600">{after}</p>
      {note && <p className="mt-3 font-display text-[0.95rem] italic text-accent">{note}</p>}
    </div>
  );
}

export function SheetRows({ children }: { children: ReactNode }) {
  return <dl className="divide-y divide-stone-200/80 border-t border-stone-200">{children}</dl>;
}

export function SheetRow({
  label,
  value,
  tone = "plain",
}: {
  label: string;
  value: string;
  tone?: "plain" | "gain" | "loss" | "muted";
}) {
  const valueClass = {
    plain: "text-ink",
    gain: "text-accent-700",
    loss: "text-red-700",
    muted: "text-stone-500",
  }[tone];
  return (
    <div className="flex items-baseline justify-between gap-4 px-6 py-3.5 sm:px-7">
      <dt className="text-[0.92rem] leading-snug text-stone-600">{label}</dt>
      <dd className={`shrink-0 text-right font-display text-[1.05rem] font-semibold tabular-nums lining-nums ${valueClass}`}>{value}</dd>
    </div>
  );
}

export function SheetNote({ children }: { children: ReactNode }) {
  return (
    <p className="border-t border-stone-200 px-6 py-4 text-sm leading-relaxed text-stone-600 [text-wrap:pretty] sm:px-7">
      {children}
    </p>
  );
}

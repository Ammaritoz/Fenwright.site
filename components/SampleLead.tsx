import { roofing } from "@/config/roofing";

/**
 * A made-up lead, drawn like the email a roofer receives. Shares the hero
 * ledger's paper sheet so the two read as the same family. The "Example" tag
 * is part of the design, not a footnote: it must never pass for a real lead.
 */
export function SampleLead({ className = "" }: { className?: string }) {
  const s = roofing.sampleLead;
  return (
    <figure className={`relative mx-auto w-full max-w-[30rem] ${className}`}>
      <div className="rounded-[4px] border border-stone-200 bg-[#FBFAF7] shadow-lift">
        <figcaption className="flex items-center justify-between gap-4 border-b border-stone-200 px-6 py-4 sm:px-7">
          <span className="font-display text-[1.05rem] font-semibold text-ink">{s.title}</span>
          <span className="shrink-0 rounded-full border border-stone-300 px-2.5 py-1 text-[0.68rem] font-semibold uppercase tracking-[0.12em] text-stone-500">
            {s.tag}
          </span>
        </figcaption>

        <dl className="divide-y divide-stone-200/80 px-6 sm:px-7">
          {s.fields.map((f) => (
            <div key={f.label} className="grid grid-cols-[5.5rem_1fr] gap-x-4 py-2.5 text-[0.92rem]">
              <dt className="font-medium text-stone-500">{f.label}</dt>
              <dd className="leading-snug text-ink">{f.value}</dd>
            </div>
          ))}
        </dl>

        <div className="border-t border-stone-200 px-6 py-4 sm:px-7">
          <p className="text-[0.7rem] font-semibold uppercase tracking-[0.12em] text-stone-500">{s.checksLabel}</p>
          <ul className="mt-2.5 flex flex-wrap gap-x-4 gap-y-1.5">
            {s.checks.map((c) => (
              <li key={c} className="flex items-center gap-1.5 text-[0.85rem] text-accent">
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" aria-hidden="true" className="shrink-0">
                  <path d="M4 12.5l5 5L20 6.5" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
                {c}
              </li>
            ))}
          </ul>
        </div>

        <p className="flex items-baseline justify-between gap-4 border-t border-stone-200 bg-accent-soft/60 px-6 py-3.5 text-sm sm:px-7">
          <span className="font-medium text-accent-700">{s.footer}</span>
          <span className="shrink-0 text-xs tabular-nums text-stone-500">{s.sentAt}</span>
        </p>
      </div>
      <p className="mt-3 text-center text-xs text-stone-500">{s.disclaimer}</p>
    </figure>
  );
}

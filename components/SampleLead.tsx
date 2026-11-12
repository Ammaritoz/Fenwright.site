import { roofing } from "@/config/roofing";

type Props = {
  className?: string;
  /** the surface the card sits on, which sets the caption colour under it */
  tone?: "light" | "dark";
};

/**
 * A made-up lead, drawn like the email a roofer receives: a white record on
 * whatever surface it sits on. The "Example" tag is part of the design, not a
 * footnote: it must never pass for a real lead.
 */
export function SampleLead({ className = "", tone = "light" }: Props) {
  const s = roofing.sampleLead;
  return (
    <figure className={`relative mx-auto w-full max-w-[30rem] ${className}`}>
      <div className="overflow-hidden rounded-2xl border border-stone-200 bg-white text-ink shadow-lift">
        <figcaption className="flex items-center justify-between gap-4 border-b border-stone-200 px-6 py-4 sm:px-7">
          <span className="font-display text-lg">{s.title}</span>
          <span className="shrink-0 text-[0.68rem] font-medium uppercase tracking-[0.14em] text-stone-500">
            {s.tag}
          </span>
        </figcaption>

        <dl className="divide-y divide-stone-200 px-6 sm:px-7">
          {s.fields.map((f) => (
            <div key={f.label} className="grid grid-cols-[5.5rem_1fr] gap-x-4 py-2.5 text-[0.92rem]">
              <dt className="text-stone-500">{f.label}</dt>
              <dd className="leading-snug">{f.value}</dd>
            </div>
          ))}
        </dl>

        <div className="border-t border-stone-200 px-6 py-4 sm:px-7">
          <p className="text-[0.68rem] font-medium uppercase tracking-[0.14em] text-stone-500">{s.checksLabel}</p>
          <ul className="mt-2.5 flex flex-wrap gap-x-4 gap-y-1.5">
            {s.checks.map((c) => (
              <li key={c} className="flex items-center gap-1.5 text-[0.85rem] text-accent">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" aria-hidden="true" className="shrink-0">
                  <path d="M4 12.5l5 5L20 6.5" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
                {c}
              </li>
            ))}
          </ul>
        </div>

        <p className="flex items-baseline justify-between gap-4 bg-ink px-6 py-3.5 text-sm text-white sm:px-7">
          <span className="font-medium">{s.footer}</span>
          <span className="shrink-0 text-xs tabular-nums text-white/60">{s.sentAt}</span>
        </p>
      </div>
      <p className={`mt-4 text-center text-xs ${tone === "dark" ? "text-white/60" : "text-stone-500"}`}>
        {s.disclaimer}
      </p>
    </figure>
  );
}

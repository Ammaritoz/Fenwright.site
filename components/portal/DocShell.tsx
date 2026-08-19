import type { ReactNode } from "react";
import { WaveRule } from "@/components/Logo";
import { PrintButton } from "@/components/portal/PrintButton";
import { site } from "@/config/site";

type Props = {
  /** e.g. "Client Agreement". Set in the doc's own type, not the client file. */
  docType: string;
  /** Optional line under the doc type, e.g. "Full service agreement". */
  subtitle?: string;
  clientName: string;
  /** Right-hand meta pairs in the letterhead: date, invoice number, period. */
  meta?: { label: string; value: string }[];
  children: ReactNode;
};

/**
 * The letterhead every portal document shares.
 *
 * Deliberately the paper surface rather than the dark ink one: these are
 * documents that get printed and filed, and a full-bleed dark page is both a
 * toner crime and harder to read at length. The ink is reserved for the
 * wordmark and headings, matching the marketing site's own hierarchy.
 */
export function DocShell({ docType, subtitle, clientName, meta = [], children }: Props) {
  const l = site.legal;

  // Same conditional imprint as components/Footer.tsx: blank legal fields are
  // omitted, never rendered as empty labels or placeholder text.
  const imprint = [
    l.entityName,
    l.address,
    l.registrationNumber ? `Company no. ${l.registrationNumber}` : "",
    l.vatNumber ? `VAT ${l.vatNumber}` : "",
    l.contactEmail,
  ]
    .filter(Boolean)
    .join("  ·  ");

  return (
    <article className="mx-auto w-full max-w-3xl">
      <div className="rounded-xl2 border border-stone-200 bg-white px-7 py-9 shadow-card print:rounded-none print:border-0 print:px-0 print:py-0 print:shadow-none sm:px-12 sm:py-12">
        <header>
          <div className="flex flex-wrap items-start justify-between gap-6">
            <div>
              <p className="font-display text-2xl font-bold leading-none text-ink">
                {site.brand.wordmark}
              </p>
              <p className="mt-2 text-[0.7rem] uppercase tracking-[0.18em] text-stone-400">
                Consulting and systems
              </p>
            </div>
            <div className="text-right">
              <h1 className="font-display text-xl font-bold uppercase tracking-wide text-ink sm:text-2xl">
                {docType}
              </h1>
              {subtitle && (
                <p className="mt-1 text-[0.7rem] uppercase tracking-[0.14em] text-stone-400">
                  {subtitle}
                </p>
              )}
              {meta.map((m) => (
                <p key={m.label} className="mt-1 text-xs text-stone-500">
                  <span className="uppercase tracking-[0.1em] text-stone-400">{m.label}</span>{" "}
                  <span className="font-medium text-stone-600">{m.value}</span>
                </p>
              ))}
            </div>
          </div>

          <WaveRule className="mt-7 h-2 w-full object-fill opacity-70" />

          <p className="mt-6 text-sm text-stone-500">
            Prepared for <span className="font-semibold text-ink">{clientName}</span>
          </p>
        </header>

        <div className="mt-8">{children}</div>

        <footer className="mt-14 border-t border-stone-200 pt-5">
          <p className="text-[0.68rem] leading-relaxed text-stone-400">{imprint}</p>
        </footer>
      </div>

      <div className="mt-6 flex justify-end print:hidden">
        <PrintButton />
      </div>
    </article>
  );
}

/** A titled block within a document. */
export function DocSection({
  title,
  children,
  className = "",
}: {
  title: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <section className={`mt-9 break-inside-avoid ${className}`}>
      <h2 className="text-[0.7rem] font-semibold uppercase tracking-[0.16em] text-stone-400">
        {title}
      </h2>
      <div className="mt-3">{children}</div>
    </section>
  );
}

/** Body copy at document scale. */
export function DocText({ children }: { children: ReactNode }) {
  return <p className="text-[0.94rem] leading-relaxed text-stone-600">{children}</p>;
}

/** A green-tinted callout for the one thing on the page that matters most. */
export function DocCallout({ children }: { children: ReactNode }) {
  return (
    <div className="break-inside-avoid rounded-xl border border-accent/20 bg-accent-soft/60 px-5 py-4 text-[0.94rem] leading-relaxed text-ink print:border-stone-300 print:bg-transparent">
      {children}
    </div>
  );
}

/** Bulleted list with the fen-green marker used across the marketing site. */
export function DocList({ items }: { items: readonly string[] }) {
  return (
    <ul className="space-y-2.5">
      {items.map((item, i) => (
        <li key={i} className="flex gap-3 text-[0.94rem] leading-relaxed text-stone-600">
          <span aria-hidden="true" className="mt-[0.55em] h-1.5 w-1.5 shrink-0 rounded-full bg-accent" />
          <span>{item}</span>
        </li>
      ))}
    </ul>
  );
}

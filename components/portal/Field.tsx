import type { ReactNode } from "react";

/**
 * A label/value pair. Renders nothing at all when the value is empty, so a
 * client without a VAT number or an address gets a clean document rather than a
 * dangling label -- the same treatment components/Footer.tsx gives the imprint.
 */
export function Field({ label, value }: { label: string; value?: ReactNode }) {
  if (value === undefined || value === null || value === "") return null;
  return (
    <div>
      <dt className="text-[0.65rem] uppercase tracking-[0.14em] text-stone-400">{label}</dt>
      <dd className="mt-1 text-[0.94rem] leading-snug text-ink">{value}</dd>
    </div>
  );
}

/** Two-column grid of fields. Collapses to one column on small screens. */
export function FieldGrid({ children }: { children: ReactNode }) {
  return (
    <dl className="grid grid-cols-1 gap-x-10 gap-y-5 sm:grid-cols-2">{children}</dl>
  );
}

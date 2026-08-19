import type { ReactNode } from "react";

type Column = {
  key: string;
  label: string;
  align?: "left" | "right";
  /** Tailwind width class, e.g. "w-24". Optional. */
  width?: string;
};

/**
 * The table shared by the invoice, deliverables, package and report documents.
 *
 * Wrapped in an overflow-x container so a wide table scrolls inside itself
 * rather than making the whole page scroll sideways on a phone -- clients read
 * these on phones far more often than the desktop mock suggests.
 */
export function DocTable({
  columns,
  children,
}: {
  columns: Column[];
  children: ReactNode;
}) {
  return (
    <div className="-mx-1 overflow-x-auto px-1">
      <table className="w-full border-collapse text-left text-[0.9rem]">
        <thead>
          <tr className="border-b border-stone-300">
            {columns.map((c) => (
              <th
                key={c.key}
                scope="col"
                className={`pb-2 text-[0.63rem] font-semibold uppercase tracking-[0.13em] text-stone-400 ${
                  c.align === "right" ? "text-right" : "text-left"
                } ${c.width ?? ""}`}
              >
                {c.label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>{children}</tbody>
      </table>
    </div>
  );
}

export function DocRow({ children }: { children: ReactNode }) {
  return <tr className="break-inside-avoid border-b border-stone-200 align-top">{children}</tr>;
}

export function DocCell({
  children,
  align = "left",
  strong = false,
  muted = false,
}: {
  children: ReactNode;
  align?: "left" | "right";
  strong?: boolean;
  muted?: boolean;
}) {
  return (
    <td
      className={`py-3 pr-4 leading-snug last:pr-0 ${align === "right" ? "text-right" : ""} ${
        strong ? "font-semibold text-ink" : muted ? "text-stone-500" : "text-stone-600"
      }`}
    >
      {children}
    </td>
  );
}

/** Right-aligned totals block that sits under an invoice table. */
export function TotalsRow({
  label,
  value,
  emphasis = false,
}: {
  label: string;
  value: string;
  emphasis?: boolean;
}) {
  return (
    <div
      className={`flex items-baseline justify-between gap-8 py-2 ${
        emphasis ? "border-t-2 border-ink/80 pt-3" : ""
      }`}
    >
      <span
        className={
          emphasis
            ? "text-[0.7rem] font-semibold uppercase tracking-[0.14em] text-ink"
            : "text-[0.7rem] uppercase tracking-[0.13em] text-stone-400"
        }
      >
        {label}
      </span>
      <span
        className={
          emphasis
            ? "font-display text-xl font-bold text-ink"
            : "text-[0.94rem] text-stone-600"
        }
      >
        {value}
      </span>
    </div>
  );
}

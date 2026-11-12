import type { ReactNode } from "react";

/**
 * The pill-button hover: the label rolls up out of the pill while an
 * identical copy rises from below, on a spring curve that overshoots and
 * settles. Put it inside any `.btn-*` element. Styles live in globals.css
 * (`.roll`). The copy is aria-hidden so screen readers read the label once.
 */
export function Roll({ children }: { children: ReactNode }) {
  return (
    <span className="roll">
      <span>{children}</span>
      <span aria-hidden="true">{children}</span>
    </span>
  );
}

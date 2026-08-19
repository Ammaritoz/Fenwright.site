import Link from "next/link";
import { Logo } from "@/components/Logo";

/**
 * Portal chrome. Deliberately not components/Nav.tsx: a client reading their
 * own invoice should not be shown "Book a call" and the marketing sections.
 * Logo, who this belongs to, and a way back to their index. Nothing else.
 */
export function PortalNav({
  clientName,
  clientSlug,
  /** Omitted on the index page itself, where the back link points at nothing. */
  showBack = false,
}: {
  clientName: string;
  clientSlug: string;
  showBack?: boolean;
}) {
  return (
    <header className="border-b border-stone-200 bg-paper print:hidden">
      <div className="container-px flex h-16 items-center justify-between gap-4">
        <div className="flex min-w-0 items-center gap-4">
          <Logo className="h-7" />
          <span aria-hidden="true" className="h-5 w-px shrink-0 bg-stone-300" />
          <span className="truncate text-sm font-medium text-stone-600">{clientName}</span>
        </div>
        {showBack && (
          <Link
            href={`/portal/${clientSlug}`}
            className="shrink-0 text-sm font-semibold text-accent-700 underline-offset-4 hover:underline"
          >
            All documents
          </Link>
        )}
      </div>
    </header>
  );
}

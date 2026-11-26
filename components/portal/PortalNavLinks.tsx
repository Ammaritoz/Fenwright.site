"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef } from "react";

/**
 * The portal's navigation links, the breadcrumb in the top bar, and the
 * mobile menu that holds the links below `lg`.
 *
 * Client components only because the active link, the breadcrumb and closing
 * the menu on navigation all need the pathname. They receive the slug, two
 * counts and document titles the client can already see in Documents: no
 * client record crosses into the browser bundle from here.
 */

type IconName = "grid" | "shield" | "file" | "upload";
type Item = { href: string; label: string; icon: IconName; count?: string; countLabel?: string; dot?: string; match: (p: string) => boolean };

type Counts = { openFindings?: number | null; documents?: number; replies?: number };

function items(slug: string, counts: Counts): Item[] {
  const base = `/portal/${slug}`;
  return [
    { href: base, label: "Overview", icon: "grid", match: (p) => p === base },
    {
      href: `${base}/findings`,
      label: "Findings",
      icon: "shield",
      count: counts.openFindings ? String(counts.openFindings) : undefined,
      countLabel: counts.openFindings ? `${counts.openFindings} open` : undefined,
      // A new reply from us is a dot, not more words beside the count.
      dot: counts.replies ? `${counts.replies} new ${counts.replies === 1 ? "reply" : "replies"}` : undefined,
      // A report draft belongs to its finding.
      match: (p) => p.startsWith(`${base}/findings`) || p.startsWith(`${base}/reports/`),
    },
    { href: `${base}/upload`, label: "Upload firmware", icon: "upload", match: (p) => p.startsWith(`${base}/upload`) },
    {
      href: `${base}/documents`,
      label: "Documents",
      icon: "file",
      count: counts.documents ? String(counts.documents) : undefined,
      // A document page counts as being in Documents.
      match: (p) =>
        p !== base &&
        !p.startsWith(`${base}/findings`) &&
        !p.startsWith(`${base}/upload`) &&
        !p.startsWith(`${base}/reports/`) &&
        !p.startsWith(`${base}/call`),
    },
  ];
}

export function NavIcon({ name, size = 16 }: { name: IconName; size?: number }) {
  const common = { width: size, height: size, viewBox: "0 0 24 24", fill: "none", "aria-hidden": true } as const;
  const stroke = { stroke: "currentColor", strokeWidth: 1.7, strokeLinecap: "round", strokeLinejoin: "round" } as const;
  if (name === "grid")
    return (
      <svg {...common}>
        <rect x="4" y="4" width="6.5" height="6.5" rx="1.5" {...stroke} />
        <rect x="13.5" y="4" width="6.5" height="6.5" rx="1.5" {...stroke} />
        <rect x="4" y="13.5" width="6.5" height="6.5" rx="1.5" {...stroke} />
        <rect x="13.5" y="13.5" width="6.5" height="6.5" rx="1.5" {...stroke} />
      </svg>
    );
  if (name === "shield")
    return (
      <svg {...common}>
        <path d="M12 3.5l7 2.8v5.2c0 4.1-2.9 7.6-7 8.9-4.1-1.3-7-4.8-7-8.9V6.3l7-2.8z" {...stroke} />
      </svg>
    );
  if (name === "upload")
    return (
      <svg {...common}>
        <path d="M12 15V4m0 0L8 8m4-4l4 4M5 15v4h14v-4" {...stroke} />
      </svg>
    );
  return (
    <svg {...common}>
      <path d="M7 3.5h6.5l4.5 4.5v11.5a1 1 0 01-1 1H7a1 1 0 01-1-1v-15a1 1 0 011-1z" {...stroke} />
      <path d="M13 3.5V8h5" {...stroke} />
    </svg>
  );
}

export function PortalNavLinks({ slug, ...counts }: { slug: string } & Counts) {
  const pathname = usePathname() ?? "";
  return (
    <ul className="space-y-0.5">
      {items(slug, counts).map((item) => {
        const active = item.match(pathname);
        return (
          <li key={item.href}>
            <Link
              href={item.href}
              aria-current={active ? "page" : undefined}
              className={`flex h-[34px] items-center gap-2.5 rounded-lg px-2.5 text-[0.85rem] transition-colors ${
                active
                  ? "bg-night-raised text-night-text shadow-[inset_0_0_0_1px_#26282D]"
                  : "text-night-dim hover:bg-night-raised/60 hover:text-night-text"
              }`}
            >
              <span className={`flex w-4 justify-center ${active ? "text-night-text" : "text-night-faint"}`}>
                <NavIcon name={item.icon} />
              </span>
              <span className="flex-1">{item.label}</span>
              {item.dot && (
                <span title={item.dot} className="h-[7px] w-[7px] rounded-full bg-signal-mint">
                  <span className="sr-only">{item.dot}</span>
                </span>
              )}
              {item.count && (
                <span className="font-mono text-[0.72rem] text-night-mute">
                  <span aria-hidden="true">{item.count}</span>
                  <span className="sr-only">{item.countLabel ?? item.count}</span>
                </span>
              )}
            </Link>
          </li>
        );
      })}
    </ul>
  );
}

/** "Overview / Findings" in the top bar, from the pathname. */
export function PortalCrumb({ slug, docTitles }: { slug: string; docTitles: Record<string, string> }) {
  const pathname = usePathname() ?? "";
  const base = `/portal/${slug}`;
  const rest = pathname.startsWith(base) ? pathname.slice(base.length).replace(/^\/|\/$/g, "") : "";

  let trail: { label: string; href?: string }[];
  if (rest === "") trail = [{ label: "Overview" }];
  else if (rest === "findings") trail = [{ label: "Overview", href: base }, { label: "Findings" }];
  else if (rest === "upload") trail = [{ label: "Overview", href: base }, { label: "Upload firmware" }];
  else if (rest === "documents") trail = [{ label: "Overview", href: base }, { label: "Documents" }];
  else if (rest === "call") trail = [{ label: "Overview", href: base }, { label: "Book a call" }];
  else if (rest.startsWith("reports/")) {
    const [, cve, stage] = rest.split("/").map(decodeURIComponent);
    const stageName = { early_warning: "Early warning", notification: "Notification", final: "Final report" }[stage] ?? "Report";
    trail = [{ label: "Findings", href: `${base}/findings` }, { label: `${stageName} · ${cve}` }];
  }
  else trail = [{ label: "Documents", href: `${base}/documents` }, { label: docTitles[rest] ?? "Document" }];

  return (
    <nav aria-label="Breadcrumb">
      <ol className="flex items-center gap-2 text-[0.82rem]">
        {trail.map((t, i) => (
          <li key={t.label} className="flex items-center gap-2">
            {i > 0 && (
              <span aria-hidden="true" className="text-night-faint">
                /
              </span>
            )}
            {t.href ? (
              <Link href={t.href} className="text-night-mute hover:text-night-text">
                {t.label}
              </Link>
            ) : (
              <span aria-current="page" className="text-night-dim">
                {t.label}
              </span>
            )}
          </li>
        ))}
      </ol>
    </nav>
  );
}

/** Below `lg`, the sidebar's links live in a menu under the top bar. */
export function PortalMobileMenu({ slug, contactEmail, ...counts }: { slug: string; contactEmail: string } & Counts) {
  const ref = useRef<HTMLDetailsElement>(null);
  const pathname = usePathname();

  // <details> keeps working without JavaScript; this only closes it after a
  // client-side navigation, which would otherwise leave it open.
  useEffect(() => {
    if (ref.current) ref.current.open = false;
  }, [pathname]);

  return (
    <details ref={ref} className="group lg:hidden">
      <summary className="flex h-9 cursor-pointer list-none items-center gap-2 rounded-lg border border-night-edge bg-night-raised px-3 text-sm text-night-text transition-colors hover:bg-night-hover [&::-webkit-details-marker]:hidden">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true">
          <path d="M4 7h16M4 12h16M4 17h16" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" className="group-open:hidden" />
          <path d="M6 6l12 12M18 6L6 18" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" className="hidden group-open:block" />
        </svg>
        Menu
      </summary>
      <div className="absolute inset-x-4 top-full mt-2 rounded-xl border border-night-line bg-night-panel p-2 shadow-[0_24px_48px_-24px_rgba(0,0,0,0.8)]">
        <PortalNavLinks slug={slug} {...counts} />
        <p className="mt-2 border-t border-night-rule px-2.5 pb-1 pt-3 text-xs text-night-mute">
          Questions?{" "}
          <a href={`mailto:${contactEmail}`} className="text-night-dim hover:text-night-text hover:underline">
            {contactEmail}
          </a>
        </p>
      </div>
    </details>
  );
}

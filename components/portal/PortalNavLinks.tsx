"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef } from "react";

/**
 * The portal's navigation links, plus the mobile menu that holds them.
 *
 * A client component only because the active link and closing the menu on
 * navigation both need the pathname. It receives the slug and nothing else:
 * no client data crosses into the browser bundle from here.
 */

type Item = { href: string; label: string; icon: "grid" | "shield" | "file" | "upload"; match: (p: string) => boolean };

function items(slug: string): Item[] {
  const base = `/portal/${slug}`;
  return [
    { href: base, label: "Dashboard", icon: "grid", match: (p) => p === base },
    { href: `${base}/findings`, label: "Findings", icon: "shield", match: (p) => p.startsWith(`${base}/findings`) },
    { href: `${base}/upload`, label: "Upload", icon: "upload", match: (p) => p.startsWith(`${base}/upload`) },
    {
      href: `${base}/documents`,
      label: "Documents",
      icon: "file",
      // A document page counts as being in Documents.
      match: (p) => p !== base && !p.startsWith(`${base}/findings`) && !p.startsWith(`${base}/upload`),
    },
  ];
}

function Icon({ name }: { name: Item["icon"] }) {
  const common = { width: 18, height: 18, viewBox: "0 0 24 24", fill: "none", "aria-hidden": true } as const;
  const stroke = { stroke: "currentColor", strokeWidth: 1.8, strokeLinecap: "round", strokeLinejoin: "round" } as const;
  if (name === "grid")
    return (
      <svg {...common}>
        <rect x="3.5" y="3.5" width="7" height="7" rx="1.5" {...stroke} />
        <rect x="13.5" y="3.5" width="7" height="7" rx="1.5" {...stroke} />
        <rect x="3.5" y="13.5" width="7" height="7" rx="1.5" {...stroke} />
        <rect x="13.5" y="13.5" width="7" height="7" rx="1.5" {...stroke} />
      </svg>
    );
  if (name === "shield")
    return (
      <svg {...common}>
        <path d="M12 3l7.5 3v5.5c0 4.4-3.1 8.2-7.5 9.5-4.4-1.3-7.5-5.1-7.5-9.5V6L12 3z" {...stroke} />
        <path d="M9 12l2 2 4-4" {...stroke} />
      </svg>
    );
  if (name === "upload")
    return (
      <svg {...common}>
        <path d="M12 16V4m0 0l-4 4m4-4l4 4M5 16v3h14v-3" {...stroke} />
      </svg>
    );
  return (
    <svg {...common}>
      <path d="M7 3.5h6.5L18.5 8.5V19a1.5 1.5 0 01-1.5 1.5H7A1.5 1.5 0 015.5 19V5A1.5 1.5 0 017 3.5z" {...stroke} />
      <path d="M13 3.5V9h5.5M8.5 13h7M8.5 16.5h5" {...stroke} />
    </svg>
  );
}

export function PortalNavLinks({ slug }: { slug: string }) {
  const pathname = usePathname() ?? "";
  return (
    <ul className="space-y-0.5">
      {items(slug).map((item) => {
        const active = item.match(pathname);
        return (
          <li key={item.href}>
            <Link
              href={item.href}
              aria-current={active ? "page" : undefined}
              className={`flex h-9 items-center gap-2.5 rounded-lg px-2 text-sm font-medium transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent ${
                active
                  ? "bg-stone-50 text-ink ring-1 ring-stone-200"
                  : "text-stone-600 hover:bg-stone-50 hover:text-ink"
              }`}
            >
              <span className={`flex w-[18px] justify-center ${active ? "text-accent" : "text-stone-400"}`}>
                <Icon name={item.icon} />
              </span>
              {item.label}
            </Link>
          </li>
        );
      })}
    </ul>
  );
}

/** Below `lg`, the sidebar's links live in a menu under the top bar. */
export function PortalMobileMenu({ slug, contactEmail }: { slug: string; contactEmail: string }) {
  const ref = useRef<HTMLDetailsElement>(null);
  const pathname = usePathname();

  // <details> keeps working without JavaScript; this only closes it after a
  // client-side navigation, which would otherwise leave it open.
  useEffect(() => {
    if (ref.current) ref.current.open = false;
  }, [pathname]);

  return (
    <details ref={ref} className="group lg:hidden">
      <summary className="flex h-9 cursor-pointer list-none items-center gap-2 rounded-lg px-3 text-sm font-medium text-ink transition-colors hover:bg-stone-50 [&::-webkit-details-marker]:hidden">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
          <path
            d="M4 7h16M4 12h16M4 17h16"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinecap="round"
            className="group-open:hidden"
          />
          <path
            d="M6 6l12 12M18 6L6 18"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinecap="round"
            className="hidden group-open:block"
          />
        </svg>
        Menu
      </summary>
      <div className="absolute inset-x-4 top-full mt-2 rounded-xl border border-stone-200 bg-white p-2 shadow-soft">
        <PortalNavLinks slug={slug} />
        <p className="mt-2 border-t border-stone-200 px-2 pb-1 pt-3 text-xs text-stone-500">
          Questions?{" "}
          <a href={`mailto:${contactEmail}`} className="font-medium text-accent-700 hover:underline">
            {contactEmail}
          </a>
        </p>
      </div>
    </details>
  );
}

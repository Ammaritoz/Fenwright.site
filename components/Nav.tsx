"use client";

import { useEffect, useState } from "react";
import { Logo } from "@/components/Logo";
import { site } from "@/config/site";
import { Roll } from "@/components/Roll";

type Props = {
  /** overrides the "Book a call" button, e.g. to a page's own booking section */
  cta?: { label: string; href: string };
  /** sit transparent over a dark hero until the page scrolls */
  overlay?: boolean;
};

export function Nav({ cta = site.nav.cta, overlay = false }: Props = {}) {
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 12);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const solid = !overlay || scrolled || open;

  return (
    <header
      className={`fixed inset-x-0 top-0 z-40 text-white transition-colors duration-300 ${
        solid ? "border-b border-white/10 bg-ink/90 backdrop-blur-md" : "border-b border-transparent bg-transparent"
      }`}
    >
      <nav
        className={`container-px flex items-center justify-between transition-all duration-300 ${
          scrolled ? "h-16" : "h-20"
        }`}
        aria-label="Primary"
      >
        <a href="/#top" className="rounded" aria-label={`${site.brand.name} home`}>
          <Logo variant="paper" />
        </a>

        <div className="hidden items-center gap-10 md:flex">
          <ul className="flex items-center gap-8 text-sm text-white/75">
            {site.nav.links.map((l) => (
              <li key={l.href}>
                <a href={l.href} className="rounded transition-colors hover:text-white">
                  {l.label}
                </a>
              </li>
            ))}
          </ul>
          <a href={cta.href} className="btn-cta px-5 py-2.5">
            <Roll>{cta.label}</Roll>
          </a>
        </div>

        <button
          type="button"
          className="inline-flex h-10 w-10 items-center justify-center rounded text-white md:hidden"
          aria-expanded={open}
          aria-controls="mobile-menu"
          aria-label={open ? "Close menu" : "Open menu"}
          onClick={() => setOpen((v) => !v)}
        >
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden="true">
            {open ? (
              <path d="M6 6l12 12M18 6L6 18" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
            ) : (
              <path d="M4 8h16M4 16h16" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
            )}
          </svg>
        </button>
      </nav>

      {open && (
        <div id="mobile-menu" className="border-t border-white/10 bg-ink md:hidden">
          <ul className="container-px flex flex-col py-3">
            {site.nav.links.map((l) => (
              <li key={l.href} className="border-b border-white/10">
                <a href={l.href} className="block py-4 font-display text-2xl" onClick={() => setOpen(false)}>
                  {l.label}
                </a>
              </li>
            ))}
            <li className="py-5">
              <a href={cta.href} className="btn-cta w-full" onClick={() => setOpen(false)}>
                <Roll>{cta.label}</Roll>
              </a>
            </li>
          </ul>
        </div>
      )}
    </header>
  );
}

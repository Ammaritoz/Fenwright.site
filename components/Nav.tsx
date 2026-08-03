"use client";

import { useEffect, useState } from "react";
import { Logo } from "@/components/Logo";
import { site } from "@/config/site";

export function Nav() {
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 12);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <header
      className={`fixed inset-x-0 top-0 z-40 transition-all duration-300 ${
        scrolled
          ? "border-b border-stone-200/80 bg-paper/85 backdrop-blur-md"
          : "border-b border-transparent bg-transparent"
      }`}
    >
      <nav
        className={`container-px flex items-center justify-between transition-all duration-300 ${
          scrolled ? "h-16" : "h-20"
        }`}
        aria-label="Primary"
      >
        <a href="/#top" className="rounded-lg" aria-label={`${site.brand.name} home`}>
          <Logo />
        </a>

        <div className="hidden items-center gap-8 md:flex">
          <ul className="flex items-center gap-7 text-sm font-medium text-stone-600">
            {site.nav.links.map((l) => (
              <li key={l.href}>
                <a href={l.href} className="rounded transition-colors hover:text-ink">
                  {l.label}
                </a>
              </li>
            ))}
          </ul>
          <a href={site.nav.cta.href} className="btn-primary">
            {site.nav.cta.label}
          </a>
        </div>

        <button
          type="button"
          className="inline-flex h-10 w-10 items-center justify-center rounded-lg text-ink md:hidden"
          aria-expanded={open}
          aria-controls="mobile-menu"
          aria-label={open ? "Close menu" : "Open menu"}
          onClick={() => setOpen((v) => !v)}
        >
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden="true">
            {open ? (
              <path d="M6 6l12 12M18 6L6 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
            ) : (
              <path d="M4 7h16M4 12h16M4 17h16" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
            )}
          </svg>
        </button>
      </nav>

      {open && (
        <div id="mobile-menu" className="border-t border-stone-200 bg-paper md:hidden">
          <ul className="container-px flex flex-col gap-1 py-3 text-base font-medium text-ink">
            {site.nav.links.map((l) => (
              <li key={l.href}>
                <a
                  href={l.href}
                  className="block rounded-lg px-2 py-3 hover:bg-ink/5"
                  onClick={() => setOpen(false)}
                >
                  {l.label}
                </a>
              </li>
            ))}
            <li className="px-2 py-2">
              <a
                href={site.nav.cta.href}
                className="btn-primary w-full"
                onClick={() => setOpen(false)}
              >
                {site.nav.cta.label}
              </a>
            </li>
          </ul>
        </div>
      )}
    </header>
  );
}

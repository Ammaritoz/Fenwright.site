"use client";

import { useEffect, useState } from "react";
import Script from "next/script";
import Link from "next/link";
import { site } from "@/config/site";

type Consent = "accepted" | "declined" | null;

const STORAGE_KEY = "fenwright-cookie-consent";
const GA_ID = process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID;

/**
 * Gates Google Analytics behind an explicit accept/decline choice, per the
 * commitment in the privacy policy's Cookies section: no analytics cookies
 * until the visitor consents. GA scripts only render after "accepted" is
 * read from localStorage, never before.
 */
export function CookieConsent() {
  const [consent, setConsent] = useState<Consent>(null);
  const [ready, setReady] = useState(false);
  const c = site.cookieConsent;

  useEffect(() => {
    const stored = window.localStorage.getItem(STORAGE_KEY);
    if (stored === "accepted" || stored === "declined") setConsent(stored);
    setReady(true);
  }, []);

  function choose(value: "accepted" | "declined") {
    window.localStorage.setItem(STORAGE_KEY, value);
    setConsent(value);
  }

  return (
    <>
      {consent === "accepted" && GA_ID && (
        <>
          <Script src={`https://www.googletagmanager.com/gtag/js?id=${GA_ID}`} strategy="afterInteractive" />
          <Script id="ga-init" strategy="afterInteractive">
            {`window.dataLayer = window.dataLayer || [];
              function gtag(){dataLayer.push(arguments);}
              gtag('js', new Date());
              gtag('config', '${GA_ID}');`}
          </Script>
        </>
      )}

      {ready && consent === null && (
        <div
          role="dialog"
          aria-label="Cookie consent"
          className="fixed inset-x-0 bottom-0 z-50 border-t border-stone-200 bg-paper px-4 py-4 shadow-lift sm:px-6"
        >
          <div className="mx-auto flex max-w-4xl flex-col items-center gap-3 sm:flex-row sm:justify-between">
            <p className="text-center text-sm text-stone-600 sm:text-left">
              {c.text}{" "}
              <Link href="/privacy" className="underline underline-offset-2 hover:text-ink">
                {c.privacyLabel}
              </Link>
            </p>
            <div className="flex shrink-0 gap-3">
              <button
                type="button"
                onClick={() => choose("declined")}
                className="btn-secondary px-4 py-2 text-sm"
              >
                {c.declineLabel}
              </button>
              <button
                type="button"
                onClick={() => choose("accepted")}
                className="btn-primary px-4 py-2 text-sm"
              >
                {c.acceptLabel}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

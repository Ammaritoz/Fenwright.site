"use client";

import { useState } from "react";
import { night } from "@/components/portal/night";

/**
 * Copies one report field's text for pasting into ENISA's form. Receives only
 * the text it copies, which the page has already rendered next to it.
 */
export function CopyButton({ text, label }: { text: string; label: string }) {
  const [state, setState] = useState<"idle" | "copied" | "failed">("idle");

  async function copy() {
    try {
      await navigator.clipboard.writeText(text);
      setState("copied");
    } catch {
      // Clipboard blocked (permissions, insecure context): the text is on screen to select by hand.
      setState("failed");
    }
    setTimeout(() => setState("idle"), 2000);
  }

  return (
    <button type="button" onClick={copy} className={`${night.btn} h-8 shrink-0 px-3 print:hidden`} aria-label={`Copy ${label}`}>
      {state === "copied" ? (
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" aria-hidden="true" className="text-signal-mint">
          <path d="M5 12.5l4.5 4.5L19 7.5" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      ) : (
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" aria-hidden="true">
          <rect x="8.5" y="8.5" width="11" height="11" rx="2" stroke="currentColor" strokeWidth="1.8" />
          <path d="M15.5 8.5V6a1.5 1.5 0 00-1.5-1.5H6A1.5 1.5 0 004.5 6v8A1.5 1.5 0 006 15.5h2.5" stroke="currentColor" strokeWidth="1.8" />
        </svg>
      )}
      <span aria-live="polite">{state === "copied" ? "Copied" : state === "failed" ? "Select and copy" : "Copy"}</span>
    </button>
  );
}

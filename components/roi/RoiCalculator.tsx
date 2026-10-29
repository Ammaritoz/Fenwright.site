"use client";

import { useEffect, useState } from "react";
import { roi } from "@/config/roi";
import { serialiseRoiState, type RoiMode, type RoiState } from "@/lib/roi";
import { MissedCallsInputs, MissedCallsSheet } from "@/components/roi/MissedCallsMode";
import { LeadPacksInputs, LeadPacksSheet, LeadPacksTable } from "@/components/roi/LeadPacksMode";

const MODES: RoiMode[] = ["calls", "leads"];

/**
 * Owns the calculator state and mirrors it into the URL, so the address bar
 * is always a link that reopens exactly these numbers. replaceState rather
 * than the Next router: a router navigation per keystroke would re-render the
 * server page and fill the back button with every digit typed.
 */
export function RoiCalculator({ initial }: { initial: RoiState }) {
  const [state, setState] = useState(initial);
  const [copied, setCopied] = useState(false);
  const set = (patch: Partial<RoiState>) => setState((s) => ({ ...s, ...patch }));

  useEffect(() => {
    const url = `${window.location.pathname}?${serialiseRoiState(state).toString()}`;
    window.history.replaceState(window.history.state, "", url);
    setCopied(false);
  }, [state]);

  async function copyLink() {
    try {
      await navigator.clipboard.writeText(window.location.href);
      setCopied(true);
    } catch {
      // Clipboard can be refused (permissions, insecure origin). The address
      // bar already holds the same link, so selecting it is the fallback.
      window.prompt("Copy this link:", window.location.href);
    }
  }

  const leads = state.mode === "leads";

  return (
    <div>
      <div role="group" aria-label="Calculator" className="inline-flex rounded-full border border-stone-300 bg-white p-1 shadow-tight print:hidden">
        {MODES.map((mode) => {
          const on = state.mode === mode;
          return (
            <button
              key={mode}
              type="button"
              aria-pressed={on}
              onClick={() => set({ mode })}
              className={`rounded-full px-5 py-2.5 text-sm font-semibold transition sm:px-6 ${
                on ? "bg-ink text-paper" : "text-stone-600 hover:text-ink"
              }`}
            >
              {roi.modes[mode].label}
            </button>
          );
        })}
      </div>
      <p className="mt-3 text-sm text-stone-500 print:hidden">{roi.modes[state.mode].short}</p>

      <div className="mt-10 grid items-start gap-10 lg:grid-cols-[minmax(0,1fr)_minmax(0,27rem)] lg:gap-14">
        <div className="print:hidden">
          {leads ? <LeadPacksInputs state={state} set={set} /> : <MissedCallsInputs state={state} set={set} />}
          <p className="mt-8 text-xs leading-relaxed text-stone-500">
            {leads ? roi.leads.assumptions : roi.calls.assumptions}
          </p>
        </div>

        <div className="lg:sticky lg:top-28">
          {leads ? <LeadPacksSheet state={state} /> : <MissedCallsSheet state={state} />}
          <div className="mt-5 flex flex-wrap items-center gap-x-4 gap-y-2 print:hidden">
            <button type="button" onClick={copyLink} className="btn-secondary px-5 py-2.5 text-sm">
              {copied ? roi.share.copiedLabel : roi.share.copyLabel}
            </button>
            <span className="text-xs text-stone-500" aria-live="polite">
              {roi.share.note}
            </span>
          </div>
        </div>
      </div>

      {leads && (
        <div className="mt-16">
          <LeadPacksTable state={state} />
        </div>
      )}

      {/* On paper the inputs are hidden, so the assumptions travel with the results. */}
      <p className="mt-8 hidden text-xs leading-relaxed text-stone-600 print:block">
        {leads ? roi.leads.assumptions : roi.calls.assumptions}
      </p>
    </div>
  );
}

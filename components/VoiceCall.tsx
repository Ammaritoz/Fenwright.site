"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type Vapi from "@vapi-ai/web";
import { site } from "@/config/site";

/**
 * Talk to the voice receptionist from the browser: a Vapi web call, so no
 * phone number is involved. The call is created by /api/voice/web-call, which
 * holds the key and the limits; this component only joins the call it gets
 * back, so no Vapi key ever reaches the browser.
 */

type CallState = "idle" | "connecting" | "live" | "ended" | "error";

function formatElapsed(s: number): string {
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`;
}

function isMicError(err: unknown): boolean {
  // getUserMedia rejects with a DOMException, whose name and message do not
  // survive JSON.stringify; the SDK's error events are plain objects that do.
  const named = err instanceof Error ? `${err.name} ${err.message}` : "";
  const text = `${named} ${JSON.stringify(err ?? "")}`.toLowerCase();
  return /notallowed|permission|microphone|getusermedia|denied/.test(text);
}

export function VoiceCall({ enabled }: { enabled: boolean }) {
  const v = site.demo.voice;
  const vapiRef = useRef<Vapi | null>(null);
  const [state, setState] = useState<CallState>("idle");
  const [error, setError] = useState<string | null>(null);
  const [level, setLevel] = useState(0);
  const [speaking, setSpeaking] = useState(false);
  const [elapsed, setElapsed] = useState(0);

  // Elapsed timer while live.
  useEffect(() => {
    if (state !== "live") return;
    const id = window.setInterval(() => setElapsed((s) => s + 1), 1000);
    return () => window.clearInterval(id);
  }, [state]);

  // Never leave a call (and a live microphone) running after the section unmounts.
  useEffect(() => () => void vapiRef.current?.stop(), []);

  const start = useCallback(async () => {
    setError(null);
    setElapsed(0);
    setState("connecting");
    try {
      // Microphone first: a visitor without one should not spend a call.
      const probe = await navigator.mediaDevices.getUserMedia({ audio: true });
      probe.getTracks().forEach((t) => t.stop());

      const res = await fetch("/api/voice/web-call", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: "{}",
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(data.error || v.genericError);
        setState("error");
        return;
      }

      // Loaded on click: the SDK pulls in a WebRTC stack nobody needs until then.
      if (!vapiRef.current) {
        const { default: VapiClient } = await import("@vapi-ai/web");
        // No key: the SDK only joins a call the server already created, which
        // never touches Vapi's API from here. avoidEval: Daily otherwise evals
        // its call engine, which the production CSP forbids.
        const vapi = new VapiClient("server-created-call", undefined, { avoidEval: true });
        vapi.on("call-start", () => setState("live"));
        vapi.on("call-end", () => {
          setState((s) => (s === "error" ? s : "ended"));
          setSpeaking(false);
          setLevel(0);
        });
        vapi.on("speech-start", () => setSpeaking(true));
        vapi.on("speech-end", () => setSpeaking(false));
        vapi.on("volume-level", (vol) => setLevel(vol));
        vapi.on("error", (err) => {
          console.error("[fenwright] voice call error", err);
          setError(isMicError(err) ? v.micError : v.genericError);
          setState("error");
        });
        vapiRef.current = vapi;
      }
      await vapiRef.current.reconnect(data);
    } catch (err) {
      console.error("[fenwright] voice call failed to start", err);
      // The SDK's own `error` event usually fires first with the real cause
      // (no microphone, permission refused); keep that message rather than
      // replacing it with the generic one this bare rejection would give.
      setError((prev) => prev ?? (isMicError(err) ? v.micError : v.genericError));
      setState("error");
    }
  }, [v.genericError, v.micError]);

  const stop = useCallback(() => {
    void vapiRef.current?.stop();
  }, []);

  if (!enabled) return null;

  const live = state === "live";
  const busy = state === "connecting";

  return (
    <div className="mx-auto mt-4 max-w-5xl rounded-xl2 border border-stone-200 bg-paper p-6 shadow-card sm:p-7">
      <div className="grid gap-6 md:grid-cols-[1fr_auto] md:items-center md:gap-10">
        <div>
          <h3 className="font-display text-xl font-bold text-ink">{v.heading}</h3>
          <p className="mt-2 max-w-xl text-[0.95rem] leading-relaxed text-stone-600">{v.body}</p>
          <p className="mt-3 text-xs leading-relaxed text-stone-500">{v.note}</p>
        </div>

        <div className="flex flex-col items-stretch gap-3 md:min-w-[17rem]">
          {live ? (
            <div
              className="flex items-center justify-between gap-4 rounded-full bg-ink py-2 pl-5 pr-2 text-paper"
              aria-live="polite"
            >
              <span className="flex items-center gap-3">
                <span className="relative flex h-2.5 w-2.5">
                  <span className="absolute inset-0 animate-pulse-ring rounded-full bg-accent-300" />
                  <span className="relative h-2.5 w-2.5 rounded-full bg-accent-300" />
                </span>
                <span className="text-sm font-semibold">{v.liveLabel}</span>
                <span className="text-sm tabular-nums text-stone-300">{formatElapsed(elapsed)}</span>
                <VoiceLevel level={speaking ? level : 0} />
              </span>
              <button
                type="button"
                onClick={stop}
                className="rounded-full bg-paper px-4 py-2 text-sm font-semibold text-ink transition hover:bg-white"
              >
                {v.endLabel}
              </button>
            </div>
          ) : (
            <button
              type="button"
              onClick={start}
              disabled={busy}
              className="btn-primary disabled:cursor-wait disabled:opacity-70"
            >
              <svg width="17" height="17" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                <rect x="9" y="3" width="6" height="11" rx="3" stroke="currentColor" strokeWidth="2" />
                <path d="M5.5 11a6.5 6.5 0 0 0 13 0M12 17.5V21" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
              </svg>
              {busy ? v.connectingLabel : v.startLabel}
            </button>
          )}

          {state === "ended" && (
            <p className="text-sm text-stone-600" aria-live="polite">
              {v.endedLabel}{" "}
              <a href={v.endedCta.href} className="font-semibold text-ink underline underline-offset-4">
                {v.endedCta.label}
              </a>
            </p>
          )}
          {state === "error" && error && (
            <p className="text-sm text-red-700" role="alert">
              {error}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

/** Five bars that follow the receptionist's voice level while she speaks. */
function VoiceLevel({ level }: { level: number }) {
  const weights = [0.55, 0.85, 1, 0.75, 0.5];
  return (
    <span className="flex h-4 items-center gap-[3px]" aria-hidden="true">
      {weights.map((w, i) => (
        <span
          key={i}
          className="w-[3px] rounded-full bg-accent-300 transition-[height] duration-100"
          style={{ height: `${Math.max(3, Math.min(16, 3 + level * 40 * w))}px` }}
        />
      ))}
    </span>
  );
}

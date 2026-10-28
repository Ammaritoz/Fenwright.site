"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import dynamic from "next/dynamic";
import { site } from "@/config/site";
import { SectionHead } from "@/components/SectionHead";
import { VoiceCall } from "@/components/VoiceCall";

const PhoneField = dynamic(
  () => import("@/components/PhoneField").then((m) => m.PhoneField),
  {
    ssr: false,
    loading: () => (
      <div className="h-[46px] w-full rounded-xl border border-stone-300 bg-white" />
    ),
  }
);

type Phase = "idle" | "loading" | "typing" | "done";
type SmsState = "idle" | "sending" | "sent" | "error";

const REDUCED =
  typeof window !== "undefined" &&
  window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;

// How long the reply types in and the counter ticks up, in ms.
const REVEAL_MS = 1700;

export function Demo({ voiceEnabled = false }: { voiceEnabled?: boolean }) {
  const d = site.demo;
  const industries = site.industries;

  const [industryId, setIndustryId] = useState(industries[0].id);
  const current = useMemo(
    () => industries.find((i) => i.id === industryId) ?? industries[0],
    [industries, industryId]
  );

  const [enquiry, setEnquiry] = useState(industries[0].exampleEnquiry);
  const [touchedEnquiry, setTouchedEnquiry] = useState(false);

  const [phase, setPhase] = useState<Phase>("idle");
  const [error, setError] = useState<string | null>(null);
  const [shownReply, setShownReply] = useState("");
  const [targetSeconds, setTargetSeconds] = useState(0);
  const [timer, setTimer] = useState(0);

  const typeRef = useRef<number | null>(null);
  const clockRef = useRef<number | null>(null);
  const settleRef = useRef<number | null>(null);

  // When industry changes and the user has not edited the box, refresh the example.
  useEffect(() => {
    if (!touchedEnquiry) setEnquiry(current.exampleEnquiry);
  }, [current, touchedEnquiry]);

  const clearTimers = useCallback(() => {
    if (typeRef.current) window.clearInterval(typeRef.current);
    if (clockRef.current) window.clearInterval(clockRef.current);
    if (settleRef.current) window.clearTimeout(settleRef.current);
    typeRef.current = null;
    clockRef.current = null;
    settleRef.current = null;
  }, []);

  useEffect(() => () => clearTimers(), [clearTimers]);

  const runTyping = useCallback((text: string, seconds: number) => {
    setTargetSeconds(seconds);
    setShownReply("");
    setTimer(0);
    setPhase("typing");

    if (REDUCED) {
      setShownReply(text);
      setTimer(seconds);
      setPhase("done");
      return;
    }

    // Live counter eases from 0 up to the reply time over the reveal window.
    const start = Date.now();
    clockRef.current = window.setInterval(() => {
      const t = Math.min(1, (Date.now() - start) / REVEAL_MS);
      const eased = 1 - Math.pow(1 - t, 2); // easeOutQuad
      setTimer(Number((seconds * eased).toFixed(1)));
      if (t >= 1 && clockRef.current) {
        window.clearInterval(clockRef.current);
        clockRef.current = null;
      }
    }, 55);

    // Type the reply in over the same window.
    let idx = 0;
    const total = text.length;
    const stepMs = Math.max(14, Math.min(38, Math.floor(REVEAL_MS / Math.max(total, 1))));
    typeRef.current = window.setInterval(() => {
      idx += 1;
      setShownReply(text.slice(0, idx));
      if (idx >= total && typeRef.current) {
        window.clearInterval(typeRef.current);
        typeRef.current = null;
      }
    }, stepMs);

    // Settle exactly on the response time.
    settleRef.current = window.setTimeout(() => {
      if (clockRef.current) window.clearInterval(clockRef.current);
      clockRef.current = null;
      setShownReply(text);
      setTimer(seconds);
      setPhase("done");
    }, REVEAL_MS);
  }, []);

  const generate = useCallback(async () => {
    clearTimers();
    setError(null);
    setSmsState("idle");
    setSmsMsg(null);
    setPhase("loading");
    setShownReply("");
    setTimer(0);

    try {
      const res = await fetch("/api/demo-reply", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ industry: industryId, enquiry: enquiry.trim() || undefined }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Something went wrong. Please try again.");
        setPhase("idle");
        return;
      }
      runTyping(data.reply as string, Number(data.seconds) || 8);
    } catch {
      setError("Could not reach the demo. Check your connection and try again.");
      setPhase("idle");
    }
  }, [clearTimers, enquiry, industryId, runTyping]);

  // ---- Stage two: real SMS ----
  const [phone, setPhone] = useState("");
  const [consent, setConsent] = useState(false);
  const [smsState, setSmsState] = useState<SmsState>("idle");
  const [smsMsg, setSmsMsg] = useState<string | null>(null);

  const sendText = useCallback(async () => {
    setSmsMsg(null);
    if (!consent) {
      setSmsState("error");
      setSmsMsg("Please tick the box so we can text you.");
      return;
    }
    setSmsState("sending");
    try {
      const res = await fetch("/api/demo-text", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          industry: industryId,
          enquiry: enquiry.trim() || undefined,
          phone: phone.trim(),
          consent: true,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setSmsState("error");
        setSmsMsg(data.error || "We could not send that text. Please try again.");
        return;
      }
      setSmsState("sent");
    } catch {
      setSmsState("error");
      setSmsMsg("Could not reach the server. Please try again.");
    }
  }, [consent, enquiry, industryId, phone]);

  const busy = phase === "loading";
  const showReply = phase !== "idle";

  return (
    <section id="demo" className="section bg-paper-alt py-24 sm:py-32">
      <div className="container-px">
        <SectionHead
          size="lg"
          align="center"
          title={d.headline}
          lead={d.subhead}
        />

        <div className="mx-auto mt-14 grid max-w-5xl gap-4 lg:grid-cols-2">
          {/* Controls */}
          <div className="rounded-xl2 border border-stone-200 bg-paper p-6 shadow-card sm:p-7">
            <fieldset>
              <legend className="text-sm font-bold text-ink">Pick an industry</legend>
              <div className="mt-4 flex flex-wrap gap-2" role="radiogroup" aria-label="Industry">
                {industries.map((ind) => {
                  const active = ind.id === industryId;
                  return (
                    <button
                      key={ind.id}
                      type="button"
                      role="radio"
                      aria-checked={active}
                      onClick={() => {
                        if (ind.id === industryId) return;
                        setIndustryId(ind.id);
                        setTouchedEnquiry(false);
                        // Clear any shown reply so the canvas never displays a
                        // stale reply/comparison line for the previous industry.
                        clearTimers();
                        setPhase("idle");
                        setShownReply("");
                        setTimer(0);
                        setTargetSeconds(0);
                        setError(null);
                        setSmsState("idle");
                        setSmsMsg(null);
                      }}
                      className={`rounded-full border px-3.5 py-2 text-sm font-semibold transition ${
                        active
                          ? "border-ink bg-ink text-paper"
                          : "border-stone-300 bg-paper text-stone-600 hover:border-ink hover:text-ink"
                      }`}
                    >
                      {ind.label}
                    </button>
                  );
                })}
              </div>
            </fieldset>

            <div className="mt-6">
              <label htmlFor="demo-enquiry" className="text-sm font-bold text-ink">
                {d.enquiryLabel}
              </label>
              <textarea
                id="demo-enquiry"
                value={enquiry}
                onChange={(e) => {
                  setEnquiry(e.target.value);
                  setTouchedEnquiry(true);
                }}
                rows={3}
                maxLength={500}
                className="mt-3 w-full resize-none rounded-xl border border-stone-300 bg-white px-4 py-3 text-sm text-ink placeholder:text-stone-500 focus:border-accent-600 focus:outline-none focus:ring-2 focus:ring-accent/40"
                placeholder={current.exampleEnquiry}
              />
            </div>

            <button
              type="button"
              onClick={generate}
              disabled={busy}
              className="btn-primary mt-5 w-full disabled:cursor-not-allowed disabled:opacity-70"
            >
              {busy ? "Thinking..." : phase === "done" ? d.regenerateLabel : d.generateLabel}
            </button>

            {error && (
              <p className="mt-3 text-sm text-red-600" role="alert">
                {error}
              </p>
            )}
          </div>

          {/* Reply canvas */}
          <div className="flex flex-col rounded-xl2 bg-ink p-6 text-paper sm:p-7">
            <div className="flex items-center justify-between">
              <p className="text-sm font-bold text-stone-200">Fenwright reply</p>
              <SpeedBadge phase={phase} timer={timer} target={targetSeconds} />
            </div>

            <div className="mt-5 flex-1">
              {!showReply && (
                <p className="text-[0.95rem] leading-relaxed text-stone-400">
                  Pick an industry and press generate. The reply appears here with a live timer,
                  exactly like a real customer would see.
                </p>
              )}

              {phase === "loading" && (
                <div className="flex items-center gap-2 text-stone-300" aria-live="polite">
                  <Dots />
                  <span className="text-sm">Writing a reply...</span>
                </div>
              )}

              {(phase === "typing" || phase === "done") && (
                <div className="flex justify-start" aria-live="polite">
                  <p
                    className={`max-w-[95%] rounded-2xl rounded-tl-md bg-accent px-4 py-3 text-[15px] font-medium leading-snug text-paper ${
                      phase === "typing" ? "caret" : ""
                    }`}
                  >
                    {shownReply}
                  </p>
                </div>
              )}
            </div>

            {phase === "done" && (
              <p className="mt-5 border-t border-white/10 pt-4 text-[0.9rem] leading-relaxed text-stone-300">
                <span className="font-bold text-accent-300">Replied in {targetSeconds}s.</span>{" "}
                {current.averageLine}
              </p>
            )}
          </div>
        </div>

        {/* Stage two: real SMS */}
        {phase === "done" && (
          <div className="mx-auto mt-4 max-w-5xl">
            <div className="rounded-xl2 border-2 border-accent-600/30 bg-accent-soft p-6 sm:p-7">
              {smsState === "sent" ? (
                <div className="text-center">
                  <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-accent text-paper">
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                      <path d="M5 13l4 4L19 7" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  </div>
                  <p className="mt-3 font-display text-xl font-bold text-ink">{d.sms.successLabel}</p>
                  <p className="mx-auto mt-2 max-w-md text-sm text-stone-600">{d.sms.metaSell}</p>
                </div>
              ) : (
                <div>
                  <h3 className="font-display text-xl font-bold text-ink">{d.sms.heading}</h3>
                  <p className="mt-1 text-sm text-stone-600">{d.sms.body}</p>

                  <div className="mt-4 grid gap-3 sm:grid-cols-[1fr_auto] sm:items-start">
                    <div>
                      <label htmlFor="demo-phone" className="sr-only">
                        {d.sms.phoneLabel}
                      </label>
                      <PhoneField
                        id="demo-phone"
                        value={phone}
                        onChange={setPhone}
                        placeholder="87 123 4567"
                        ariaLabel={d.sms.phoneLabel}
                      />
                    </div>
                    <button
                      type="button"
                      onClick={sendText}
                      disabled={smsState === "sending"}
                      className="btn-primary whitespace-nowrap disabled:opacity-70"
                    >
                      {smsState === "sending" ? "Sending..." : d.sms.sendLabel}
                    </button>
                  </div>

                  <label className="mt-3 flex items-start gap-2.5 text-xs leading-relaxed text-stone-600">
                    <input
                      type="checkbox"
                      checked={consent}
                      onChange={(e) => setConsent(e.target.checked)}
                      className="mt-0.5 h-4 w-4 shrink-0 rounded border-stone-400 text-accent-600 focus:ring-accent/40"
                    />
                    <span>{d.sms.consentLabel}</span>
                  </label>

                  {smsMsg && (
                    <p
                      className={`mt-2 text-sm ${smsState === "error" ? "text-red-600" : "text-stone-600"}`}
                      role="alert"
                    >
                      {smsMsg}
                    </p>
                  )}
                </div>
              )}
            </div>
          </div>
        )}

        <VoiceCall enabled={voiceEnabled} />
      </div>
    </section>
  );
}

function SpeedBadge({ phase, timer, target }: { phase: Phase; timer: number; target: number }) {
  if (phase === "idle" || phase === "loading") {
    return (
      <span className="rounded-full border border-white/15 px-3 py-1 text-xs font-bold text-stone-400">
        live speed
      </span>
    );
  }
  const value = phase === "done" ? target : timer;
  return (
    <span className="inline-flex items-center rounded-full bg-accent px-3 py-1 text-xs font-extrabold tabular-nums text-paper">
      {value.toFixed(phase === "done" ? 0 : 1)}s
    </span>
  );
}

function Dots() {
  return (
    <span className="inline-flex gap-1.5" aria-hidden="true">
      <span className="h-2 w-2 animate-pulse rounded-full bg-stone-400 [animation-delay:-0.3s]" />
      <span className="h-2 w-2 animate-pulse rounded-full bg-stone-400 [animation-delay:-0.15s]" />
      <span className="h-2 w-2 animate-pulse rounded-full bg-stone-400" />
    </span>
  );
}

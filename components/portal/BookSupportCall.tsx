"use client";

import { useEffect, useState, type FormEvent } from "react";
import Cal, { getCalApi } from "@calcom/embed-react";
import { site } from "@/config/site";
import { night } from "@/components/portal/night";

/**
 * Book a call from the portal: what it's about first, then the calendar.
 *
 * The reason is required so we come prepared. It goes into the Cal.com booking
 * itself (as the booking's notes, with the topic in front), so it reaches the
 * calendar invite and nothing else has to store it. Name and email are
 * pre-filled from the client file and stay editable in Cal's own form.
 *
 * Receives the contact's name and email only, which the client already knows.
 */

const TOPICS = [
  "Something looks wrong",
  "A finding or a decision",
  "A report deadline",
  "Firmware or a new product version",
  "Billing",
  "Something else",
] as const;

const MIN_REASON = 15;

export function BookSupportCall({ name, email }: { name: string; email?: string }) {
  const [topic, setTopic] = useState<string>("");
  const [reason, setReason] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [ready, setReady] = useState(false);
  const calLink = site.calcom.link;
  const calOrigin = site.calcom.origin;
  const embedJsUrl = `${calOrigin}/embed/embed.js`;

  useEffect(() => {
    if (!ready) return;
    (async () => {
      const cal = await getCalApi({ embedJsUrl });
      cal("ui", {
        theme: "dark",
        hideEventTypeDetails: false,
        cssVarsPerTheme: { light: { "cal-brand": "#07182A" }, dark: { "cal-brand": "#6FD6A8" } },
        layout: "month_view",
      });
    })();
  }, [ready, embedJsUrl]);

  function next(e: FormEvent) {
    e.preventDefault();
    if (!topic) return setError("Choose what the call is about.");
    if (reason.trim().length < MIN_REASON) return setError("Tell us a little more, so we can prepare.");
    setError(null);
    setReady(true);
  }

  if (ready) {
    return (
      <div className="space-y-4">
        <div className={`${night.panel} flex flex-wrap items-start justify-between gap-3 px-5 py-4 sm:px-6`}>
          <div className="min-w-0">
            <p className={night.label}>{topic}</p>
            <p className="mt-1 whitespace-pre-wrap text-[0.86rem] text-night-text">{reason.trim()}</p>
          </div>
          <button type="button" onClick={() => setReady(false)} className={night.btn}>
            Edit
          </button>
        </div>
        <div className={`${night.panel} overflow-hidden`}>
          <Cal
            calLink={calLink}
            calOrigin={calOrigin}
            embedJsUrl={embedJsUrl}
            style={{ width: "100%", height: "100%", minHeight: "640px", overflow: "scroll" }}
            config={{
              layout: "month_view",
              theme: "dark",
              name,
              ...(email ? { email } : {}),
              notes: `${topic}: ${reason.trim()}`,
            }}
          />
        </div>
      </div>
    );
  }

  return (
    <form onSubmit={next} className={`${night.panel} space-y-5 px-5 py-5 sm:px-6`} noValidate>
      <fieldset>
        <legend className="text-[0.86rem] text-night-text">What is the call about?</legend>
        <div className="mt-3 grid gap-2 sm:grid-cols-2">
          {TOPICS.map((t) => (
            <label
              key={t}
              className={`flex cursor-pointer items-center gap-3 rounded-lg border px-3.5 py-3 text-[0.86rem] transition-colors ${
                topic === t ? "border-signal-mint/60 bg-signal-mint/[0.07] text-night-text" : "border-night-line text-night-dim hover:border-night-edge"
              }`}
            >
              <input
                type="radio"
                name="topic"
                value={t}
                checked={topic === t}
                onChange={() => setTopic(t)}
                className="h-4 w-4 accent-[#6FD6A8]"
              />
              {t}
            </label>
          ))}
        </div>
      </fieldset>

      <div>
        <label htmlFor="reason" className="block text-[0.86rem] text-night-text">
          What do you want to cover?
        </label>
        <p id="reason-hint" className="mt-1 text-[0.8rem] text-night-mute">
          A CVE number, a product version or what you saw helps us come prepared.
        </p>
        <textarea
          id="reason"
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          rows={4}
          maxLength={1000}
          aria-describedby="reason-hint"
          className="mt-2.5 w-full resize-y rounded-lg border border-night-edge bg-night-raised px-3.5 py-3 text-[0.9rem] text-night-text outline-none placeholder:text-night-faint focus:border-signal-mint focus:ring-2 focus:ring-signal-mint/25"
          placeholder="e.g. The gateway 1.9 finding says affected, but we disabled httpd last month."
        />
      </div>

      {error && (
        <p role="alert" className="text-sm text-signal-orange">
          {error}
        </p>
      )}

      <button type="submit" className={night.btnPrimary}>
        Choose a time
      </button>
    </form>
  );
}

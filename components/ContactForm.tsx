"use client";

import { useState } from "react";
import dynamic from "next/dynamic";
import { site } from "@/config/site";
import { SectionHead } from "@/components/SectionHead";

const PhoneField = dynamic(
  () => import("@/components/PhoneField").then((m) => m.PhoneField),
  {
    ssr: false,
    loading: () => (
      <div className="h-[46px] w-full rounded-xl border border-stone-300 bg-white" />
    ),
  }
);

type State = "idle" | "sending" | "done" | "error";

export function ContactForm() {
  const c = site.contact;
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [message, setMessage] = useState("");
  const [consent, setConsent] = useState(false);
  const [state, setState] = useState<State>("idle");
  const [texted, setTexted] = useState(true);
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (!consent) {
      setError("Please tick the box so we can text you back.");
      setState("error");
      return;
    }
    setState("sending");
    try {
      const res = await fetch("/api/contact", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          name: name.trim(),
          phone: phone.trim(),
          message: message.trim(),
          consent,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Something went wrong. Please try again.");
        setState("error");
        return;
      }
      setTexted(data.texted !== false);
      setState("done");
    } catch {
      setError("Could not reach the server. Please try again.");
      setState("error");
    }
  }

  return (
    <section id="contact" className="section bg-paper-alt py-24 sm:py-32">
      <div className="container-px">
        <div className="mx-auto grid max-w-5xl gap-10 lg:grid-cols-2 lg:items-center">
          <div>
            <SectionHead size="lg" title={c.headline} lead={c.subhead} />
            <p className="mt-7 text-[0.95rem] font-semibold text-accent-700">
              A real reply, from a real number, in seconds.
            </p>
          </div>

          <div className="rounded-xl2 border border-stone-200 bg-paper p-6 shadow-card sm:p-8">
            {state === "done" ? (
              <div className="py-6 text-center">
                <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-accent">
                  <svg width="28" height="28" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                    <path d="M5 13l4 4L19 7" stroke="#0E1526" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </div>
                <p className="mt-4 font-display text-xl font-bold text-ink">
                  {texted ? c.success : c.successNoText}
                </p>
              </div>
            ) : (
              <form onSubmit={onSubmit} noValidate>
                <div className="grid gap-4">
                  <div>
                    <label htmlFor="c-name" className="mb-1.5 block text-sm font-semibold text-ink">
                      {c.nameLabel}
                    </label>
                    <input
                      id="c-name"
                      type="text"
                      required
                      autoComplete="name"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className="w-full rounded-xl border border-stone-300 bg-white px-4 py-3 text-sm text-ink placeholder:text-stone-500 focus:border-accent-600 focus:outline-none focus:ring-2 focus:ring-accent/40"
                    />
                  </div>
                  <div>
                    <label htmlFor="c-phone" className="mb-1.5 block text-sm font-semibold text-ink">
                      {c.phoneLabel}
                    </label>
                    <PhoneField
                      id="c-phone"
                      value={phone}
                      onChange={setPhone}
                      placeholder="87 123 4567"
                      ariaLabel={c.phoneLabel}
                    />
                  </div>
                  <div>
                    <label htmlFor="c-message" className="mb-1.5 block text-sm font-semibold text-ink">
                      {c.messageLabel}
                    </label>
                    <textarea
                      id="c-message"
                      required
                      rows={3}
                      maxLength={500}
                      value={message}
                      onChange={(e) => setMessage(e.target.value)}
                      placeholder={c.messagePlaceholder}
                      className="w-full resize-none rounded-xl border border-stone-300 bg-white px-4 py-3 text-sm text-ink placeholder:text-stone-500 focus:border-accent-600 focus:outline-none focus:ring-2 focus:ring-accent/40"
                    />
                  </div>
                </div>

                <label className="mt-4 flex items-start gap-2.5 text-xs leading-relaxed text-stone-600">
                  <input
                    type="checkbox"
                    checked={consent}
                    onChange={(e) => setConsent(e.target.checked)}
                    className="mt-0.5 h-4 w-4 shrink-0 rounded border-stone-400 text-accent-600 focus:ring-accent/40"
                  />
                  <span>{c.consentLabel}</span>
                </label>

                <button
                  type="submit"
                  disabled={state === "sending"}
                  className="btn-primary mt-4 w-full disabled:opacity-70"
                >
                  {state === "sending" ? "Sending..." : c.submitLabel}
                </button>

                {error && (
                  <p className="mt-3 text-sm text-red-600" role="alert">
                    {error}
                  </p>
                )}
                <p className="mt-3 text-xs leading-relaxed text-stone-500">{c.consentNote}</p>
              </form>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}

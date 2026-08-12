"use client";

import { useState } from "react";

export function UnsubscribeForm({ email: initialEmail }: { email: string }) {
  const [email, setEmail] = useState(initialEmail);
  const [status, setStatus] = useState<"idle" | "loading" | "done" | "error">("idle");
  const [error, setError] = useState<string | null>(null);

  async function handleConfirm() {
    setStatus("loading");
    setError(null);
    try {
      const res = await fetch("/api/unsubscribe", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(data.error || "Something went wrong. Please try again.");
        setStatus("error");
        return;
      }
      setStatus("done");
    } catch {
      setError("Something went wrong. Please try again.");
      setStatus("error");
    }
  }

  if (status === "done") {
    return (
      <div className="mt-8 rounded-xl2 border border-accent-300 bg-accent-soft px-6 py-5">
        <p className="font-medium text-ink">You&rsquo;re unsubscribed.</p>
        <p className="mt-1 text-sm text-stone-600">
          {email} will not receive any further emails from us.
        </p>
      </div>
    );
  }

  return (
    <div className="mt-8">
      <label htmlFor="unsub-email" className="text-sm font-medium text-ink">
        Your email address
      </label>
      <input
        id="unsub-email"
        type="email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        placeholder="you@yourbusiness.ie"
        className="mt-2 w-full rounded-lg border border-stone-300 bg-white px-4 py-3 text-ink outline-none ring-accent-500 focus:ring-2"
      />

      {status === "error" && error && (
        <p className="mt-3 text-sm text-red-700">{error}</p>
      )}

      <button
        type="button"
        onClick={handleConfirm}
        disabled={status === "loading" || !email}
        className="mt-4 inline-flex items-center justify-center rounded-lg bg-ink px-6 py-3 text-sm font-semibold text-paper transition hover:bg-ink-700 disabled:opacity-50"
      >
        {status === "loading" ? "Unsubscribing..." : "Confirm unsubscribe"}
      </button>
      <p className="mt-3 text-xs text-stone-500">
        This stops all future emails from this address. It does not affect any
        text messages you may have consented to separately.
      </p>
    </div>
  );
}

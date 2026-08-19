"use client";

/**
 * Save-as-PDF affordance. A client component purely because it needs
 * window.print(); it receives no props, so no client data crosses the
 * server/client boundary here.
 */
export function PrintButton() {
  return (
    <button type="button" onClick={() => window.print()} className="btn-secondary text-sm">
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true">
        <path
          d="M6 9V3h12v6M6 18H4v-6h16v6h-2M8 14h8v7H8z"
          stroke="currentColor"
          strokeWidth="1.8"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
      Save as PDF
    </button>
  );
}

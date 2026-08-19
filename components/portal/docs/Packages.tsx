import type { Client, PackagesDoc } from "@/content/clients/types";
import { DocShell, DocSection, DocText } from "@/components/portal/DocShell";
import { documents } from "@/config/documents";
import { formatPriceOrPlaceholder } from "@/lib/portal/format";

/**
 * Ongoing support tiers.
 *
 * An unset price renders as a bracketed blank rather than a confident
 * "EUR 0.00", which a client reads as free. See formatPriceOrPlaceholder.
 */
export function Packages({ client, payload }: { client: Client; payload: PackagesDoc }) {
  const tiers = payload.tiers ?? documents.packageTiers;
  const unpriced = tiers.some((t) => t.monthlyPrice === 0);

  return (
    <DocShell
      docType="Services & Packages"
      subtitle="Ongoing support"
      clientName={client.business.name}
    >
      <DocText>
        {payload.intro ??
          "Once your systems are live, most clients move onto an ongoing arrangement so somebody is watching them. Here is what each level covers. If none of them fits how you work, say so and we will quote what does."}
      </DocText>

      <DocSection title="Choose your package">
        <div className="grid gap-4 sm:grid-cols-3">
          {tiers.map((tier) => (
            <div
              key={tier.name}
              className={`flex break-inside-avoid flex-col rounded-xl border p-5 ${
                tier.highlighted
                  ? "border-accent bg-accent-soft/50 print:bg-transparent"
                  : "border-stone-200 bg-white"
              }`}
            >
              {tier.highlighted && (
                <p className="mb-2 text-[0.6rem] font-semibold uppercase tracking-[0.14em] text-accent-700">
                  Most popular
                </p>
              )}
              <h3 className="font-display text-lg font-bold text-ink">{tier.name}</h3>
              <p className="mt-2 font-display text-2xl font-bold text-ink">
                {formatPriceOrPlaceholder(tier.monthlyPrice, client.currency)}
                <span className="ml-1 text-xs font-medium text-stone-500">/month</span>
              </p>
              <p className="mt-3 text-[0.82rem] leading-relaxed text-stone-500">
                {tier.suitedTo}
              </p>
              <ul className="mt-4 space-y-2 border-t border-stone-200 pt-4">
                {tier.includes.map((item) => (
                  <li
                    key={item}
                    className="flex gap-2.5 text-[0.85rem] leading-snug text-stone-600"
                  >
                    <svg
                      width="14"
                      height="14"
                      viewBox="0 0 24 24"
                      fill="none"
                      aria-hidden="true"
                      className="mt-[0.2em] shrink-0 text-accent"
                    >
                      <path
                        d="M20 6L9 17l-5-5"
                        stroke="currentColor"
                        strokeWidth="2.5"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {unpriced && (
          <p className="mt-4 text-xs leading-relaxed text-stone-500">
            Prices shown in brackets have not been set for your account yet. Ask us and we
            will confirm them in writing before anything is invoiced.
          </p>
        )}
      </DocSection>

      <DocSection title="The small print">
        <DocText>
          Packages are month to month with 30 days notice, not annual lock-ins. Third party
          costs such as your phone number, booking calendar and enquiry records are billed
          to your own accounts, so you keep them if we ever part ways. Moving up or down a
          level takes effect from your next billing month.
        </DocText>
      </DocSection>
    </DocShell>
  );
}

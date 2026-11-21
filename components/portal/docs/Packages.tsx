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
  const unpriced = tiers.some((t) => t.price === 0 && !t.priceLabel);

  return (
    <DocShell
      docType="Services and packages"
      subtitle="Ongoing support"
      clientName={client.business.name}
    >
      <DocText>
        {payload.intro ??
          "Prices are per product family, a group of products that share most of their software. Here is what each option covers. If none of them fits how you work, say so and we will quote what does."}
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
              {tier.highlighted && tier.badge && (
                <p className="mb-2 text-xs font-semibold text-accent-700">
                  {tier.badge}
                </p>
              )}
              <h3 className="font-display text-lg font-semibold text-ink">{tier.name}</h3>
              <p className="mt-2 font-display text-2xl font-semibold text-ink">
                {tier.priceLabel ?? (
                  <>
                    {formatPriceOrPlaceholder(tier.price, client.currency)}
                    <span className="ml-1 text-xs font-medium text-stone-500">
                      {tier.per === "one-off" ? "one-off" : "/month"}
                    </span>
                  </>
                )}
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
        <DocText>{documents.packagesSmallPrint}</DocText>
      </DocSection>
    </DocShell>
  );
}

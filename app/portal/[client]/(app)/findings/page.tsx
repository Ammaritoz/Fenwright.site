import { notFound } from "next/navigation";
import { getClient } from "@/content/clients";
import type { DashboardData, FindingStatus } from "@/content/clients/types";
import { getDashboard } from "@/lib/portal/dashboard";
import { formatAgoShort, formatDateTime } from "@/lib/portal/format";
import { colorForProduct, productColor, productLabel } from "@/lib/portal/product-colors";
import { DataUnavailable } from "@/components/portal/dashboard/Widgets";
import { night } from "@/components/portal/night";

/**
 * Every open or notable finding, with the written reason behind each
 * decision. Reviewed "not affected" matches that are not on an exploited list
 * are summarised in the count rather than listed (dashboard.py does that
 * filtering), so this page stays about what matters.
 *
 * A table of <details> rows: each opens in place to show the reasoning with
 * no JavaScript, and #CVE links from the dashboard land on the right row.
 */

const STATUS: Record<FindingStatus, { label: string; dot: string; text: string }> = {
  affected: { label: "Affected", dot: "bg-signal-orange", text: "text-night-text" },
  under_investigation: { label: "Being checked", dot: "bg-signal-blue", text: "text-night-text" },
  unassessed: { label: "Queued", dot: "bg-signal-violet", text: "text-night-text" },
  not_affected: { label: "Not affected", dot: "bg-signal-clear", text: "text-night-dim" },
};

const COLS = "grid grid-cols-[10.5rem_minmax(12rem,1.6fr)_7rem_6rem_9rem_3.5rem_1rem] items-center gap-4";

function Products({ data }: { data: DashboardData }) {
  return (
    <section aria-label="Products in scope" className={`${night.panel} grid sm:grid-cols-2 lg:grid-cols-3`}>
      {data.products.map((p, i) => (
        <div
          key={productLabel(p)}
          className="border-night-line px-5 py-4 sm:px-6 [&:not(:last-child)]:border-b sm:[&:not(:last-child)]:border-b-0 sm:[&:not(:last-child)]:border-r"
        >
          <p className="flex items-center gap-2 text-[0.86rem] text-night-text">
            <span aria-hidden="true" className="h-[7px] w-[7px] rounded-full" style={{ background: productColor(i) }} />
            {p.name} <span className="text-night-mute">{p.version}</span>
          </p>
          <p className="mt-1.5 font-mono text-[0.72rem] text-night-mute">
            {p.components.toLocaleString("en-IE")} components · scanned {formatDateTime(p.lastScanned)}
          </p>
        </div>
      ))}
    </section>
  );
}

/** Matches that are not closed as "not affected". */
function openCount(data: DashboardData): number {
  return Math.max(0, data.totals.matches - data.totals.notAffected);
}

/**
 * The pipeline caps the findings list (most serious first). Say so, rather than
 * let a client think the list is everything that is open.
 */
function hiddenCount(data: DashboardData): number {
  return Math.max(0, openCount(data) - data.findings.length);
}

export default async function FindingsPage({ params }: { params: { client: string } }) {
  const client = getClient(params.client);
  if (!client) notFound();

  const result = await getDashboard(client.slug);
  const now = new Date();

  return (
    <div className="mx-auto max-w-[76rem]">
      <header className="mb-7">
        <div className="flex flex-wrap items-end justify-between gap-x-6 gap-y-2">
          <h1 className={night.h1}>Findings</h1>
          {result.ok && (
            <p className="font-mono text-[0.75rem] text-night-mute">
              {result.data.totals.components.toLocaleString("en-IE")} components ·{" "}
              {result.data.totals.matches.toLocaleString("en-IE")} matches to date
            </p>
          )}
        </div>
        <p className="mt-3 max-w-2xl text-[0.86rem] leading-relaxed text-night-dim">
          Each vulnerability that matched a component in your products, what we decided, and why. You approve and
          submit any report; we never file on your behalf.
        </p>
      </header>

      {!result.ok ? (
        <DataUnavailable reason={result.reason} />
      ) : (
        <div className="space-y-4">
          <section className={`${night.panel} overflow-hidden`} aria-labelledby="findings-title">
            <div className="flex flex-wrap items-baseline justify-between gap-2 px-5 pb-3 pt-4 sm:px-6">
              <h2 id="findings-title" className={night.h2}>
                Open and notable
              </h2>
              <span className="font-mono text-[0.75rem] text-night-mute">
                {result.data.findings.length.toLocaleString("en-IE")}
                {hiddenCount(result.data) > 0 ? ` of ${openCount(result.data).toLocaleString("en-IE")}` : ""}
              </span>
            </div>

            {result.data.findings.length === 0 ? (
              <p className="border-t border-night-rule px-5 py-5 text-[0.84rem] text-night-mute sm:px-6">No open findings.</p>
            ) : (
              <div className="overflow-x-auto">
                <div className="min-w-[56rem]">
                  <div
                    aria-hidden="true"
                    className={`${COLS} border-t border-night-rule px-5 py-2.5 text-[0.75rem] text-night-mute sm:px-6`}
                  >
                    <span>CVE</span>
                    <span>Component</span>
                    <span>CVSS</span>
                    <span>Exploited</span>
                    <span>Status</span>
                    <span className="text-right">Decided</span>
                    <span />
                  </div>
                  <ul>
                    {result.data.findings.map((f) => {
                      const st = STATUS[f.status];
                      const dot = colorForProduct(result.data, f.product);
                      return (
                        <li key={`${f.cve}-${f.component}-${f.product}`} id={f.cve} className="scroll-mt-24 border-t border-night-rule">
                          <details className="group open:bg-night-raised/50">
                            <summary
                              className={`${COLS} cursor-pointer list-none px-5 py-3.5 hover:bg-night-raised/40 sm:px-6 [&::-webkit-details-marker]:hidden`}
                            >
                              <span className="font-mono text-[0.82rem] text-night-text">{f.cve}</span>
                              <span className="min-w-0 truncate text-[0.86rem] text-night-text">
                                {f.component}
                                <span className="ml-2 inline-flex items-center gap-1.5 text-night-mute">
                                  {dot && <span aria-hidden="true" className="h-1.5 w-1.5 rounded-full" style={{ background: dot }} />}
                                  {f.product}
                                </span>
                              </span>
                              <span className="flex items-center gap-2">
                                <span className="font-mono text-[0.78rem] text-night-text">
                                  <span className="sr-only">CVSS </span>
                                  {f.cvss === null ? "–" : f.cvss.toFixed(1)}
                                </span>
                                {f.cvss !== null && (
                                  <span aria-hidden="true" className="h-[3px] flex-1 overflow-hidden rounded-full bg-night-edge">
                                    <span className="block h-full bg-night-dim" style={{ width: `${Math.min(100, f.cvss * 10)}%` }} />
                                  </span>
                                )}
                              </span>
                              <span className={`font-mono text-[0.72rem] ${f.exploited ? "text-signal-amber" : "text-night-faint"}`}>
                                {f.exploited ? "Exploited" : <span aria-label="Not on an exploited list">–</span>}
                              </span>
                              <span className={`inline-flex items-center gap-2 text-[0.82rem] ${st.text}`}>
                                <span aria-hidden="true" className={`h-2 w-2 rounded-sm ${st.dot}`} />
                                {st.label}
                              </span>
                              <span className="text-right font-mono text-[0.72rem] text-night-mute">
                                {f.decidedAt ? formatAgoShort(f.decidedAt, now) : "–"}
                              </span>
                              <svg
                                width="16"
                                height="16"
                                viewBox="0 0 24 24"
                                fill="none"
                                aria-hidden="true"
                                className="text-night-faint transition-transform group-open:rotate-180"
                              >
                                <path d="M6 9l6 6 6-6" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                              </svg>
                            </summary>
                            <div className="grid gap-6 px-5 pb-5 pt-1 sm:px-6 md:grid-cols-[minmax(0,2fr)_minmax(14rem,1fr)] md:pl-[13.5rem]">
                              <div>
                                <p className={night.label}>Why</p>
                                <p className="mt-2 text-[0.88rem] leading-relaxed text-night-text/90">
                                  {f.reasoning ??
                                    (f.justification ? f.justification.replace(/_/g, " ") : "Not assessed yet. It is in the queue.")}
                                </p>
                              </div>
                              <dl className="grid grid-cols-[auto_1fr] content-start gap-x-4 gap-y-2 text-[0.8rem]">
                                <dt className="text-night-mute">Review</dt>
                                <dd>{f.reviewed ? "Reviewed by us" : "Draft, awaiting our review"}</dd>
                                {f.decidedAt && (
                                  <>
                                    <dt className="text-night-mute">Decided</dt>
                                    <dd className="font-mono">{formatDateTime(f.decidedAt)}</dd>
                                  </>
                                )}
                                {f.justification && (
                                  <>
                                    <dt className="text-night-mute">VEX reason</dt>
                                    <dd className="font-mono text-[0.75rem]">{f.justification}</dd>
                                  </>
                                )}
                              </dl>
                            </div>
                          </details>
                        </li>
                      );
                    })}
                  </ul>
                </div>
              </div>
            )}

            <div className="flex flex-wrap items-center justify-between gap-2 border-t border-night-rule px-5 py-3.5 text-[0.8rem] text-night-mute sm:px-6">
              <span>
                {result.data.totals.notAffected.toLocaleString("en-IE")} more matches checked and closed as not affecting your
                products.
              </span>
              {hiddenCount(result.data) > 0 && (
                <span>{hiddenCount(result.data).toLocaleString("en-IE")} more open ones appear here as we work through them.</span>
              )}
            </div>
          </section>

          {result.data.products.length > 0 && <Products data={result.data} />}
        </div>
      )}
    </div>
  );
}

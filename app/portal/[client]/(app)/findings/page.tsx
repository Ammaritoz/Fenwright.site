import { notFound } from "next/navigation";
import { getClient } from "@/content/clients";
import type { DashboardData, FindingStatus } from "@/content/clients/types";
import { getDashboard } from "@/lib/portal/dashboard";
import { formatDateTime } from "@/lib/portal/format";
import { Card, DataUnavailable } from "@/components/portal/dashboard/Widgets";

/**
 * Every open or notable finding, with the written reason behind each
 * decision. Reviewed "not affected" matches that are not on an exploited list
 * are summarised in the count rather than listed (dashboard.py does that
 * filtering), so this page stays about what matters.
 */

const STATUS: Record<FindingStatus, { label: string; tone: string; icon: string }> = {
  affected: {
    label: "Affected",
    tone: "bg-red-50 text-red-800 ring-red-200",
    icon: "M12 8v5m0 3.5v.01M10.3 3.9L2.6 17.5A2 2 0 004.3 20.5h15.4a2 2 0 001.7-3L13.7 3.9a2 2 0 00-3.4 0z",
  },
  under_investigation: {
    label: "Being checked",
    tone: "bg-amber-50 text-amber-900 ring-amber-200",
    icon: "M11 4a7 7 0 105.2 11.7L20 19.5M11 4a7 7 0 017 7",
  },
  unassessed: {
    label: "Queued",
    tone: "bg-stone-100 text-stone-600 ring-stone-200",
    icon: "M12 7.5V12l3 2M12 21a9 9 0 110-18 9 9 0 010 18z",
  },
  not_affected: {
    label: "Not affected",
    tone: "bg-accent-soft text-accent-700 ring-accent/20",
    icon: "M5 12.5l4.5 4.5L19 7.5",
  },
};

function StatusBadge({ status }: { status: FindingStatus }) {
  const s = STATUS[status];
  return (
    <span className={`inline-flex items-center gap-1.5 whitespace-nowrap rounded-full px-2.5 py-1 text-[0.72rem] font-semibold ring-1 ${s.tone}`}>
      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" aria-hidden="true">
        <path d={s.icon} stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
      {s.label}
    </span>
  );
}

function Products({ data }: { data: DashboardData }) {
  return (
    <Card title="Products in scope">
      <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {data.products.map((p) => (
          <li key={`${p.name}-${p.version}`} className="rounded-xl border border-stone-200 px-4 py-3">
            <p className="font-semibold text-ink">
              {p.name} <span className="font-normal text-stone-500">{p.version}</span>
            </p>
            <p className="mt-1 text-xs text-stone-500">
              {p.components.toLocaleString("en-IE")} components · scanned {formatDateTime(p.lastScanned)}
            </p>
          </li>
        ))}
      </ul>
    </Card>
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

  return (
    <div className="mx-auto max-w-6xl py-2 sm:py-4">
      <header className="mb-8">
        <p className="text-sm text-stone-500">{client.business.name}</p>
        <h1 className="mt-2 font-display text-[2rem] font-semibold leading-[1.05] text-ink sm:text-[2.4rem]">Findings</h1>
        <p className="mt-3 max-w-2xl text-stone-600">
          Each vulnerability that matched a component in your products, what we decided, and why. You approve
          and submit any report; we never file on your behalf.
        </p>
      </header>

      {!result.ok ? (
        <DataUnavailable reason={result.reason} />
      ) : (
        <div className="space-y-5">
          <Products data={result.data} />
          <Card
            title={`Open and notable (${result.data.findings.length.toLocaleString("en-IE")}${
              hiddenCount(result.data) > 0 ? ` of ${openCount(result.data).toLocaleString("en-IE")}` : ""
            })`}
          >
            <p className="-mt-1 mb-4 text-sm text-stone-500">
              {result.data.totals.notAffected.toLocaleString("en-IE")} further matches were checked and closed as not
              affecting your products.
            </p>
            {hiddenCount(result.data) > 0 && (
              <p className="-mt-2 mb-4 text-sm text-stone-500">
                This list shows the {result.data.findings.length.toLocaleString("en-IE")} most serious.{" "}
                {hiddenCount(result.data).toLocaleString("en-IE")} more are open and appear here as we work through them.
              </p>
            )}
            {result.data.findings.length === 0 ? (
              <p className="text-sm text-stone-500">No open findings.</p>
            ) : (
              <ul className="divide-y divide-stone-100">
                {result.data.findings.map((f) => (
                  <li key={`${f.cve}-${f.component}-${f.product}`} id={f.cve} className="scroll-mt-24 py-4">
                    <details className="group">
                      <summary className="flex cursor-pointer list-none flex-wrap items-center gap-x-4 gap-y-2 [&::-webkit-details-marker]:hidden">
                        <span className="min-w-0 flex-1">
                          <span className="flex flex-wrap items-center gap-2">
                            <span className="font-mono text-sm font-semibold text-ink">{f.cve}</span>
                            {f.exploited && (
                              <span className="rounded-full bg-ink px-2 py-0.5 text-xs font-semibold text-white">
                                Exploited
                              </span>
                            )}
                          </span>
                          <span className="mt-0.5 block text-sm text-stone-500">
                            {f.component} in {f.product}
                          </span>
                        </span>
                        <span className="text-xs tabular-nums text-stone-500">
                          CVSS {f.cvss === null ? "–" : f.cvss.toFixed(1)}
                        </span>
                        <StatusBadge status={f.status} />
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true" className="text-stone-400 transition-transform group-open:rotate-180">
                          <path d="M6 9l6 6 6-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                      </summary>
                      <div className="mt-3 rounded-xl bg-paper-alt px-4 py-3 text-sm leading-relaxed text-stone-600">
                        {f.justification && (
                          <p>
                            <span className="font-semibold text-ink">Reason: </span>
                            {f.justification.replace(/_/g, " ")}
                          </p>
                        )}
                        {f.reasoning ? (
                          <p className={f.justification ? "mt-2" : ""}>{f.reasoning}</p>
                        ) : (
                          !f.justification && <p>Not assessed yet. It is in the queue.</p>
                        )}
                        <p className="mt-2 text-xs text-stone-400">
                          {f.reviewed ? "Reviewed" : "Draft, awaiting our review"}
                          {f.decidedAt ? ` · ${formatDateTime(f.decidedAt)}` : ""}
                        </p>
                      </div>
                    </details>
                  </li>
                ))}
              </ul>
            )}
          </Card>
        </div>
      )}
    </div>
  );
}

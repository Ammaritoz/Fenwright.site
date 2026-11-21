import Link from "next/link";
import type { ReactNode } from "react";
import { PayNowForm } from "@/components/portal/PayNowForm";
import { MarkDoneForm } from "@/components/portal/MarkDoneForm";
import type { ActionItem } from "@/lib/portal/action-items";
import { stageLabel } from "@/lib/portal/action-items";
import type { DashboardData } from "@/content/clients/types";
import {
  formatAgo,
  formatDate,
  formatDateTime,
  formatDueIn,
  formatHours,
  isGoodChange,
  percentChange,
  type MetricDirection,
} from "@/lib/portal/format";

/**
 * Dashboard building blocks. All server components: they render once on the
 * server from data the page has already loaded, so nothing here ships client
 * data into the browser bundle.
 *
 * Visual rule: content cards are flat white with a hairline, as everywhere on
 * the site. Glass belongs to the shell only. Values use text ink; a status
 * colour always comes with an icon and a word, never on its own.
 */

export function Card({
  title,
  action,
  children,
  className = "",
}: {
  title?: string;
  action?: ReactNode;
  children: ReactNode;
  className?: string;
}) {
  return (
    <section className={`rounded-2xl border border-stone-200 bg-white p-5 shadow-card sm:p-6 ${className}`}>
      {(title || action) && (
        <div className="mb-4 flex items-center justify-between gap-3">
          {title && (
            <h2 className="text-sm font-medium text-stone-600">{title}</h2>
          )}
          {action}
        </div>
      )}
      {children}
    </section>
  );
}

// --- Status line under the page title ---------------------------------------

export function LiveStatus({ data, now }: { data: DashboardData | null; now: Date }) {
  if (!data) return null;
  return (
    <p className="flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-stone-500">
      <span className="inline-flex items-center gap-2 font-medium text-ink">
        <span className="relative flex h-2.5 w-2.5" aria-hidden="true">
          {data.monitoring && (
            <span className="absolute inset-0 animate-pulse-ring rounded-full bg-accent motion-reduce:hidden" />
          )}
          <span className={`relative h-2.5 w-2.5 rounded-full ${data.monitoring ? "bg-accent" : "bg-stone-300"}`} />
        </span>
        {data.monitoring ? "Monitoring live" : "Onboarding"}
      </span>
      <span aria-hidden="true" className="text-stone-300">
        ·
      </span>
      <span title={formatDateTime(data.generatedAt)}>Updated {formatAgo(data.generatedAt, now)}</span>
    </p>
  );
}

// --- Needs your attention ---------------------------------------------------

const KIND_ICON: Record<ActionItem["kind"], string> = {
  agreement: "M8 4h8l3 3v13H5V4h3zM8 12h8M8 16h5",
  invoice: "M6 3h12v18l-3-2-3 2-3-2-3 2V3zM9 8h6M9 12h6",
  upload: "M12 16V4m0 0l-4 4m4-4l4 4M5 16v3h14v-3",
  report: "M12 3l7.5 3v5.5c0 4.4-3.1 8.2-7.5 9.5-4.4-1.3-7.5-5.1-7.5-9.5V6L12 3zM12 8v4m0 3.5v.01",
  question: "M9.5 9a2.5 2.5 0 115 .5c0 1.5-2.5 2-2.5 3.5M12 17v.01M12 21a9 9 0 110-18 9 9 0 010 18z",
};

function UrgencyBadge({ item, now }: { item: ActionItem; now: Date }) {
  if (!item.due) return null;
  const isDate = /^\d{4}-\d{2}-\d{2}$/.test(item.due);
  const label =
    item.urgency === "overdue"
      ? "Overdue"
      : isDate
        ? `Due ${formatDate(item.due)}`
        : `Due ${formatDueIn(item.due, now)}`;
  const tone =
    item.urgency === "overdue"
      ? "bg-red-50 text-red-800 ring-red-200"
      : item.urgency === "soon"
        ? "bg-amber-50 text-amber-900 ring-amber-200"
        : "bg-stone-100 text-stone-600 ring-stone-200";
  return (
    <span className={`inline-flex shrink-0 items-center gap-1.5 rounded-full px-2.5 py-1 text-[0.72rem] font-semibold ring-1 ${tone}`}>
      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" aria-hidden="true">
        <circle cx="12" cy="12" r="8.5" stroke="currentColor" strokeWidth="2" />
        <path d="M12 7.5V12l3 2" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      </svg>
      {label}
    </span>
  );
}

export function ActionItems({ items, now, slug }: { items: ActionItem[]; now: Date; slug: string }) {
  return (
    <Card title="Needs your attention">
      {items.length === 0 ? (
        <div className="flex items-center gap-3 rounded-xl bg-accent-soft/60 px-4 py-3.5 text-sm text-ink">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden="true" className="shrink-0 text-accent">
            <path d="M5 12.5l4.5 4.5L19 7.5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          Nothing needs you right now. We will email you when something does.
        </div>
      ) : (
        <ul className="divide-y divide-stone-100">
          {items.map((item) => {
            const inner = (
              <>
                <span className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-paper-alt text-ink ring-1 ring-stone-200">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                    <path d={KIND_ICON[item.kind]} stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block font-semibold text-ink group-hover:text-accent-700">
                    {item.title}
                    {item.external && <span className="sr-only"> (opens in a new tab)</span>}
                  </span>
                  <span className="mt-0.5 block text-sm leading-relaxed text-stone-500">{item.detail}</span>
                  {/* On a phone the badge sits under the text rather than squeezing it. */}
                  {item.due && (
                    <span className="mt-2 block sm:hidden">
                      <UrgencyBadge item={item} now={now} />
                    </span>
                  )}
                </span>
                <span aria-hidden="true" className="hidden shrink-0 items-center gap-2 sm:flex">
                  <UrgencyBadge item={item} now={now} />
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true" className="text-stone-300 transition-[color,transform] group-hover:translate-x-0.5 group-hover:text-accent">
                    <path d="M9 6l6 6-6 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </span>
              </>
            );
            const cls = "group -mx-2 flex items-start gap-4 rounded-xl px-2 py-3.5 transition-colors hover:bg-paper-alt/70";
            if (item.completable) {
              // The row is a link, and a button cannot live inside a link, so the
              // link and the "Mark as done" button sit side by side.
              return (
                <li key={item.id} className="-mx-2 flex flex-wrap items-start gap-x-3 gap-y-2 rounded-xl px-2 py-3.5 transition-colors hover:bg-paper-alt/70">
                  <Link href={item.href} className="group flex min-w-0 flex-1 basis-72 items-start gap-4">
                    {inner}
                  </Link>
                  <div className="pl-[3.25rem] sm:pl-0 sm:pt-0.5">
                    <MarkDoneForm slug={slug} itemId={item.id} />
                  </div>
                </li>
              );
            }
            return (
              <li key={item.id}>
                {item.external ? (
                  <a href={item.href} target="_blank" rel="noopener noreferrer" className={cls}>
                    {inner}
                  </a>
                ) : (
                  <Link href={item.href} className={cls}>
                    {inner}
                  </Link>
                )}
              </li>
            );
          })}
        </ul>
      )}
    </Card>
  );
}

// --- KPI tiles --------------------------------------------------------------

function Change({
  current,
  previous,
  direction,
}: {
  current: number | null;
  previous: number | null | undefined;
  direction: MetricDirection | "neutral";
}) {
  if (current === null || previous === null || previous === undefined) {
    return <span className="text-xs text-stone-400">No earlier month to compare</span>;
  }
  const change = percentChange(current, previous);
  if (change === null || change === 0) {
    return <span className="text-xs text-stone-500">{change === 0 ? "Same as last month" : "New this month"}</span>;
  }
  const good = direction === "neutral" ? null : isGoodChange(change, direction);
  const tone = good === null ? "text-stone-500" : good ? "text-accent-700" : "text-red-700";
  return (
    <span className={`inline-flex items-center gap-1 text-xs font-medium ${tone}`}>
      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" aria-hidden="true">
        <path
          d={change > 0 ? "M12 19V5m0 0l-6 6m6-6l6 6" : "M12 5v14m0 0l-6-6m6 6l6-6"}
          stroke="currentColor"
          strokeWidth="2.2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
      {Math.abs(change)}% {change > 0 ? "up" : "down"} on last month
    </span>
  );
}

function Tile({ label, value, sub, foot }: { label: string; value: string; sub?: string; foot: ReactNode }) {
  return (
    <div className="flex flex-col rounded-2xl border border-stone-200 bg-white p-5 shadow-card">
      <p className="text-sm font-medium text-stone-600">{label}</p>
      <p className="mt-3 font-display text-[2rem] font-semibold leading-none tabular-nums text-ink">{value}</p>
      {sub && <p className="mt-1.5 text-xs text-stone-500">{sub}</p>}
      <div className="mt-auto pt-4">{foot}</div>
    </div>
  );
}

export function KpiRow({ data }: { data: DashboardData }) {
  const m = data.monthly;
  const prev = m?.previous ?? null;
  const cur = m?.current;

  return (
    // Headline on its own row until there is room for all four side by side,
    // so the three supporting tiles never leave an orphan.
    <div className="grid gap-4 sm:grid-cols-3 xl:grid-cols-4">
      {/* The headline: the promise the service sells. Ink surface, mint figure. */}
      <div className="flex flex-col rounded-2xl bg-ink p-5 text-white sm:col-span-3 xl:col-span-1">
        <p className="text-sm font-medium text-white/70">
          Median time to assessment
        </p>
        <p className="mt-3 font-display text-[2.6rem] font-semibold leading-none tabular-nums text-accent-300">
          {formatHours(cur?.medianHoursToAssessment ?? null)}
        </p>
        <p className="mt-1.5 text-xs text-white/60">
          From a match appearing to a reviewed decision{m ? ", this month" : ""}
        </p>
        <div className="mt-auto pt-4 [&_span]:!text-white/70">
          <Change
            current={cur?.medianHoursToAssessment ?? null}
            previous={prev?.medianHoursToAssessment}
            direction="down-good"
          />
        </div>
      </div>

      <Tile
        label="Components monitored"
        value={(cur?.componentsMonitored ?? data.totals.components).toLocaleString("en-IE")}
        sub={`Across ${data.products.length} product ${data.products.length === 1 ? "version" : "versions"}`}
        foot={<Change current={cur?.componentsMonitored ?? null} previous={prev?.componentsMonitored} direction="neutral" />}
      />
      <Tile
        label={m ? "New matches this month" : "Matches to date"}
        value={(cur?.vulnerabilitiesMatched ?? data.totals.matches).toLocaleString("en-IE")}
        sub={`${data.totals.exploited} on an exploited list, all time`}
        foot={<Change current={cur?.vulnerabilitiesMatched ?? null} previous={prev?.vulnerabilitiesMatched} direction="neutral" />}
      />
      <Tile
        label="Decisions"
        value={`${cur?.assessedAffected ?? data.totals.affected} affected`}
        sub={`${cur?.assessedNotAffected ?? data.totals.notAffected} not affected${m ? ", this month" : ""}`}
        foot={
          <span className="text-xs text-stone-500">
            {data.totals.underInvestigation + data.totals.unassessed > 0
              ? `${data.totals.underInvestigation + data.totals.unassessed} still being checked`
              : "Every match has a decision"}
          </span>
        }
      />
    </div>
  );
}

// --- Engagement progress ----------------------------------------------------

export function EngagementProgress({
  steps,
  completed,
  live,
}: {
  steps: readonly { title: string }[];
  completed: number;
  live: boolean;
}) {
  const done = live ? steps.length : Math.max(0, Math.min(completed, steps.length));
  return (
    <Card title="Onboarding">
      <p className="mb-4 text-sm text-stone-500">
        {done >= steps.length ? "All done. Monitoring is live." : `Step ${done + 1} of ${steps.length}`}
      </p>
      <ol className="space-y-0">
        {steps.map((s, i) => {
          const state = i < done ? "done" : i === done ? "current" : "todo";
          return (
            <li key={s.title} className="relative flex gap-3 pb-4 last:pb-0">
              {i < steps.length - 1 && (
                <span
                  aria-hidden="true"
                  className={`absolute bottom-1 left-[11.5px] top-7 w-px ${i < done ? "bg-accent/50" : "bg-stone-200"}`}
                />
              )}
              <span
                className={`relative z-10 flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-[0.65rem] font-semibold ${
                  state === "done"
                    ? "bg-accent text-white"
                    : state === "current"
                      ? "bg-white text-accent-700 ring-2 ring-accent"
                      : "bg-white text-stone-400 ring-1 ring-stone-300"
                }`}
              >
                {state === "done" ? (
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                    <path d="M5 12.5l4.5 4.5L19 7.5" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                ) : (
                  i + 1
                )}
              </span>
              <span className={`text-sm leading-6 ${state === "todo" ? "text-stone-400" : "font-medium text-ink"}`}>
                {s.title}
                <span className="sr-only">
                  {state === "done" ? " (done)" : state === "current" ? " (in progress)" : " (to come)"}
                </span>
              </span>
            </li>
          );
        })}
      </ol>
    </Card>
  );
}

// --- Billing ----------------------------------------------------------------

export type BillingSummary = {
  number: string;
  amount: string;
  due: string;
  paid: boolean;
  href: string;
  payUrl?: string;
  /** For the in-portal "Pay online" button, shown when there is no hosted Stripe link. */
  slug: string;
  docSlug: string;
  canPayOnline: boolean;
} | null;

export function BillingCard({ invoice, documentsHref }: { invoice: BillingSummary; documentsHref: string }) {
  return (
    <Card
      title="Billing"
      action={
        <Link href={documentsHref} className="text-xs font-semibold text-accent-700 hover:underline">
          All documents
        </Link>
      }
    >
      {!invoice ? (
        <p className="text-sm text-stone-500">No invoices yet.</p>
      ) : (
        <div>
          <div className="flex items-baseline justify-between gap-3">
            <Link href={invoice.href} className="font-semibold text-ink hover:text-accent-700">
              {invoice.number}
            </Link>
            <span className="font-display text-xl font-semibold tabular-nums text-ink">{invoice.amount}</span>
          </div>
          <p className="mt-1 flex items-center gap-2 text-sm text-stone-500">
            {invoice.paid ? (
              <>
                <span aria-hidden="true" className="h-2 w-2 rounded-full bg-accent" />
                Paid, thank you
              </>
            ) : (
              <>Due {formatDate(invoice.due)}</>
            )}
          </p>
          {!invoice.paid && !invoice.payUrl && invoice.canPayOnline && (
            <div className="mt-4">
              <PayNowForm slug={invoice.slug} docSlug={invoice.docSlug} label="Pay online" />
            </div>
          )}
          {!invoice.paid && !invoice.payUrl && !invoice.canPayOnline && (
            <Link href={invoice.href} className="mt-4 inline-flex text-sm font-semibold text-accent-700 hover:underline">
              How to pay
            </Link>
          )}
          {!invoice.paid && invoice.payUrl && (
            <a
              href={invoice.payUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-4 inline-flex w-full items-center justify-center rounded-full bg-ink px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-ink-700"
            >
              Pay online<span className="sr-only"> (opens in a new tab)</span>
            </a>
          )}
        </div>
      )}
    </Card>
  );
}

// --- Activity ---------------------------------------------------------------

/** Client-facing wording for decision_log events. Unknown events fall back to the raw name. */
const EVENT_LABELS: Record<string, string> = {
  drafted: "Assessment drafted",
  approved: "Decision reviewed and confirmed",
  rejected: "Assessment sent back for another look",
  possible_reportable: "Flagged as possibly reportable",
  matched: "New match found",
  scanned: "Ingredients list updated",
  report_drafted: "Report draft prepared",
  dry_run: "Practice run",
};

export function ActivityFeed({ data, now, limit = 8 }: { data: DashboardData; now: Date; limit?: number }) {
  const entries = data.log.slice(0, limit);
  return (
    <Card title="Recent activity">
      {entries.length === 0 ? (
        <p className="text-sm text-stone-500">Nothing yet. Activity appears here as we work.</p>
      ) : (
        <ol className="space-y-4">
          {entries.map((e, i) => (
            <li key={`${e.at}-${i}`} className="flex gap-3">
              <span aria-hidden="true" className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-stone-300" />
              <div className="min-w-0 flex-1">
                <p className="text-sm text-ink">
                  <span className="font-medium">{EVENT_LABELS[e.event] ?? e.event.replace(/_/g, " ")}</span>
                  {e.cve && <span className="font-mono text-[0.8rem] text-stone-500"> · {e.cve}</span>}
                </p>
                {(e.product || e.detail) && (
                  <p className="mt-0.5 line-clamp-2 text-xs leading-relaxed text-stone-500">
                    {[e.product, e.detail].filter(Boolean).join(" · ")}
                  </p>
                )}
              </div>
              <time dateTime={e.at} title={formatDateTime(e.at)} className="shrink-0 text-xs tabular-nums text-stone-400">
                {formatAgo(e.at, now)}
              </time>
            </li>
          ))}
        </ol>
      )}
    </Card>
  );
}

// --- Open report drafts -----------------------------------------------------

export function OpenReports({ data, now }: { data: DashboardData; now: Date }) {
  const open = data.reports.filter((r) => r.dueAt && new Date(r.dueAt).getTime() >= now.getTime());
  if (open.length === 0) return null;
  return (
    <Card title="Report deadlines">
      <ul className="space-y-3">
        {open.map((r) => (
          <li key={`${r.cve}-${r.stage}`} className="flex items-center justify-between gap-3 text-sm">
            <span className="min-w-0">
              <span className="block font-medium text-ink first-letter:uppercase">{stageLabel(r.stage)}</span>
              <span className="font-mono text-xs text-stone-500">{r.cve}</span>
            </span>
            <span className="shrink-0 text-xs font-semibold text-amber-900">{formatDueIn(r.dueAt!, now)}</span>
          </li>
        ))}
      </ul>
    </Card>
  );
}

// --- When Neon cannot be read -----------------------------------------------

export function DataUnavailable({ reason }: { reason: "not-configured" | "no-data" | "invalid" | "unreachable" }) {
  const body =
    reason === "no-data"
      ? "Your monitoring figures appear here once onboarding reaches your first scan. Your documents are all available now."
      : "This page could not load your latest monitoring figures just now. Your documents are still available. If this persists, email us and we will send you the figures directly.";
  return (
    <Card>
      <div className="flex gap-4">
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-paper-alt text-stone-500 ring-1 ring-stone-200">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden="true">
            <path d="M4 15a4 4 0 014-4 5 5 0 019.6-1.5A3.5 3.5 0 0117.5 17H8" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </span>
        <div>
          <p className="font-semibold text-ink">
            {reason === "no-data" ? "Monitoring figures are on their way" : "Figures temporarily unavailable"}
          </p>
          <p className="mt-1 text-sm leading-relaxed text-stone-500">{body}</p>
        </div>
      </div>
    </Card>
  );
}

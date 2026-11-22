import Link from "next/link";
import type { ReactNode } from "react";
import { PayNowForm } from "@/components/portal/PayNowForm";
import { ManageBillingForm, SubscribeForm, type IntervalOption } from "@/components/portal/SubscribeForm";
import type { Billing } from "@/lib/portal/subscription";
import { MarkDoneForm } from "@/components/portal/MarkDoneForm";
import { night } from "@/components/portal/night";
import type { ActionItem } from "@/lib/portal/action-items";
import type { DashboardData } from "@/content/clients/types";
import { OpenChart } from "@/components/portal/dashboard/OpenChart";
import { monthLabel, type MonthView } from "@/lib/portal/periods";
import {
  formatAgoShort,
  formatCountdown,
  formatDate,
  formatDateTime,
  formatDueIn,
  isGoodChange,
  percentChange,
  type MetricDirection,
} from "@/lib/portal/format";

/**
 * Dashboard building blocks ("night shift"). All server components: they
 * render once on the server from data the page has already loaded, so nothing
 * here ships client data into the browser bundle. The one chart is plain SVG
 * drawn here, not a chart library.
 *
 * Visual rules: panels are a step up from the page with a hairline, never a
 * shadow. Figures and IDs are monospaced. Colour carries meaning only (amber
 * = a deadline running, orange = affected, blue = being checked, violet =
 * queued, mint = live or improving) and always comes with a word.
 */

export function Panel({
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
    <section className={`${night.panel} min-w-0 px-5 py-5 sm:px-6 ${className}`}>
      {(title || action) && (
        <div className="mb-3 flex items-center justify-between gap-3">
          {title && <h2 className={night.h2}>{title}</h2>}
          {action}
        </div>
      )}
      {children}
    </section>
  );
}

// --- Reporting deadline: the CRA clock --------------------------------------

/** The Article 14 windows, in hours, measured from when the clock started. */
const STAGES = [
  { key: "early_warning", label: "Early warning", window: 24, note: "24 h" },
  { key: "notification", label: "Notification", window: 72, note: "72 h" },
  { key: "final", label: "Final report", window: 14 * 24, note: "14 d after fix" },
] as const;

const STAGE_HEADLINE: Record<string, string> = {
  early_warning: "Early warning due",
  notification: "Notification due",
  final: "Final report due",
  advisory: "Customer advisory due",
};

export type Deadline = {
  cve: string;
  stage: string;
  dueAt: string;
  itemId: string;
  component?: string;
  product?: string;
  exploited: boolean;
  /** The draft's own page when the pipeline sent its fields; otherwise null. */
  draftHref: string | null;
};

export function DeadlinePanel({ deadline, now, slug }: { deadline: Deadline; now: Date; slug: string }) {
  const left = formatCountdown(deadline.dueAt, now);
  const current = STAGES.findIndex((s) => s.key === deadline.stage);
  const msLeft = new Date(deadline.dueAt).getTime() - now.getTime();
  const meta = [deadline.cve, deadline.component, deadline.product].filter(Boolean).join(" · ");

  return (
    <section className={`${night.panel} flex min-w-0 flex-col gap-5 px-5 py-5 sm:px-6 lg:col-span-2`} aria-labelledby="deadline-title">
      <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-1">
        <h2 id="deadline-title" className="inline-flex items-center gap-2 font-ui text-[0.84rem] font-normal text-signal-amber">
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" aria-hidden="true">
            <circle cx="12" cy="13" r="7.5" stroke="currentColor" strokeWidth="1.8" />
            <path d="M12 9.5V13l2.5 1.5M9.5 3h5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
          </svg>
          {STAGE_HEADLINE[deadline.stage] ?? "Report due"}
        </h2>
        <span className="font-mono text-[0.75rem] text-night-mute">{meta}</span>
      </div>

      <div className="flex flex-wrap items-end justify-between gap-6">
        <div>
          <p className="font-mono text-[3.1rem] font-light leading-none tracking-[-0.03em] text-night-text">
            {left ?? "Overdue"}
            {left && <span className="ml-2 font-ui text-[1.3rem] tracking-normal text-night-mute">left</span>}
          </p>
          <p className="mt-2.5 max-w-md text-[0.86rem] leading-relaxed text-night-dim">
            {deadline.exploited ? "On an exploited list. " : ""}
            {deadline.draftHref
              ? "The draft is ready to copy into ENISA's Single Reporting Platform. You submit it there; we never file for you."
              : "The draft is with you. Approve it, then submit it on ENISA's Single Reporting Platform; we never file for you."}
          </p>
        </div>
        <div className="flex flex-wrap items-start gap-2">
          {deadline.draftHref ? (
            <>
              <Link href={`/portal/${slug}/findings#${deadline.cve}`} className={night.btn}>
                Open finding
              </Link>
              <Link href={deadline.draftHref} className={night.btnPrimary}>
                Open draft
              </Link>
            </>
          ) : (
            <>
              <MarkDoneForm slug={slug} itemId={deadline.itemId} />
              <Link href={`/portal/${slug}/findings#${deadline.cve}`} className={night.btnPrimary}>
                Open finding
              </Link>
            </>
          )}
        </div>
      </div>

      {current !== -1 && (
        <ol className="grid grid-cols-3 gap-1 sm:grid-cols-[1fr_2fr_3fr]" aria-label="Reporting stages">
          {STAGES.map((s, i) => {
            const usedFraction = i === current ? Math.min(1, Math.max(0, 1 - msLeft / (s.window * 3_600_000))) : i < current ? 1 : 0;
            const usedHours = Math.round(usedFraction * s.window);
            return (
              <li key={s.key}>
                <div className="h-1 overflow-hidden rounded-full bg-night-edge" aria-hidden="true">
                  <div
                    className={`h-full ${i === current ? "bg-signal-amber" : "bg-night-faint"}`}
                    style={{ width: `${usedFraction * 100}%` }}
                  />
                </div>
                <p className={`mt-2 text-xs ${i === current ? "text-night-text" : "text-night-dim"}`}>
                  {s.label}
                  <span className="sr-only">{i < current ? " (done)" : i === current ? " (current)" : " (to come)"}</span>
                </p>
                <p className="mt-0.5 font-mono text-[0.72rem] text-night-mute">
                  {s.note}
                  {i === current && s.window <= 72 ? ` · ${usedHours} h used` : ""}
                </p>
              </li>
            );
          })}
        </ol>
      )}
    </section>
  );
}

// --- Needs you ----------------------------------------------------------------

const KIND_ICON: Record<ActionItem["kind"], string> = {
  agreement: "M8 4h8l3 3v13H5V4h3zM8 12h8M8 16h5",
  invoice: "M6 3h12v18l-3-2-3 2-3-2-3 2V3zM9 8h6M9 12h6",
  upload: "M12 16V4m0 0l-4 4m4-4l4 4M5 16v3h14v-3",
  report: "M12 3l7.5 3v5.5c0 4.4-3.1 8.2-7.5 9.5-4.4-1.3-7.5-5.1-7.5-9.5V6L12 3zM12 8v4m0 3.5v.01",
  question: "M9.5 9a2.5 2.5 0 115 .5c0 1.5-2.5 2-2.5 3.5M12 17v.01M12 21a9 9 0 110-18 9 9 0 010 18z",
  reply: "M4 5h16v11H8l-4 4V5zM8 9h8M8 12h5",
};

function DueLabel({ item, now }: { item: ActionItem; now: Date }) {
  if (!item.due) return null;
  const isDate = /^\d{4}-\d{2}-\d{2}$/.test(item.due);
  const label = item.urgency === "overdue" ? "Overdue" : isDate ? `Due ${formatDate(item.due)}` : `Due ${formatDueIn(item.due, now)}`;
  const tone = item.urgency === "overdue" ? "text-signal-orange" : item.urgency === "soon" ? "text-signal-amber" : "text-night-mute";
  return <span className={`font-mono text-[0.72rem] ${tone}`}>{label}</span>;
}

export function NeedsYou({ items, now, slug, wide }: { items: ActionItem[]; now: Date; slug: string; wide: boolean }) {
  return (
    <section
      className={`${night.panel} flex min-w-0 flex-col px-5 py-5 sm:px-6 ${wide ? "lg:col-span-3" : ""}`}
      aria-labelledby="needs-title"
    >
      <div className="mb-1 flex items-center justify-between gap-3">
        <h2 id="needs-title" className={night.h2}>
          Needs you
        </h2>
        <span className="font-mono text-[0.75rem] text-night-mute">{items.length}</span>
      </div>
      <ul className={wide ? "grid gap-x-8 md:grid-cols-2" : ""}>
        {items.map((item) => {
          const body = (
            <>
              <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-night-edge bg-night-raised text-night-dim">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                  <path d={KIND_ICON[item.kind]} stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </span>
              <span className="min-w-0 flex-1">
                <span className="block text-[0.9rem] text-night-text group-hover:underline group-hover:underline-offset-4">
                  {item.title}
                  {item.external && <span className="sr-only"> (opens in a new tab)</span>}
                </span>
                <span className="mt-0.5 block text-[0.8rem] leading-relaxed text-night-dim">{item.detail}</span>
                {item.due && (
                  <span className="mt-1.5 block">
                    <DueLabel item={item} now={now} />
                  </span>
                )}
              </span>
            </>
          );
          const linkCls = "group flex min-w-0 flex-1 items-start gap-3.5";
          return (
            <li
              key={item.id}
              className={`flex flex-col gap-2.5 border-t border-night-rule py-3.5 first:border-t-0 ${wide ? "md:[&:nth-child(2)]:border-t-0" : ""}`}
            >
              {item.external ? (
                <a href={item.href} target="_blank" rel="noopener noreferrer" className={linkCls}>
                  {body}
                </a>
              ) : (
                <Link href={item.href} className={linkCls}>
                  {body}
                </Link>
              )}
              {item.completable && (
                <div className="pl-[2.875rem]">
                  <MarkDoneForm slug={slug} itemId={item.id} />
                </div>
              )}
            </li>
          );
        })}
      </ul>
    </section>
  );
}

// --- Figures strip -----------------------------------------------------------

function Change({
  current,
  previous,
  direction,
  vs,
  format = (n: number) => `${Math.abs(n)}%`,
}: {
  current: number | null;
  previous: number | null | undefined;
  direction: MetricDirection;
  vs: string;
  format?: (n: number) => string;
}) {
  if (current === null || previous === null || previous === undefined) return null;
  const change = percentChange(current, previous);
  if (change === null || change === 0) return <span className="text-night-mute">same as {vs}</span>;
  const good = isGoodChange(change, direction);
  return (
    <span className={good ? "text-signal-mint" : "text-signal-orange"}>
      {change > 0 ? "+" : "−"}
      {format(change)} vs {vs}
    </span>
  );
}

function Figure({ label, value, unit, foot }: { label: string; value: string; unit?: string; foot: ReactNode }) {
  return (
    <div className="border-night-line px-5 py-5 sm:px-6 [&:not(:last-child)]:border-b sm:[&:nth-child(odd)]:border-r xl:border-b-0 xl:[&:not(:last-child)]:border-r">
      <p className={night.label}>{label}</p>
      <p className="mt-3 font-mono text-[2rem] leading-none tracking-[-0.02em] text-night-text">
        {value}
        {unit && <span className="ml-1 text-[0.95rem] tracking-normal text-night-mute">{unit}</span>}
      </p>
      <p className="mt-2 font-mono text-[0.72rem] text-night-mute">{foot}</p>
    </div>
  );
}

export function Figures({ data, view }: { data: DashboardData; view: MonthView }) {
  const cur = view.metrics;
  const prev = view.previous?.metrics ?? null;
  const vs = view.previous ? monthLabel(view.previous.period, "short") : "";
  const median = cur?.medianHoursToAssessment ?? null;
  const decided = cur ? cur.assessedAffected + cur.assessedNotAffected : data.totals.affected + data.totals.notAffected;
  const components = cur?.componentsMonitored ?? data.totals.components;
  const componentDelta = cur && prev ? cur.componentsMonitored - prev.componentsMonitored : null;
  const products = `${data.products.length} ${data.products.length === 1 ? "product" : "products"}`;

  return (
    <section className={`${night.panel} grid sm:grid-cols-2 xl:grid-cols-4`} aria-label={`Figures for ${monthLabel(view.period)}`}>
      <Figure
        label="Median time to assessment"
        value={median === null ? "–" : Number.isInteger(median) ? String(median) : median.toFixed(1)}
        unit={median === null ? undefined : "h"}
        foot={
          prev ? (
            <Change current={median} previous={prev.medianHoursToAssessment} direction="down-good" vs={vs} />
          ) : (
            <span>from match to reviewed decision</span>
          )
        }
      />
      <Figure
        label={cur ? "New matches" : "Matches to date"}
        value={(cur?.vulnerabilitiesMatched ?? data.totals.matches).toLocaleString("en-IE")}
        foot={
          <>
            {prev ? `${prev.vulnerabilitiesMatched.toLocaleString("en-IE")} in ${vs}` : ""}
            {prev && view.isCurrent ? " · " : ""}
            {view.isCurrent ? `${data.totals.exploited} exploited` : ""}
          </>
        }
      />
      <Figure
        label="Decided"
        value={decided.toLocaleString("en-IE")}
        foot={
          <>
            {(cur?.assessedNotAffected ?? data.totals.notAffected).toLocaleString("en-IE")} clear ·{" "}
            {(cur?.assessedAffected ?? data.totals.affected).toLocaleString("en-IE")} affected
          </>
        }
      />
      <Figure
        label="Components watched"
        value={components.toLocaleString("en-IE")}
        foot={
          <>
            {componentDelta ? `${componentDelta > 0 ? "+" : "−"}${Math.abs(componentDelta)} since ${vs} · ` : ""}
            {products}
          </>
        }
      />
    </section>
  );
}

// --- Open matches over time --------------------------------------------------

export function OpenMatchesChart({ data, view, now }: { data: DashboardData; view: MonthView; now: Date }) {
  if (view.points.length < 2) return null;
  const last = view.points[view.points.length - 1];
  const newInPeriod = view.points.reduce((sum, p) => sum + p.matched, 0);
  const span = view.isCurrent ? "last 30 days" : monthLabel(view.period);

  return (
    <section className={`${night.panel} min-w-0 px-5 py-5 sm:px-6 lg:col-span-2`} aria-labelledby="open-title">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 id="open-title" className={night.label}>
            Open matches · {span}
          </h2>
          <p className="mt-2 font-mono text-[1.6rem] leading-none tracking-[-0.02em] text-night-text">
            {view.isCurrent ? data.totals.underInvestigation + data.totals.unassessed : last.open}
            <span className="ml-2.5 text-[0.75rem] tracking-normal text-night-mute">
              {view.isCurrent
                ? `${data.totals.underInvestigation} being checked · ${data.totals.unassessed} queued`
                : `open at month end · ${newInPeriod} new in the month`}
            </span>
          </p>
        </div>
        <div className="flex gap-4 text-xs text-night-dim" aria-hidden="true">
          <span className="inline-flex items-center gap-1.5">
            <span className="h-0.5 w-3 rounded-full bg-signal-mint" />
            Open
          </span>
          <span className="inline-flex items-center gap-1.5">
            <span className="h-2.5 w-1 rounded-sm bg-[#4A4E57]" />
            New per day
          </span>
        </div>
      </div>
      <OpenChart
        key={view.period}
        points={view.points}
        todayIso={now.toISOString().slice(0, 10)}
        caption={`Open matches per day, ${span}`}
      />
    </section>
  );
}

// --- Where every match ended up ------------------------------------------------

export function Outcomes({ data }: { data: DashboardData }) {
  const t = data.totals;
  const rows = [
    { label: "Not affected", n: t.notAffected, color: "bg-signal-clear" },
    { label: "Affected", n: t.affected, color: "bg-signal-orange" },
    { label: "Being checked", n: t.underInvestigation, color: "bg-signal-blue" },
    { label: "Queued", n: t.unassessed, color: "bg-signal-violet" },
  ];
  return (
    <section className={`${night.panel} flex min-w-0 flex-col gap-4 px-5 py-5 sm:px-6`} aria-labelledby="outcomes-title">
      <div>
        <h2 id="outcomes-title" className={night.label}>
          Every match so far
        </h2>
        <p className="mt-2 font-mono text-[1.6rem] leading-none tracking-[-0.02em] text-night-text">{t.matches.toLocaleString("en-IE")}</p>
      </div>
      {t.matches > 0 && (
        <div aria-hidden="true" className="flex h-2.5 gap-0.5 overflow-hidden rounded-[3px]">
          {rows
            .filter((r) => r.n > 0)
            .map((r) => (
              <div key={r.label} className={`${r.color} min-w-[6px] ${r.label === "Not affected" ? "opacity-60" : ""}`} style={{ flex: r.n }} />
            ))}
        </div>
      )}
      <ul className="text-[0.84rem]">
        {rows.map((r) => (
          <li key={r.label} className="flex items-center gap-2.5 border-t border-night-rule py-2.5">
            <span aria-hidden="true" className={`h-[7px] w-[7px] rounded-sm ${r.color}`} />
            <span className="flex-1 text-night-dim">{r.label}</span>
            <span className="font-mono text-night-text">{r.n.toLocaleString("en-IE")}</span>
          </li>
        ))}
      </ul>
    </section>
  );
}

// --- Activity ----------------------------------------------------------------

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

export function ActivityFeed({ data, now, limit = 7 }: { data: DashboardData; now: Date; limit?: number }) {
  const entries = data.log.slice(0, limit);
  return (
    <Panel title="Activity" className="lg:col-span-2">
      {entries.length === 0 ? (
        <p className="text-[0.84rem] text-night-mute">Nothing yet. Activity appears here as we work.</p>
      ) : (
        <ol>
          {entries.map((e, i) => (
            <li
              key={`${e.at}-${i}`}
              className="grid grid-cols-[3.25rem_minmax(0,1fr)] items-baseline gap-x-4 border-t border-night-rule py-3 first:border-t-0 sm:grid-cols-[3.25rem_minmax(0,1fr)_auto]"
            >
              <time dateTime={e.at} title={formatDateTime(e.at)} className="font-mono text-[0.72rem] text-night-mute">
                {formatAgoShort(e.at, now)}
              </time>
              <div className="min-w-0">
                <p className="text-[0.86rem] text-night-text">
                  {EVENT_LABELS[e.event] ?? e.event.replace(/_/g, " ")}
                  {e.cve && <span className="ml-2 font-mono text-[0.75rem] text-night-mute">{e.cve}</span>}
                </p>
                {e.detail && <p className="mt-0.5 line-clamp-1 text-[0.78rem] text-night-mute">{e.detail}</p>}
              </div>
              {e.product && <span className="col-start-2 text-[0.78rem] text-night-mute sm:col-start-3 sm:text-right">{e.product}</span>}
            </li>
          ))}
        </ol>
      )}
    </Panel>
  );
}

// --- Onboarding (only until monitoring is live) ------------------------------

export function EngagementProgress({ steps, completed }: { steps: readonly { title: string }[]; completed: number }) {
  const done = Math.max(0, Math.min(completed, steps.length));
  return (
    <Panel title="Onboarding" action={<span className="font-mono text-[0.75rem] text-night-mute">{`${done}/${steps.length}`}</span>}>
      <ol>
        {steps.map((s, i) => {
          const state = i < done ? "done" : i === done ? "current" : "todo";
          return (
            <li key={s.title} className="flex items-center gap-3 border-t border-night-rule py-2.5 first:border-t-0">
              <span
                aria-hidden="true"
                className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full font-mono text-[0.62rem] ${
                  state === "done"
                    ? "bg-signal-mint text-night"
                    : state === "current"
                      ? "text-signal-mint ring-1 ring-signal-mint"
                      : "text-night-mute ring-1 ring-night-edge"
                }`}
              >
                {state === "done" ? (
                  <svg width="10" height="10" viewBox="0 0 24 24" fill="none">
                    <path d="M5 12.5l4.5 4.5L19 7.5" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                ) : (
                  i + 1
                )}
              </span>
              <span className={`text-[0.84rem] ${state === "todo" ? "text-night-mute" : "text-night-text"}`}>
                {s.title}
                <span className="sr-only">{state === "done" ? " (done)" : state === "current" ? " (in progress)" : " (to come)"}</span>
              </span>
            </li>
          );
        })}
      </ol>
    </Panel>
  );
}

// --- Billing -----------------------------------------------------------------

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
    <Panel
      title="Billing"
      action={
        invoice ? (
          <span className="font-mono text-[0.75rem] text-night-mute">{invoice.number}</span>
        ) : (
          <Link href={documentsHref} className="text-[0.8rem] text-night-dim hover:text-night-text">
            Documents
          </Link>
        )
      }
    >
      {!invoice ? (
        <p className="text-[0.84rem] text-night-mute">No invoices yet.</p>
      ) : (
        <div className="flex flex-col gap-3">
          <p className="font-mono text-[1.6rem] leading-none tracking-[-0.02em] text-night-text">{invoice.amount}</p>
          <p className="flex items-center gap-2 text-[0.84rem] text-night-dim">
            {invoice.paid ? (
              <>
                <span aria-hidden="true" className="h-[7px] w-[7px] rounded-full bg-signal-mint" />
                Paid, thank you
              </>
            ) : (
              <>Due {formatDate(invoice.due)}</>
            )}
          </p>
          <div className="mt-1 flex flex-wrap gap-2">
            <Link href={invoice.href} className={`${night.btn} flex-1`}>
              View invoice
            </Link>
            {!invoice.paid && invoice.payUrl && (
              <a href={invoice.payUrl} target="_blank" rel="noopener noreferrer" className={`${night.btnPrimary} flex-1`}>
                Pay online<span className="sr-only"> (opens in a new tab)</span>
              </a>
            )}
            {!invoice.paid && !invoice.payUrl && invoice.canPayOnline && (
              <div className="flex-1 [&_button]:w-full">
                <PayNowForm slug={invoice.slug} docSlug={invoice.docSlug} label="Pay online" tone="night" />
              </div>
            )}
          </div>
        </div>
      )}
    </Panel>
  );
}

// --- Automatic billing (a plan) ---------------------------------------------

/** Everything the plan card needs, already formatted on the server. */
export type PlanBilling = {
  slug: string;
  planName: string;
  startsOn: string;
  billing: Billing;
  options: IntervalOption[];
  defaultInterval: string;
  money: (minor: number) => string;
  canPayOnline: boolean;
  now: Date;
};

const day = (iso: string) => formatDate(iso.slice(0, 10));

export function PlanCard({ plan }: { plan: PlanBilling }) {
  const { billing } = plan;
  return (
    <Panel title="Your plan" action={<span className="text-[0.8rem] text-night-mute">{plan.planName}</span>}>
      {billing.state === "unavailable" ? (
        <p className="text-[0.84rem] text-night-mute">Your billing details could not be loaded just now. Refresh in a moment.</p>
      ) : billing.state === "not-set-up" || billing.state === "ended" ? (
        plan.canPayOnline ? (
          <div className="flex flex-col gap-3">
            <p className="text-[0.84rem] leading-relaxed text-night-dim">
              {billing.state === "ended" ? "Your plan has ended. " : ""}Choose how often to pay and save a card or direct
              debit. Nothing is charged before {day(plan.startsOn)}; after that it is collected automatically each period.
            </p>
            <SubscribeForm slug={plan.slug} options={plan.options} initialValue={plan.defaultInterval} />
          </div>
        ) : (
          <p className="text-[0.84rem] text-night-mute">We will send your first {plan.planName} invoice by email.</p>
        )
      ) : (
        <div className="flex flex-col gap-3">
          <p className="font-mono text-[1.6rem] leading-none tracking-[-0.02em] text-night-text">
            {plan.money(billing.amount)}
            {billing.interval && (
              <span className="ml-1 text-[0.8rem] tracking-normal text-night-mute">/{billing.interval === "monthly" ? "month" : "quarter"}</span>
            )}
          </p>
          {billing.overdue ? (
            <div className="rounded-lg border border-signal-amber/40 bg-signal-amber/[0.07] px-3.5 py-3 text-[0.82rem] leading-relaxed text-night-text">
              {billing.overdue.paused ? (
                <>
                  <strong className="font-medium text-signal-amber">Monitoring is paused</strong> until{" "}
                  {plan.money(billing.overdue.invoice.amount)} from {day(billing.overdue.invoice.created)} is paid. It resumes
                  within one business day of payment.
                </>
              ) : (
                <>
                  <strong className="font-medium text-signal-amber">Payment did not go through.</strong> Pay{" "}
                  {plan.money(billing.overdue.invoice.amount)} by {day(billing.overdue.pauseAt)} to keep monitoring running.
                </>
              )}
            </div>
          ) : (
            <p className="flex items-center gap-2 text-[0.84rem] text-night-dim">
              <span aria-hidden="true" className="h-[7px] w-[7px] rounded-full bg-signal-mint" />
              {billing.nextChargeAt ? <>Paid automatically. Next charge {day(billing.nextChargeAt)}</> : <>Paid automatically</>}
            </p>
          )}
          <div className="flex flex-col gap-2">
            {billing.overdue?.invoice.hostedUrl && (
              <a href={billing.overdue.invoice.hostedUrl} target="_blank" rel="noopener noreferrer" className={`${night.btnPrimary} w-full`}>
                Pay now<span className="sr-only"> (opens in a new tab)</span>
              </a>
            )}
            <ManageBillingForm slug={plan.slug} />
          </div>
          {billing.invoices.length > 0 && (
            <ul className="mt-1 border-t border-night-rule">
              {billing.invoices.slice(0, 4).map((inv) => (
                <li key={inv.number ?? inv.created} className="flex items-center justify-between gap-3 border-b border-night-rule py-2 text-[0.8rem]">
                  <span className="text-night-dim">{day(inv.periodStart ?? inv.created)}</span>
                  <span className="font-mono text-night-text">{plan.money(inv.amount)}</span>
                  <span className={inv.status === "paid" ? "text-night-mute" : "text-signal-amber"}>
                    {inv.status === "paid" ? "Paid" : inv.status === "open" ? "Owing" : "Void"}
                  </span>
                  {inv.pdfUrl ? (
                    <a href={inv.pdfUrl} target="_blank" rel="noopener noreferrer" className="text-night-dim hover:text-night-text">
                      PDF<span className="sr-only"> for {inv.number ?? "this invoice"} (opens in a new tab)</span>
                    </a>
                  ) : (
                    <span />
                  )}
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </Panel>
  );
}

// --- When Neon cannot be read ------------------------------------------------

export function DataUnavailable({ reason }: { reason: "not-configured" | "no-data" | "invalid" | "unreachable" }) {
  const body =
    reason === "no-data"
      ? "Your monitoring figures appear here once onboarding reaches your first scan. Your documents are all available now."
      : "This page could not load your latest monitoring figures just now. Your documents are still available. If this persists, email us and we will send you the figures directly.";
  return (
    <Panel>
      <div className="flex gap-4">
        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-night-edge bg-night-raised text-night-dim">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
            <path d="M4 15a4 4 0 014-4 5 5 0 019.6-1.5A3.5 3.5 0 0117.5 17H8" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </span>
        <div>
          <p className="text-[0.9rem] text-night-text">
            {reason === "no-data" ? "Monitoring figures are on their way" : "Figures temporarily unavailable"}
          </p>
          <p className="mt-1 text-[0.84rem] leading-relaxed text-night-dim">{body}</p>
        </div>
      </div>
    </Panel>
  );
}

// --- Book a call ---------------------------------------------------------------

export function SupportCard({ slug }: { slug: string }) {
  return (
    <Panel title="Need a hand?" className="flex flex-1 flex-col">
      <p className="mb-4 text-[0.84rem] leading-relaxed text-night-dim">
        Something looks wrong, or a question about a finding, a report or your bill? Book a call and tell us what it is
        about, so we come prepared.
      </p>
      <Link href={`/portal/${slug}/call`} className={`${night.btn} mt-auto w-full`}>
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" aria-hidden="true">
          <rect x="4" y="5.5" width="16" height="14.5" rx="2" stroke="currentColor" strokeWidth="1.7" />
          <path d="M8 3.5v4M16 3.5v4M4 10h16" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
        </svg>
        Book a call
      </Link>
    </Panel>
  );
}

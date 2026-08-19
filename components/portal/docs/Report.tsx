import type { Client, ReportDoc } from "@/content/clients/types";
import { DocShell, DocSection, DocCallout, DocList } from "@/components/portal/DocShell";
import {
  formatMinutes,
  formatPeriod,
  isGoodChange,
  percentChange,
  type MetricDirection,
} from "@/lib/portal/format";

/**
 * Monthly performance report.
 *
 * Measures what a speed-to-lead business actually sells: enquiries received and
 * answered, how fast the first reply went out, bookings made and no-shows. Not
 * impressions or views, which would be borrowed from a different business
 * entirely and would tell the client nothing about their diary.
 *
 * Values come from the client data file today. The metric shape is deliberately
 * flat so a live Airtable read can replace them later without touching this
 * layout.
 */

function Metric({
  label,
  value,
  change,
  direction,
  emphasis = false,
}: {
  label: string;
  value: string;
  change: number | null;
  direction: MetricDirection;
  emphasis?: boolean;
}) {
  const good = isGoodChange(change, direction);
  const flat = change === 0;

  return (
    <div
      className={`break-inside-avoid rounded-xl border p-5 text-center ${
        emphasis
          ? "border-accent bg-accent-soft/50 print:bg-transparent"
          : "border-stone-200 bg-white"
      }`}
    >
      <p className="font-display text-[2rem] font-bold leading-none text-ink">{value}</p>
      <p className="mt-2 text-[0.68rem] uppercase leading-tight tracking-[0.12em] text-stone-400">
        {label}
      </p>
      {change !== null && (
        <p
          className={`mt-2 text-xs font-medium ${
            flat ? "text-stone-400" : good ? "text-accent-700" : "text-red-600"
          }`}
        >
          {flat ? "No change" : `${change > 0 ? "+" : ""}${change}% on last month`}
        </p>
      )}
    </div>
  );
}

export function Report({ client, payload }: { client: Client; payload: ReportDoc }) {
  const m = payload.metrics;
  const prev = m.previous;

  const answeredRate = m.enquiriesReceived
    ? Math.round((m.enquiriesAnswered / m.enquiriesReceived) * 100)
    : 0;
  const prevAnsweredRate =
    prev && prev.enquiriesReceived
      ? Math.round((prev.enquiriesAnswered / prev.enquiriesReceived) * 100)
      : undefined;

  return (
    <DocShell
      docType="Monthly Report"
      subtitle="Performance"
      clientName={client.business.name}
      meta={[{ label: "Period", value: formatPeriod(payload.period) }]}
    >
      <DocSection title="The month in short">
        <DocCallout>{payload.summary}</DocCallout>
      </DocSection>

      <DocSection title="Key numbers">
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
          <Metric
            label="Enquiries received"
            value={String(m.enquiriesReceived)}
            change={percentChange(m.enquiriesReceived, prev?.enquiriesReceived)}
            direction="up-good"
          />
          <Metric
            label="Answered"
            value={`${answeredRate}%`}
            change={percentChange(answeredRate, prevAnsweredRate)}
            direction="up-good"
          />
          <Metric
            label="Median first reply"
            value={formatMinutes(m.medianResponseMinutes)}
            change={percentChange(m.medianResponseMinutes, prev?.medianResponseMinutes)}
            direction="down-good"
            emphasis
          />
          <Metric
            label="Bookings made"
            value={String(m.bookingsMade)}
            change={percentChange(m.bookingsMade, prev?.bookingsMade)}
            direction="up-good"
          />
          <Metric
            label="No-shows"
            value={String(m.noShows)}
            change={percentChange(m.noShows, prev?.noShows)}
            direction="down-good"
          />
          <Metric
            label="Handled without you"
            value={String(m.enquiriesAnswered)}
            change={percentChange(m.enquiriesAnswered, prev?.enquiriesAnswered)}
            direction="up-good"
          />
        </div>
        {!prev && (
          <p className="mt-3 text-xs leading-relaxed text-stone-500">
            This is your first report, so there is nothing to compare against yet.
            Month-on-month changes appear from next month.
          </p>
        )}
      </DocSection>

      <DocSection title="What we did this month">
        <DocList items={payload.actionsTaken} />
      </DocSection>

      <DocSection title="Next month">
        <DocList items={payload.nextMonth} />
      </DocSection>

      <DocSection title="How to read this">
        <p className="text-[0.94rem] leading-relaxed text-stone-600">
          Median first reply is the number worth watching. Research on lead response finds
          a business is far more likely to qualify a lead when it replies within five
          minutes rather than thirty, and the average business takes over forty hours to
          answer an online enquiry. That gap is the whole reason your systems exist.
        </p>
      </DocSection>
    </DocShell>
  );
}

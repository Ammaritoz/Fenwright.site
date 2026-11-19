import type { Client, ReportDoc } from "@/content/clients/types";
import { DocShell, DocSection, DocCallout, DocList } from "@/components/portal/DocShell";
import {
  formatPeriod,
  isGoodChange,
  percentChange,
  type MetricDirection,
} from "@/lib/portal/format";

/**
 * Monthly performance report.
 *
 * Measures what the vulnerability-response service actually sells: what we
 * watched, what matched, how each match was decided, and how fast. Most months
 * nothing is reportable, so the "not affected" decisions are the evidence that
 * the watching happened, and they belong on the page as much as the reports.
 *
 * Values come from the client data file today. The metric shape is deliberately
 * flat so a live Airtable read can replace them later without touching this
 * layout.
 */

/** Hours with one decimal under ten, whole hours above: "3.5 hrs", "26 hrs". */
function formatHours(hours: number | null): string {
  if (hours === null) return "None yet";
  const v = hours < 10 ? Math.round(hours * 10) / 10 : Math.round(hours);
  return `${v} ${v === 1 ? "hr" : "hrs"}`;
}

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

  const assessed = m.assessedAffected + m.assessedNotAffected;

  return (
    <DocShell
      docType="Monthly Report"
      subtitle="Vulnerability handling"
      clientName={client.business.name}
      meta={[{ label: "Period", value: formatPeriod(payload.period) }]}
    >
      <DocSection title="The month in short">
        <DocCallout>{payload.summary}</DocCallout>
      </DocSection>

      <DocSection title="Key numbers">
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
          <Metric
            label="Components watched"
            value={String(m.componentsMonitored)}
            change={percentChange(m.componentsMonitored, prev?.componentsMonitored)}
            direction="up-good"
          />
          <Metric
            label="New matches"
            value={String(m.vulnerabilitiesMatched)}
            change={null}
            direction="down-good"
          />
          <Metric
            label="Median hours to assessment"
            value={formatHours(m.medianHoursToAssessment)}
            change={
              m.medianHoursToAssessment === null
                ? null
                : percentChange(m.medianHoursToAssessment, prev?.medianHoursToAssessment ?? undefined)
            }
            direction="down-good"
            emphasis
          />
          <Metric
            label="Checked, not affected"
            value={String(m.assessedNotAffected)}
            change={null}
            direction="up-good"
          />
          <Metric
            label="Checked, affected"
            value={String(m.assessedAffected)}
            change={null}
            direction="down-good"
          />
          <Metric
            label="Reportable events"
            value={String(m.reportableEvents)}
            change={null}
            direction="down-good"
          />
        </div>
        <p className="mt-3 text-xs leading-relaxed text-stone-500">
          {assessed === m.vulnerabilitiesMatched
            ? "Every match this month was checked and has a written decision in your log."
            : `${assessed} of ${m.vulnerabilitiesMatched} matches have a written decision so far. The rest are in progress and carry into next month.`}
        </p>
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
          Median hours to assessment is the number worth watching: how long it took from a
          new vulnerability appearing to a reviewed decision on whether it affects your
          products. Under Article 14 of the Cyber Resilience Act, an early warning is due
          within 24 hours of becoming aware that a vulnerability in your product is actively
          exploited, so the faster the check, the more of that window is left for you.
          Matches checked and found not affected are not wasted work: each one is recorded
          with its reason, and that record is evidence of vulnerability handling for your
          technical file.
        </p>
      </DocSection>
    </DocShell>
  );
}

import Link from "next/link";
import { notFound } from "next/navigation";
import { getClient } from "@/content/clients";
import type { ReportField } from "@/content/clients/types";
import { getDashboard } from "@/lib/portal/dashboard";
import { getCompletion } from "@/lib/airtable";
import { REPORT_STAGES, REPORT_STAGE_TITLES, reportHref, reportItemId } from "@/lib/portal/action-items";
import { formatCountdown, formatDateTime } from "@/lib/portal/format";
import { CopyButton } from "@/components/portal/CopyButton";
import { PrintButton } from "@/components/portal/PrintButton";
import { ReportSubmittedForm } from "@/components/portal/ReportSubmittedForm";
import { Thread } from "@/components/portal/Thread";
import { getMessages } from "@/lib/portal/message-data";
import { reportTopic, threadsByTopic } from "@/lib/portal/messages";
import { DataUnavailable } from "@/components/portal/dashboard/Widgets";
import { night } from "@/components/portal/night";

/**
 * One Article 14 draft, ready to paste into ENISA's Single Reporting Platform.
 *
 * The fields come in the platform's own order and labels (fenwright-watch's
 * article14.fields()), each with a copy button, so the client fills the form
 * field by field instead of reformatting a document. "[CLIENT TO CONFIRM: ...]"
 * gaps are marked: those are facts only the client has. Fenwright never files;
 * the client submits and records it here, with a timestamp.
 *
 * Gated like every portal page by middleware.ts; the draft is read from this
 * client's own snapshot only.
 */

const GAP = /\[CLIENT TO CONFIRM: ([^\]]+)\]/;
const SRP_URL = "https://www.enisa.europa.eu/topics/product-security/single-reporting-platform-srp";

function isBlankOptional(f: ReportField): boolean {
  return f.value.startsWith("(optional") || f.value === "(none)";
}

export default async function ReportPage({ params }: { params: { client: string; cve: string; stage: string } }) {
  const client = getClient(params.client);
  if (!client) notFound();
  const cve = decodeURIComponent(params.cve);
  const stage = decodeURIComponent(params.stage);

  const [result, messages] = await Promise.all([getDashboard(client.slug), getMessages(client.slug)]);
  if (!result.ok) {
    return (
      <div className="mx-auto max-w-[52rem]">
        <DataUnavailable reason={result.reason} />
      </div>
    );
  }
  const data = result.data;
  const report = data.reports.find((r) => r.cve === cve && r.stage === stage);
  if (!report || !report.fields?.length) notFound();

  const finding = data.findings.find((f) => f.cve === cve);
  const submittedAt = await getCompletion(client.slug, reportItemId(report));
  const now = new Date();
  const left = report.dueAt ? formatCountdown(report.dueAt, now) : null;
  const gaps = report.fields.filter((f) => GAP.test(f.value));
  const requiredGaps = gaps.filter((f) => f.requirement === "required").length;
  const meta = [cve, finding?.component, finding?.product].filter(Boolean).join(" · ");

  return (
    <div className="mx-auto max-w-[52rem]">
      <header className="mb-6">
        <p className="font-mono text-[0.75rem] text-night-mute">{meta}</p>
        <h1 className={`${night.h1} mt-3`}>{REPORT_STAGE_TITLES[stage] ?? stage}</h1>
        <div className="mt-4 flex flex-wrap items-center gap-x-5 gap-y-2 text-[0.84rem]">
          {submittedAt ? (
            <span className="inline-flex items-center gap-2 text-signal-mint">
              <span aria-hidden="true" className="h-[7px] w-[7px] rounded-full bg-signal-mint" />
              Recorded as submitted {formatDateTime(submittedAt)}
            </span>
          ) : report.dueAt ? (
            <span className={`inline-flex items-center gap-2 ${left ? "text-signal-amber" : "text-signal-orange"}`}>
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                <circle cx="12" cy="13" r="7.5" stroke="currentColor" strokeWidth="1.8" />
                <path d="M12 9.5V13l2.5 1.5M9.5 3h5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
              </svg>
              {left ? <span className="font-mono">{left} left</span> : "Overdue"}
              <span className="text-night-mute">· due {formatDateTime(report.dueAt)}</span>
            </span>
          ) : (
            <span className="text-night-dim">Due 14 days after a fix or mitigation is available</span>
          )}
          {report.awareAt && <span className="font-mono text-[0.75rem] text-night-mute">aware {formatDateTime(report.awareAt)}</span>}
        </div>
      </header>

      {/* The three stages, linked where a draft exists. */}
      <nav aria-label="Report stages" className="mb-4 grid grid-cols-3 gap-1 print:hidden">
        {REPORT_STAGES.map((s) => {
          const r = data.reports.find((x) => x.cve === cve && x.stage === s);
          const current = s === stage;
          const label = REPORT_STAGE_TITLES[s];
          const cls = `block rounded-lg border px-3 py-2.5 text-[0.8rem] ${
            current ? "border-night-edge bg-night-raised text-night-text" : "border-night-line text-night-dim hover:text-night-text"
          }`;
          return r?.fields?.length && !current ? (
            <Link key={s} href={reportHref(client.slug, r)} className={cls}>
              {label}
            </Link>
          ) : (
            <span key={s} aria-current={current ? "page" : undefined} className={`${cls} ${!r && !current ? "border-dashed text-night-faint hover:text-night-faint" : ""}`}>
              {label}
              {!r && !current && <span className="block font-mono text-[0.68rem]">not drafted yet</span>}
            </span>
          );
        })}
      </nav>

      <section className={`${night.panel} px-5 py-5 sm:px-6`} aria-labelledby="how-title">
        <h2 id="how-title" className={night.h2}>
          How to submit
        </h2>
        <ol className="mt-3 space-y-2 text-[0.86rem] leading-relaxed text-night-dim">
          <li>
            <span className="mr-2 font-mono text-night-mute">1</span>
            Sign in to{" "}
            <a href={SRP_URL} target="_blank" rel="noopener noreferrer" className="text-night-text underline underline-offset-4">
              ENISA&apos;s Single Reporting Platform<span className="sr-only"> (opens in a new tab)</span>
            </a>{" "}
            with your EU Login.
          </li>
          <li>
            <span className="mr-2 font-mono text-night-mute">2</span>
            {stage === "early_warning"
              ? "Start a new notification for an actively exploited vulnerability."
              : "Open the notification you started for this vulnerability; earlier fields carry forward."}
          </li>
          <li>
            <span className="mr-2 font-mono text-night-mute">3</span>
            Copy each field below into the field with the same name.
            {requiredGaps > 0 && " Fill in the marked gaps yourself: only you know those facts."}
          </li>
          <li>
            <span className="mr-2 font-mono text-night-mute">4</span>
            Submit it there, then record it at the bottom of this page.
          </li>
        </ol>
        <p className="mt-3 text-[0.8rem] text-night-mute">We prepare the report; you submit it. Fenwright never files on your behalf.</p>
      </section>

      <section className={`${night.panel} mt-4 overflow-hidden`} aria-labelledby="fields-title">
        <div className="flex flex-wrap items-baseline justify-between gap-2 px-5 pb-3 pt-4 sm:px-6">
          <h2 id="fields-title" className={night.h2}>
            Fields to paste
          </h2>
          <span className={`font-mono text-[0.75rem] ${requiredGaps ? "text-signal-amber" : "text-night-mute"}`}>
            {requiredGaps
              ? `${requiredGaps} required ${requiredGaps === 1 ? "field needs" : "fields need"} your input`
              : "every required field is filled"}
          </span>
        </div>
        <ol>
          {report.fields.map((f) => {
            const gap = f.value.match(GAP);
            const blank = isBlankOptional(f);
            return (
              <li key={f.label} className="border-t border-night-rule px-5 py-4 sm:px-6">
                <div className="flex items-start justify-between gap-4">
                  <div className="min-w-0">
                    <p className="text-[0.86rem] text-night-text">
                      {f.label}
                      <span
                        className={`ml-2 font-mono text-[0.7rem] ${f.requirement === "required" ? "text-night-dim" : "text-night-mute"}`}
                      >
                        {f.requirement}
                      </span>
                    </p>
                  </div>
                  {!blank && !gap && <CopyButton text={f.value} label={f.label} />}
                </div>
                {gap ? (
                  <div className="mt-2.5 rounded-lg border border-signal-amber/40 bg-signal-amber/[0.07] px-3.5 py-3">
                    <p className="text-[0.86rem] text-night-text">{f.value.replace(GAP, "").trim() || null}</p>
                    <p className="text-[0.84rem] text-signal-amber">
                      <span className="font-medium">You fill this in:</span> {gap[1]}
                    </p>
                  </div>
                ) : (
                  <p
                    className={`mt-2.5 whitespace-pre-wrap rounded-lg border border-night-line bg-night px-3.5 py-3 text-[0.86rem] leading-relaxed ${
                      blank ? "text-night-mute" : "text-night-text"
                    }`}
                  >
                    {f.value}
                  </p>
                )}
              </li>
            );
          })}
        </ol>
      </section>

      {report.checks && report.checks.length > 0 && (
        <details className={`${night.panel} group mt-4 px-5 py-4 sm:px-6`}>
          <summary className="flex cursor-pointer list-none items-center justify-between text-[0.84rem] text-night-dim [&::-webkit-details-marker]:hidden">
            What this draft is based on
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true" className="text-night-faint transition-transform group-open:rotate-180">
              <path d="M6 9l6 6 6-6" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </summary>
          <ul className="mt-3 space-y-1.5 text-[0.8rem] leading-relaxed text-night-mute">
            {report.checks.map((c) => (
              <li key={c} className="flex gap-2">
                <span aria-hidden="true" className="mt-[0.6em] h-1 w-1 shrink-0 rounded-full bg-night-faint" />
                {c}
              </li>
            ))}
          </ul>
        </details>
      )}

      <section className={`${night.panel} mt-4 px-5 py-5 sm:px-6`} aria-labelledby="record-title">
        <h2 id="record-title" className={night.h2}>
          After you submit
        </h2>
        {submittedAt ? (
          <p className="mt-2 text-[0.86rem] text-night-dim">
            Recorded as submitted on <span className="font-mono text-night-text">{formatDateTime(submittedAt)}</span>. Keep
            the confirmation ENISA&apos;s platform gives you; this is your own record alongside it.
          </p>
        ) : (
          <>
            <p className="mb-4 mt-2 text-[0.84rem] text-night-mute">
              Recording it here clears the deadline from your dashboard and keeps a timestamped record next to the draft.
            </p>
            <ReportSubmittedForm slug={client.slug} cve={cve} stage={stage} />
          </>
        )}
      </section>

      <section id="thread" className={`${night.panel} mt-4 scroll-mt-24 px-5 py-5 sm:px-6 print:hidden`} aria-label="Questions about this draft">
        <Thread
          slug={client.slug}
          topic={reportTopic(cve, stage)}
          thread={threadsByTopic(messages).get(reportTopic(cve, stage))}
          allowRecheck={false}
          title="Questions about this draft"
        />
      </section>

      <div className="mt-5 flex justify-end">
        <PrintButton />
      </div>
    </div>
  );
}

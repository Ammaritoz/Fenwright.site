import Link from "next/link";
import { MessageForm } from "@/components/portal/MessageForm";
import { night } from "@/components/portal/night";
import { formatDateTime } from "@/lib/portal/format";
import { MAX_MESSAGE, RECHECK_REASONS, REPLY_TIMES, type Thread as ThreadData } from "@/lib/portal/messages";

/**
 * A finding's or report's conversation with us: earlier messages, then the box.
 * Server component; only the form is client-side.
 */
export function Thread({
  slug,
  topic,
  thread,
  allowRecheck,
  title = "Questions and rechecks",
}: {
  slug: string;
  topic: string;
  thread: ThreadData | undefined;
  allowRecheck: boolean;
  title?: string;
}) {
  const hint = `We reply within ${REPLY_TIMES.messageBusinessDays} business day${allowRecheck ? `, rechecks within ${REPLY_TIMES.recheckBusinessDays}` : ""}.`;
  return (
    <div className="space-y-3">
      <p className={night.label}>{title}</p>
      {thread && (
        <ol className="space-y-2.5">
          {thread.messages.map((m) => (
            <li
              key={m.id}
              className={`rounded-lg border px-3.5 py-3 ${
                m.author === "Fenwright" ? "border-signal-mint/25 bg-signal-mint/[0.05]" : "border-night-line bg-night-raised/60"
              }`}
            >
              <p className="flex flex-wrap items-baseline gap-x-2 text-[0.75rem] text-night-mute">
                <span className="text-night-text">{m.author === "Fenwright" ? "Fenwright" : "You"}</span>
                <span className="font-mono">{formatDateTime(m.at)}</span>
                {m.recheck && <span className="text-signal-blue">Recheck: {m.recheck.toLowerCase()}</span>}
                {m.outcome && <span className="text-signal-mint">{m.outcome}</span>}
              </p>
              <p className="mt-1.5 whitespace-pre-wrap text-[0.86rem] leading-relaxed text-night-text/90">{m.body}</p>
            </li>
          ))}
        </ol>
      )}
      {thread?.openRecheck && (
        <p className="text-[0.8rem] text-signal-blue">Recheck requested. We will reply here with what we found.</p>
      )}
      <MessageForm slug={slug} topic={topic} reasons={RECHECK_REASONS} allowRecheck={allowRecheck && !thread?.openRecheck} hint={hint} max={MAX_MESSAGE} />
      <p className="text-[0.76rem] text-night-mute">
        A report deadline running?{" "}
        <Link href={`/portal/${slug}/call`} className="text-night-dim underline-offset-4 hover:text-night-text hover:underline">
          Book a call
        </Link>{" "}
        instead.
      </p>
    </div>
  );
}

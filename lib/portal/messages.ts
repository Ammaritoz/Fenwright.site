import type { DashboardData } from "@/content/clients/types";
import type { MessageRow, RecheckReason } from "@/lib/airtable";

/**
 * Portal message threads, one per finding or report draft.
 *
 * A thread's topic is the finding's CVE id, or "report:<cve>:<stage>" for a
 * draft. Clients write from the portal; Fenwright replies by adding a row in
 * the Airtable Messages table with the same topic. A recheck is a client
 * message with a reason; it is closed by a Fenwright reply that sets Outcome.
 *
 * Pure functions: no Airtable here, so the rules are tested directly.
 */

export const RECHECK_REASONS: readonly RecheckReason[] = ["Does not affect us", "Does affect us", "Our build changed", "Other"];
export const MAX_MESSAGE = 2000;

/** Reply times stated next to the box (Services Agreement, Schedule 2). */
export const REPLY_TIMES = { messageBusinessDays: 1, recheckBusinessDays: 2 } as const;

/** How long a new reply from us stays in the client's "Needs you" list. */
export const REPLY_FRESH_DAYS = 7;

export const findingTopic = (cve: string) => cve;
export const reportTopic = (cve: string, stage: string) => `report:${cve}:${stage}`;

/** A topic is valid only if it names a finding or report this client actually has. */
export function topicBelongs(data: DashboardData, topic: string): boolean {
  if (topic.startsWith("report:")) {
    const [, cve, stage] = topic.split(":");
    return data.reports.some((r) => r.cve === cve && r.stage === stage);
  }
  return data.findings.some((f) => f.cve === topic);
}

export type Thread = {
  topic: string;
  messages: MessageRow[];
  /** The latest recheck request, if no Fenwright reply has closed it with an outcome since. */
  openRecheck: MessageRow | null;
  /** The latest closed recheck's outcome. */
  outcome: MessageRow | null;
  /** The last message is the client's, so the ball is with us. */
  awaitingUs: boolean;
  last: MessageRow;
};

export function threadsByTopic(rows: readonly MessageRow[]): Map<string, Thread> {
  const groups = new Map<string, MessageRow[]>();
  for (const m of [...rows].sort((a, b) => a.at.localeCompare(b.at))) {
    const list = groups.get(m.topic) ?? [];
    list.push(m);
    groups.set(m.topic, list);
  }
  const out = new Map<string, Thread>();
  for (const [topic, messages] of groups) {
    let openRecheck: MessageRow | null = null;
    let outcome: MessageRow | null = null;
    for (const m of messages) {
      if (m.author === "Client" && m.recheck) openRecheck = m;
      if (m.author === "Fenwright" && m.outcome) {
        outcome = m;
        openRecheck = null;
      }
    }
    const last = messages[messages.length - 1];
    out.set(topic, { topic, messages, openRecheck, outcome, awaitingUs: last.author === "Client", last });
  }
  return out;
}

/** Threads where we replied within the last REPLY_FRESH_DAYS and the client has not answered since. */
export function freshReplies(threads: Map<string, Thread>, now: Date): Thread[] {
  const since = now.getTime() - REPLY_FRESH_DAYS * 86_400_000;
  return [...threads.values()]
    .filter((t) => t.last.author === "Fenwright" && Date.parse(t.last.at) >= since)
    .sort((a, b) => b.last.at.localeCompare(a.last.at));
}

/** Where a thread lives in the portal. */
export function threadHref(slug: string, topic: string): string {
  if (topic.startsWith("report:")) {
    const [, cve, stage] = topic.split(":");
    return `/portal/${slug}/reports/${cve}/${stage}#thread`;
  }
  return `/portal/${slug}/findings?open=${encodeURIComponent(topic)}#${topic}`;
}

export function topicLabel(topic: string): string {
  if (topic.startsWith("report:")) {
    const [, cve, stage] = topic.split(":");
    return `${cve} ${stage.replace(/_/g, " ")} draft`;
  }
  return topic;
}

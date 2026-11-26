import "server-only";
import { timingSafeEqual } from "node:crypto";
import { allClientSlugs, getClient } from "@/content/clients";
import type { Client } from "@/content/clients/types";
import { queueClientEmail } from "@/lib/airtable";
import { formatMoney } from "@/lib/portal/format";
import { paymentStatus, type PaymentStatus } from "@/lib/portal/subscription";
import { returnBaseUrl } from "@/lib/portal/checkout";

/**
 * The pause rule (Services Agreement 4.5), run without anyone remembering to:
 *
 *  - statuses(): where every client on a plan stands (ok / warn / paused), for
 *    fenwright-watch, which holds back alerts for a paused client.
 *  - sendNotices(): the daily job. Seven days before the pause it emails the
 *    client's contact a written warning with the date and a pay link; on the
 *    pause date it emails that monitoring has paused. Each notice goes once
 *    (keyed on the invoice), through the Airtable Outbox, with a copy to us.
 */

/** Constant-time check of an `Authorization: Bearer <secret>` header against an env var. */
export function bearerOk(header: string | null, secret: string | undefined): boolean {
  if (!secret || !header?.startsWith("Bearer ")) return false;
  const got = Buffer.from(header.slice(7));
  const want = Buffer.from(secret);
  return got.length === want.length && timingSafeEqual(got, want);
}

function planClients(): Client[] {
  return allClientSlugs()
    .map((s) => getClient(s))
    .filter((c): c is Client => Boolean(c?.subscription));
}

export async function statuses(now = new Date()): Promise<PaymentStatus[]> {
  return Promise.all(planClients().map((c) => paymentStatus(c, now)));
}

const day = (iso: string) => new Date(iso).toLocaleDateString("en-IE", { day: "numeric", month: "long", year: "numeric", timeZone: "Europe/Dublin" });

export function noticeFor(client: Client, st: PaymentStatus): { key: string; subject: string; body: string } | null {
  if (!st.invoice || !st.pauseAt || (st.state !== "warn" && st.state !== "paused")) return null;
  const amount = formatMoney(st.invoice.amount, client.currency);
  const ref = st.invoice.number ?? "your latest invoice";
  const pay = st.invoice.hostedUrl ? `Pay it here: ${st.invoice.hostedUrl}` : `Pay it from your portal: ${returnBaseUrl(null)}/portal/${client.slug}`;
  const name = client.business.contact.name.split(" ")[0] || "there";
  if (st.state === "warn") {
    return {
      key: `warn:${client.slug}:${ref}`,
      subject: `Monitoring pauses on ${day(st.pauseAt)} unless ${ref} is paid`,
      body: [
        `Hello ${name},`,
        "",
        `${ref} for ${amount} has not been paid. Under clause 4.5 of our agreement, monitoring of your products pauses on ${day(st.pauseAt)} if it is still unpaid then.`,
        "",
        "While monitoring is paused we do not check new vulnerabilities or draft reports, and your obligations under the CRA stay with you.",
        "",
        pay,
        "",
        "If something is wrong with the invoice, or you need a few more days, reply to this email and we will sort it out.",
        "",
        "Fenwright",
      ].join("\n"),
    };
  }
  return {
    key: `paused:${client.slug}:${ref}`,
    subject: `Monitoring of your products has paused`,
    body: [
      `Hello ${name},`,
      "",
      `${ref} for ${amount} is now more than 14 days overdue, so monitoring of your products paused today under clause 4.5 of our agreement. We are not checking new vulnerabilities or drafting reports until it is paid, and your obligations under the CRA stay with you.`,
      "",
      `${pay}. Monitoring resumes within one business day of payment.`,
      "",
      "Reply to this email if anything is wrong.",
      "",
      "Fenwright",
    ].join("\n"),
  };
}

/** The daily job. Returns what it did, per client, for the cron log. */
export async function sendNotices(now = new Date()): Promise<Record<string, string>> {
  const out: Record<string, string> = {};
  for (const client of planClients()) {
    const st = await paymentStatus(client, now);
    const notice = noticeFor(client, st);
    const to = client.business.contact.email;
    if (!notice) {
      out[client.slug] = st.state;
      continue;
    }
    if (!to) {
      out[client.slug] = `${st.state}: no contact email on file, notice not sent`;
      continue;
    }
    try {
      const sent = await queueClientEmail({ to, subject: notice.subject, body: notice.body, clientSlug: client.slug, key: notice.key });
      out[client.slug] = `${st.state}: ${sent ? "notice queued" : "notice already sent"}`;
    } catch (err) {
      out[client.slug] = `${st.state}: notice failed (${err instanceof Error ? err.message.slice(0, 120) : "error"})`;
    }
  }
  return out;
}

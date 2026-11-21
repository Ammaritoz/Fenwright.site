import "server-only";
import type { Client, InvoiceDoc } from "@/content/clients/types";
import { site } from "@/config/site";
import { VAT_RATE, invoiceTotals } from "@/lib/portal/format";
import { errMeta } from "@/lib/log";

/**
 * Pay an invoice online, without a per-customer command.
 *
 * `npm run stripe:invoice` makes a Stripe-hosted invoice and prints a link that
 * has to be pasted into the client's file. That does not scale past a handful of
 * clients. This does the same job on demand: when a signed-in client presses
 * "Pay online", the server builds a Stripe Checkout page for exactly the balance
 * still owing on that invoice.
 *
 * What makes this safe:
 *  - The amount is computed here from the invoice in the client file, using the
 *    same arithmetic as the invoice page. Nothing about the price comes from
 *    the browser.
 *  - Only a client with a valid portal session reaches it (see startPayment in
 *    app/portal/[client]/actions.ts).
 *  - It talks to Stripe's HTTP API directly with the secret key, so no new
 *    dependency and no key in any client bundle.
 *
 * It does NOT mark the invoice paid. A paid flag is still set in the client file
 * (or by a future webhook); this only collects the money.
 */

/**
 * The Stripe secret key, cleaned. A key pasted into a dashboard often arrives
 * with a trailing newline, a space or surrounding quotes, and Stripe answers any
 * of those with a plain 401.
 */
export function stripeKey(): string | undefined {
  const raw = process.env.STRIPE_SECRET_KEY;
  if (!raw) return undefined;
  const key = raw.trim().replace(/^["']+|["']+$/g, "").trim();
  return key || undefined;
}

/**
 * The non-secret part of a key ("sk_live", "sk_test", "rk_live", "pk_live"), for
 * logs. It tells you at a glance whether a 401 is a wrong kind of key without
 * ever writing the key itself anywhere.
 */
export function stripeKeyKind(key: string | undefined): string {
  const m = /^([a-z]{2}_(?:live|test))_/.exec(key ?? "");
  return m ? m[1] : "unrecognised";
}

export function onlinePaymentAvailable(): boolean {
  return Boolean(stripeKey());
}

/** Where Stripe sends the client back to. Fixed in production, never request-derived there. */
export function returnBaseUrl(requestHost: string | null): string {
  if (process.env.SITE_URL) return process.env.SITE_URL.replace(/\/+$/, "");
  if (process.env.NODE_ENV !== "production" && requestHost) return `http://${requestHost}`;
  return "https://www.fenwright.ie";
}

/** The invoice's totals once money already received (file and Stripe) is taken off. */
export function invoiceBalance(invoice: InvoiceDoc, paidOnline = 0) {
  return invoiceTotals(invoice.lines, {
    vatRate: site.legal.vatNumber ? VAT_RATE : null,
    amountPaid: (invoice.amountPaid ?? 0) + paidOnline,
  });
}

/** True once the invoice is flagged paid in the client file or fully covered. */
export function isSettled(invoice: InvoiceDoc, paidOnline = 0): boolean {
  return Boolean(invoice.paid) || invoiceBalance(invoice, paidOnline).balanceDue <= 0;
}

type StripeSession = {
  id: string;
  payment_status?: string;
  amount_total?: number;
  currency?: string;
  metadata?: Record<string, string>;
};

const paidCache = new Map<string, { at: number; amount: number }>();
const PAID_CACHE_MS = 15_000;

/**
 * How much has been paid online for this invoice, according to Stripe.
 *
 * Stripe is the record of a card payment, so the portal asks it rather than
 * waiting for someone to edit a flag in the client file. It lists recent
 * Checkout Sessions and sums the paid ones tagged with this client and invoice
 * number (createInvoiceCheckout puts both in the session metadata). Listing is
 * immediately consistent, unlike Stripe's search, so a client who has just paid
 * sees it straight away.
 *
 * Fails soft: no key, a network error or a slow Stripe all return 0 (the
 * invoice shows as unpaid) and never block the page. Results are cached for a
 * few seconds so the dashboard and the invoice do not each call Stripe.
 */
export async function stripePaidAmount(client: Client, invoice: InvoiceDoc): Promise<number> {
  const key = stripeKey();
  if (!key) return 0;

  const cacheKey = `${client.slug}:${invoice.number}`;
  const hit = paidCache.get(cacheKey);
  if (hit && Date.now() - hit.at < PAID_CACHE_MS) return hit.amount;

  // Look back to just before the invoice was issued, but never from the future
  // (the worked example's dates are ahead of today).
  const issued = Date.parse(`${invoice.issued}T00:00:00Z`);
  const since = Math.floor((Math.min(Number.isFinite(issued) ? issued : Date.now(), Date.now()) - 3 * 86_400_000) / 1000);

  let total = 0;
  try {
    let after: string | undefined;
    for (let page = 0; page < 3; page++) {
      const q = new URLSearchParams({ limit: "100", "created[gte]": String(since) });
      if (after) q.set("starting_after", after);
      const res = await fetch(`https://api.stripe.com/v1/checkout/sessions?${q}`, {
        headers: { Authorization: `Bearer ${key}` },
        cache: "no-store",
        signal: AbortSignal.timeout(5_000),
      });
      if (!res.ok) throw new Error(`stripe list ${res.status} (${stripeKeyKind(key)})`);
      const body = (await res.json()) as { data?: StripeSession[]; has_more?: boolean };
      for (const s of body.data ?? []) {
        if (
          s.payment_status === "paid" &&
          s.currency?.toLowerCase() === client.currency.toLowerCase() &&
          s.metadata?.fenwright_client === client.slug &&
          s.metadata?.fenwright_invoice === invoice.number
        ) {
          total += s.amount_total ?? 0;
        }
      }
      const last = body.data?.[body.data.length - 1];
      if (!body.has_more || !last) break;
      after = last.id;
    }
  } catch (err) {
    // Our own message here is just a status and the key kind, never a secret.
    console.error("[fenwright] stripe paid lookup failed:", err instanceof Error && err.message.startsWith("stripe list") ? err.message : errMeta(err));
    return 0;
  }
  paidCache.set(cacheKey, { at: Date.now(), amount: total });
  return total;
}

export type CheckoutResult = { ok: true; url: string } | { ok: false; error: string };

export async function createInvoiceCheckout(input: {
  client: Client;
  docSlug: string;
  invoice: InvoiceDoc;
  returnBase: string;
  /** Already collected through Stripe for this invoice (see stripePaidAmount). */
  paidOnline?: number;
}): Promise<CheckoutResult> {
  const key = stripeKey();
  if (!key) return { ok: false, error: "Online payment is not set up yet. Please use the bank details instead." };

  const { client, docSlug, invoice, returnBase } = input;
  const totals = invoiceBalance(invoice, input.paidOnline ?? 0);
  if (invoice.paid || totals.balanceDue <= 0) {
    return { ok: false, error: "This invoice has already been paid." };
  }

  const back = `${returnBase}/portal/${client.slug}/${docSlug}`;
  const form = new URLSearchParams({
    mode: "payment",
    "line_items[0][quantity]": "1",
    "line_items[0][price_data][currency]": client.currency.toLowerCase(),
    "line_items[0][price_data][unit_amount]": String(totals.balanceDue),
    "line_items[0][price_data][product_data][name]": `Invoice ${invoice.number}`,
    "line_items[0][price_data][product_data][description]": `${site.legal.entityName}, ${client.business.name}`,
    success_url: `${back}?payment=success`,
    cancel_url: `${back}?payment=cancelled`,
    client_reference_id: client.slug,
    "metadata[fenwright_client]": client.slug,
    "metadata[fenwright_invoice]": invoice.number,
    "payment_intent_data[metadata][fenwright_client]": client.slug,
    "payment_intent_data[metadata][fenwright_invoice]": invoice.number,
  });
  if (client.business.contact.email) form.set("customer_email", client.business.contact.email);

  try {
    const res = await fetch("https://api.stripe.com/v1/checkout/sessions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${key}`,
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: form,
      signal: AbortSignal.timeout(10_000),
    });
    const data = (await res.json().catch(() => ({}))) as { url?: string; error?: { type?: string; code?: string } };
    if (!res.ok || !data.url || !data.url.startsWith("https://checkout.stripe.com/")) {
      // Log the error class only: Stripe messages can echo request fields.
      console.error("[fenwright] stripe checkout failed:", res.status, data.error?.type, data.error?.code, `key=${stripeKeyKind(key)}`);
      return { ok: false, error: "We could not open the payment page just now. Please try again, or email us." };
    }
    return { ok: true, url: data.url };
  } catch (err) {
    console.error("[fenwright] stripe checkout failed:", errMeta(err));
    return { ok: false, error: "We could not open the payment page just now. Please try again, or email us." };
  }
}

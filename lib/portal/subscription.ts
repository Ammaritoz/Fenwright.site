import "server-only";
import type { Client } from "@/content/clients/types";
import { BILLING_INTERVALS, OVERDUE, PLANS, periodPrice, type BillingInterval } from "@/config/plans";
import { stripeKey, stripeKeyKind } from "@/lib/portal/checkout";
import { errMeta } from "@/lib/log";

/**
 * Automatic billing for a client on a plan (config/plans.ts).
 *
 * The client chooses monthly or quarterly in the portal and saves a card or
 * SEPA direct debit on a Stripe Checkout page in subscription mode. From then
 * on Stripe makes every invoice, collects it, retries a failed charge and
 * emails the receipt. Nobody generates an invoice by hand.
 *
 * The portal reads the state straight from Stripe on each visit (cached a few
 * seconds), the same way checkout.ts reads one-off payments, so there is no
 * webhook or database to keep in step. The subscription is found through the
 * completed Checkout Session tagged with the client's slug: listing sessions is
 * immediately consistent, so the card updates the moment the client returns.
 *
 * Same safety rules as checkout.ts: the price is computed here from the plan,
 * never taken from the browser; only a signed-in client reaches the actions;
 * Stripe is called over HTTP with the secret key, so no key reaches a bundle.
 *
 * Stripe key permissions this needs (on top of Checkout Sessions write):
 * Subscriptions read, Invoices read, Customer portal write.
 */

const API = "https://api.stripe.com/v1";
const DAY = 86_400_000;
const CACHE_MS = 10_000;

export type SubscriptionInvoice = {
  number: string | null;
  amount: number;
  status: "paid" | "open" | "void" | "uncollectible" | "draft";
  created: string;
  periodStart: string | null;
  periodEnd: string | null;
  hostedUrl: string | null;
  pdfUrl: string | null;
};

export type Billing =
  | { state: "unavailable" }
  | { state: "not-set-up" }
  | {
      state: "active" | "past-due" | "ended";
      interval: BillingInterval | null;
      amount: number;
      /** When Stripe next charges, or null once it has ended. */
      nextChargeAt: string | null;
      endsAt: string | null;
      customer: string;
      invoices: SubscriptionInvoice[];
      /** The oldest invoice still owing, with the dates the overdue rule gives. */
      overdue: { invoice: SubscriptionInvoice; dueAt: string; warnAt: string; pauseAt: string; paused: boolean } | null;
    };

const cache = new Map<string, { at: number; value: Billing }>();

async function stripe<T>(path: string, key: string, init?: { method?: string; body?: URLSearchParams }): Promise<T> {
  const res = await fetch(`${API}${path}`, {
    method: init?.method ?? "GET",
    headers: {
      Authorization: `Bearer ${key}`,
      ...(init?.body ? { "Content-Type": "application/x-www-form-urlencoded" } : {}),
    },
    body: init?.body,
    cache: "no-store",
    signal: AbortSignal.timeout(8_000),
  });
  const data = (await res.json().catch(() => ({}))) as T & { error?: { type?: string; code?: string } };
  if (!res.ok) {
    // The error class only: Stripe messages can echo request fields.
    throw new Error(`stripe ${path.split("?")[0]} ${res.status} ${data.error?.type ?? ""} ${data.error?.code ?? ""} (${stripeKeyKind(key)})`);
  }
  return data;
}

const iso = (sec: number | null | undefined) => (sec ? new Date(sec * 1000).toISOString() : null);

/** The overdue dates for an uncollected invoice (Services Agreement 4.3, 4.5). */
export function overdueDates(createdIso: string) {
  const created = Date.parse(createdIso);
  const due = created + OVERDUE.dueDays * DAY;
  const pause = due + OVERDUE.pauseAfterDays * DAY;
  return {
    dueAt: new Date(due).toISOString(),
    warnAt: new Date(pause - OVERDUE.warnDaysBefore * DAY).toISOString(),
    pauseAt: new Date(pause).toISOString(),
  };
}

type StripeSub = {
  id: string;
  status: string;
  customer: string;
  cancel_at?: number | null;
  ended_at?: number | null;
  current_period_end?: number;
  items?: { data?: { current_period_end?: number; price?: { unit_amount?: number; recurring?: { interval?: string; interval_count?: number } } }[] };
};

type StripeInvoice = {
  number: string | null;
  amount_due: number;
  amount_remaining: number;
  status: SubscriptionInvoice["status"];
  created: number;
  period_start?: number;
  period_end?: number;
  hosted_invoice_url?: string | null;
  invoice_pdf?: string | null;
  lines?: { data?: { period?: { start?: number; end?: number } }[] };
};

function intervalOf(sub: StripeSub): BillingInterval | null {
  const months = sub.items?.data?.[0]?.price?.recurring?.interval_count ?? 0;
  const found = (Object.keys(BILLING_INTERVALS) as BillingInterval[]).find((k) => BILLING_INTERVALS[k].months === months);
  return found ?? null;
}

/** The newest subscription this client set up through the portal, if any. */
async function findSubscriptionId(client: Client, key: string): Promise<string | null> {
  let after: string | undefined;
  for (let page = 0; page < 3; page++) {
    const q = new URLSearchParams({ limit: "100", status: "complete" });
    if (after) q.set("starting_after", after);
    const body = await stripe<{ data?: { id: string; mode?: string; subscription?: string | null; metadata?: Record<string, string> }[]; has_more?: boolean }>(
      `/checkout/sessions?${q}`,
      key,
    );
    for (const s of body.data ?? []) {
      if (s.mode === "subscription" && s.subscription && s.metadata?.fenwright_client === client.slug) return s.subscription;
    }
    const last = body.data?.[body.data.length - 1];
    if (!body.has_more || !last) break;
    after = last.id;
  }
  return null;
}

/**
 * What the client's automatic billing looks like right now. Fails soft: any
 * Stripe problem gives "unavailable" and never blocks the page.
 */
export async function getBilling(client: Client, now = new Date()): Promise<Billing> {
  if (!client.subscription) return { state: "not-set-up" };
  const key = stripeKey();
  if (!key) return { state: "unavailable" };

  const hit = cache.get(client.slug);
  if (hit && Date.now() - hit.at < CACHE_MS) return hit.value;

  let value: Billing;
  try {
    const id = await findSubscriptionId(client, key);
    if (!id) {
      value = { state: "not-set-up" };
    } else {
      const sub = await stripe<StripeSub>(`/subscriptions/${encodeURIComponent(id)}`, key);
      const list = await stripe<{ data?: StripeInvoice[] }>(`/invoices?${new URLSearchParams({ subscription: id, limit: "12" })}`, key);
      const invoices: SubscriptionInvoice[] = (list.data ?? [])
        // A €0 invoice is Stripe's record of the set-up before the start date, not a bill.
        .filter((i) => i.amount_due > 0 && i.status !== "draft")
        .map((i) => {
          const period = i.lines?.data?.[0]?.period;
          return {
            number: i.number,
            amount: i.amount_due,
            status: i.status,
            created: iso(i.created)!,
            periodStart: iso(period?.start ?? i.period_start),
            periodEnd: iso(period?.end ?? i.period_end),
            hostedUrl: i.hosted_invoice_url ?? null,
            pdfUrl: i.invoice_pdf ?? null,
          };
        });

      const owing = invoices.filter((i) => i.status === "open").sort((a, b) => a.created.localeCompare(b.created))[0];
      const overdue = owing
        ? (() => {
            const d = overdueDates(owing.created);
            return { invoice: owing, ...d, paused: now.getTime() >= Date.parse(d.pauseAt) };
          })()
        : null;

      const ended = ["canceled", "incomplete_expired"].includes(sub.status);
      const periodEnd = sub.items?.data?.[0]?.current_period_end ?? sub.current_period_end;
      value = {
        state: ended ? "ended" : overdue || ["past_due", "unpaid"].includes(sub.status) ? "past-due" : "active",
        interval: intervalOf(sub),
        amount: sub.items?.data?.[0]?.price?.unit_amount ?? 0,
        nextChargeAt: ended || sub.cancel_at ? null : iso(periodEnd),
        endsAt: iso(sub.ended_at ?? sub.cancel_at),
        customer: sub.customer,
        invoices,
        overdue,
      };
    }
  } catch (err) {
    console.error("[fenwright] stripe billing lookup failed:", err instanceof Error && err.message.startsWith("stripe ") ? err.message : errMeta(err));
    return { state: "unavailable" };
  }
  cache.set(client.slug, { at: Date.now(), value });
  return value;
}

export type CheckoutResult = { ok: true; url: string } | { ok: false; error: string };

const FAIL = "We could not open the payment page just now. Please try again, or email us.";

/**
 * A Stripe Checkout page that sets up the client's plan at the interval they
 * chose. Before the start date it only saves the payment method: the first
 * charge lands on `startsOn` (billing anchor, no proration).
 */
export async function createSubscriptionCheckout(input: {
  client: Client;
  interval: BillingInterval;
  returnBase: string;
  now?: Date;
}): Promise<CheckoutResult> {
  const { client, interval, returnBase } = input;
  const now = input.now ?? new Date();
  const key = stripeKey();
  if (!key) return { ok: false, error: "Online payment is not set up yet. Please email us." };
  if (client.onlinePayment === false || !client.subscription) {
    return { ok: false, error: "Automatic payment is not available for this account. Please email us." };
  }

  const existing = await getBilling(client, now);
  if (existing.state === "unavailable") return { ok: false, error: FAIL };
  if (existing.state === "active" || existing.state === "past-due") {
    return { ok: false, error: "Automatic payment is already set up for this account." };
  }

  const plan = PLANS[client.subscription.plan];
  const { months, label } = BILLING_INTERVALS[interval];
  const back = `${returnBase}/portal/${client.slug}`;
  const form = new URLSearchParams({
    mode: "subscription",
    "line_items[0][quantity]": "1",
    "line_items[0][price_data][currency]": client.currency.toLowerCase(),
    "line_items[0][price_data][unit_amount]": String(periodPrice(client.subscription.plan, interval)),
    "line_items[0][price_data][recurring][interval]": "month",
    "line_items[0][price_data][recurring][interval_count]": String(months),
    "line_items[0][price_data][product_data][name]": `${plan.name}, billed ${label.toLowerCase()}`,
    success_url: `${back}?billing=ready`,
    cancel_url: `${back}?billing=cancelled`,
    client_reference_id: client.slug,
    "metadata[fenwright_client]": client.slug,
    "metadata[fenwright_plan]": client.subscription.plan,
    "subscription_data[metadata][fenwright_client]": client.slug,
    "subscription_data[metadata][fenwright_plan]": client.subscription.plan,
    "subscription_data[description]": `${plan.description}, ${client.business.name}`,
  });

  // Nothing is charged before the Monitoring Start Date (Services Agreement 4.3).
  // Stripe wants an anchor comfortably in the future; within two days, start now.
  const start = Date.parse(`${client.subscription.startsOn}T00:00:00Z`);
  if (Number.isFinite(start) && start - now.getTime() > 2 * DAY) {
    form.set("subscription_data[billing_cycle_anchor]", String(Math.floor(start / 1000)));
    form.set("subscription_data[proration_behavior]", "none");
  }
  if (client.business.contact.email) form.set("customer_email", client.business.contact.email);

  try {
    const data = await stripe<{ url?: string }>("/checkout/sessions", key, { method: "POST", body: form });
    if (!data.url?.startsWith("https://checkout.stripe.com/")) throw new Error("stripe checkout: no url");
    cache.delete(client.slug);
    return { ok: true, url: data.url };
  } catch (err) {
    console.error("[fenwright] stripe subscription checkout failed:", err instanceof Error ? err.message : errMeta(err));
    return { ok: false, error: FAIL };
  }
}

/** Stripe's own page for changing the card or direct debit, and seeing past invoices. */
export async function createBillingPortal(input: { client: Client; returnBase: string }): Promise<CheckoutResult> {
  const key = stripeKey();
  if (!key) return { ok: false, error: FAIL };
  const billing = await getBilling(input.client);
  if (!("customer" in billing)) return { ok: false, error: "Automatic payment is not set up for this account yet." };
  try {
    const data = await stripe<{ url?: string }>("/billing_portal/sessions", key, {
      method: "POST",
      body: new URLSearchParams({ customer: billing.customer, return_url: `${input.returnBase}/portal/${input.client.slug}` }),
    });
    if (!data.url?.startsWith("https://billing.stripe.com/")) throw new Error("stripe billing portal: no url");
    return { ok: true, url: data.url };
  } catch (err) {
    console.error("[fenwright] stripe billing portal failed:", err instanceof Error ? err.message : errMeta(err));
    return { ok: false, error: "We could not open the billing page just now. Please email us." };
  }
}

import "server-only";
import type { Client } from "@/content/clients/types";
import { BILLING_INTERVALS, OVERDUE, PLANS, periodPrice, type BillingInterval, type PlanId } from "@/config/plans";
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
 * Each plan and interval is a real Stripe Price (found by lookup key, made on
 * first use), so Stripe's own billing page can let the client switch between
 * monthly and quarterly. A Sprint credit (Services Agreement 4.4) goes on the
 * Stripe customer as a credit balance, which Stripe takes off each invoice
 * until it is used up.
 *
 * The portal reads the state straight from Stripe on each visit (cached a few
 * seconds), so there is no webhook or database to keep in step. The
 * subscription is found through the completed Checkout Session tagged with the
 * client's slug: listing sessions is immediately consistent, so the card
 * updates the moment the client returns.
 *
 * Same safety rules as checkout.ts: prices come from config/plans.ts on the
 * server, never from the browser; only a signed-in client reaches the actions;
 * Stripe is called over HTTP with the secret key, so no key reaches a bundle.
 *
 * Stripe key permissions this needs: Checkout Sessions write, Customers write,
 * Products write, Prices write, Subscriptions read, Invoices read, Customer
 * portal write.
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
      /** Sprint credit not yet used, in minor units. */
      creditLeft: number;
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
  const data = (await res.json().catch(() => ({}))) as T & { error?: { type?: string; code?: string; param?: string } };
  if (!res.ok) {
    // The error class only: Stripe messages can echo request fields.
    const e = data.error;
    throw new StripeError(
      `stripe ${init?.method ?? "GET"} ${path.split("?")[0]} ${res.status} ${e?.type ?? ""} ${e?.code ?? ""} ${e?.param ?? ""} (${stripeKeyKind(key)})`,
      res.status,
      e?.code,
    );
  }
  return data;
}

class StripeError extends Error {
  constructor(message: string, readonly status: number, readonly code?: string) {
    super(message);
  }
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
      const [list, customer] = await Promise.all([
        stripe<{ data?: StripeInvoice[] }>(`/invoices?${new URLSearchParams({ subscription: id, limit: "12" })}`, key),
        stripe<{ balance?: number }>(`/customers/${encodeURIComponent(sub.customer)}`, key).catch(() => ({ balance: 0 })),
      ]);
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
        creditLeft: Math.max(0, -(customer.balance ?? 0)),
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

// --- Stripe objects this module owns -----------------------------------------

const productId = (plan: PlanId) => `fenwright-${plan}`;
const lookupKey = (plan: PlanId, interval: BillingInterval, currency: string) => `${plan}-${interval}-${currency.toLowerCase()}`;
const priceCache = new Map<string, string>();

/** The Stripe Product for a plan, made once with a fixed id. */
async function ensureProduct(plan: PlanId, key: string): Promise<string> {
  const id = productId(plan);
  try {
    await stripe(`/products/${id}`, key);
  } catch (err) {
    if (!(err instanceof StripeError) || err.status !== 404) throw err;
    await stripe("/products", key, {
      method: "POST",
      body: new URLSearchParams({ id, name: PLANS[plan].name, description: PLANS[plan].description, "metadata[fenwright_plan]": plan }),
    });
  }
  return id;
}

/**
 * The Stripe Price for a plan at an interval, by lookup key. Made on first use;
 * if the plan's price in config/plans.ts changes, a new Price takes the lookup
 * key over, and existing subscriptions keep theirs until changed.
 */
async function ensurePrice(plan: PlanId, interval: BillingInterval, currency: string, key: string): Promise<string> {
  const lk = lookupKey(plan, interval, currency);
  const cached = priceCache.get(lk);
  if (cached) return cached;
  const amount = periodPrice(plan, interval);
  const found = await stripe<{ data?: { id: string; unit_amount?: number }[] }>(
    `/prices?${new URLSearchParams({ "lookup_keys[]": lk, active: "true", limit: "1" })}`,
    key,
  );
  let id = found.data?.[0] && found.data[0].unit_amount === amount ? found.data[0].id : null;
  if (!id) {
    const product = await ensureProduct(plan, key);
    const made = await stripe<{ id: string }>("/prices", key, {
      method: "POST",
      body: new URLSearchParams({
        product,
        currency: currency.toLowerCase(),
        unit_amount: String(amount),
        "recurring[interval]": "month",
        "recurring[interval_count]": String(BILLING_INTERVALS[interval].months),
        lookup_key: lk,
        transfer_lookup_key: "true",
        nickname: `${PLANS[plan].name}, ${BILLING_INTERVALS[interval].label.toLowerCase()}`,
      }),
    });
    id = made.id;
  }
  priceCache.set(lk, id);
  return id;
}

/**
 * This client's Stripe customer, made once and tagged with their slug. A Sprint
 * credit is added as a credit balance once: the customer's metadata records it,
 * so going back to checkout again can never add it twice.
 */
async function ensureCustomer(client: Client, key: string): Promise<string> {
  const email = client.business.contact.email;
  const credit = client.subscription?.sprintCredit ?? 0;
  let mine: { id: string; metadata?: Record<string, string> } | undefined;
  if (email) {
    const list = await stripe<{ data?: { id: string; metadata?: Record<string, string> }[] }>(
      `/customers?${new URLSearchParams({ email, limit: "20" })}`,
      key,
    );
    mine = list.data?.find((c) => c.metadata?.fenwright_client === client.slug);
  }
  if (!mine) {
    const body = new URLSearchParams({ name: client.business.name, "metadata[fenwright_client]": client.slug });
    if (email) body.set("email", email);
    mine = await stripe<{ id: string }>("/customers", key, { method: "POST", body });
  }
  if (credit > 0 && !mine.metadata?.fenwright_sprint_credit) {
    await stripe(`/customers/${encodeURIComponent(mine.id)}/balance_transactions`, key, {
      method: "POST",
      body: new URLSearchParams({
        amount: String(-credit),
        currency: client.currency.toLowerCase(),
        description: "Readiness Sprint fee credited against Core (Services Agreement 4.4)",
      }),
    });
    await stripe(`/customers/${encodeURIComponent(mine.id)}`, key, {
      method: "POST",
      body: new URLSearchParams({ "metadata[fenwright_sprint_credit]": String(credit) }),
    });
  }
  return mine.id;
}

const PORTAL_TAG = "fenwright-v1";
let portalConfig: string | null = null;

/**
 * Stripe's billing page, set up for our plans: the client can switch between
 * monthly and quarterly, change their card or direct debit, update billing
 * details and download invoices. They cannot cancel there: ending Core goes by
 * written notice under the agreement. A switch to monthly waits for the end of
 * the period already paid for; a switch to quarterly starts now, with the
 * unused part credited (Services Agreement 4.3).
 */
async function ensurePortalConfig(key: string): Promise<string> {
  if (portalConfig) return portalConfig;
  const list = await stripe<{ data?: { id: string; metadata?: Record<string, string> }[] }>(
    "/billing_portal/configurations?active=true&limit=100",
    key,
  );
  const existing = list.data?.find((c) => c.metadata?.fenwright === PORTAL_TAG);
  if (existing) return (portalConfig = existing.id);

  const body = new URLSearchParams({
    "business_profile[headline]": "Fenwright billing",
    "features[payment_method_update][enabled]": "true",
    "features[invoice_history][enabled]": "true",
    "features[customer_update][enabled]": "true",
    "features[customer_update][allowed_updates][0]": "email",
    "features[customer_update][allowed_updates][1]": "address",
    "features[customer_update][allowed_updates][2]": "tax_id",
    "features[subscription_cancel][enabled]": "false",
    "features[subscription_update][enabled]": "true",
    "features[subscription_update][default_allowed_updates][0]": "price",
    "features[subscription_update][proration_behavior]": "always_invoice",
    "features[subscription_update][schedule_at_period_end][conditions][0][type]": "shortening_interval",
    "metadata[fenwright]": PORTAL_TAG,
  });
  let i = 0;
  for (const plan of Object.keys(PLANS) as PlanId[]) {
    body.set(`features[subscription_update][products][${i}][product]`, await ensureProduct(plan, key));
    let j = 0;
    for (const interval of Object.keys(BILLING_INTERVALS) as BillingInterval[]) {
      body.set(`features[subscription_update][products][${i}][prices][${j++}]`, await ensurePrice(plan, interval, "eur", key));
    }
    i++;
  }
  const made = await stripe<{ id: string }>("/billing_portal/configurations", key, { method: "POST", body });
  return (portalConfig = made.id);
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
  const back = `${returnBase}/portal/${client.slug}`;
  let price: string;
  let customer: string;
  try {
    price = await ensurePrice(client.subscription.plan, interval, client.currency, key);
    customer = await ensureCustomer(client, key);
  } catch (err) {
    console.error("[fenwright] stripe subscription setup failed:", err instanceof Error ? err.message : errMeta(err));
    return { ok: false, error: FAIL };
  }

  const form = new URLSearchParams({
    mode: "subscription",
    customer,
    "line_items[0][quantity]": "1",
    "line_items[0][price]": price,
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
  // Within one billing period, a billing anchor ("€0 due today, then ..."). Stripe
  // refuses an anchor further off than that, so beyond it the wait is a trial,
  // which Stripe labels "free"; the note under the button says what it is.
  // Closer than 48 hours, billing simply starts now.
  const start = Date.parse(`${client.subscription.startsOn}T00:00:00Z`);
  if (Number.isFinite(start) && start - now.getTime() > 2 * DAY) {
    const at = String(Math.floor(start / 1000));
    if (start - now.getTime() < BILLING_INTERVALS[interval].months * 28 * DAY) {
      form.set("subscription_data[billing_cycle_anchor]", at);
      form.set("subscription_data[proration_behavior]", "none");
    } else {
      form.set("subscription_data[trial_end]", at);
    }
    const when = new Date(start).toLocaleDateString("en-IE", { day: "numeric", month: "long", year: "numeric", timeZone: "UTC" });
    form.set(
      "custom_text[submit][message]",
      `Monitoring starts on ${when} and the first payment is taken then, under your agreement. Until then we are onboarding your products.`,
    );
  }

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

/** Stripe's own billing page: switch monthly or quarterly, change the card or direct debit, see invoices. */
export async function createBillingPortal(input: { client: Client; returnBase: string }): Promise<CheckoutResult> {
  const key = stripeKey();
  if (!key) return { ok: false, error: FAIL };
  const billing = await getBilling(input.client);
  if (!("customer" in billing)) return { ok: false, error: "Automatic payment is not set up for this account yet." };
  try {
    const configuration = await ensurePortalConfig(key);
    const data = await stripe<{ url?: string }>("/billing_portal/sessions", key, {
      method: "POST",
      body: new URLSearchParams({ customer: billing.customer, configuration, return_url: `${input.returnBase}/portal/${input.client.slug}` }),
    });
    if (!data.url?.startsWith("https://billing.stripe.com/")) throw new Error("stripe billing portal: no url");
    cache.delete(input.client.slug);
    return { ok: true, url: data.url };
  } catch (err) {
    console.error("[fenwright] stripe billing portal failed:", err instanceof Error ? err.message : errMeta(err));
    return { ok: false, error: "We could not open the billing page just now. Please email us." };
  }
}

// --- Payment status for the pause rule ----------------------------------------

export type PaymentStatus = {
  slug: string;
  /** ok: nothing overdue. warn: inside the 7 days before the pause. paused: past the pause date. */
  state: "ok" | "warn" | "paused" | "unknown";
  pauseAt: string | null;
  invoice: { number: string | null; amount: number; hostedUrl: string | null } | null;
};

/**
 * Where a client stands under the pause rule (Services Agreement 4.5), for the
 * daily notices job and for fenwright-watch. "unknown" when Stripe cannot be
 * read: callers must treat that as not paused, so our own outage never stops
 * monitoring.
 */
export async function paymentStatus(client: Client, now = new Date()): Promise<PaymentStatus> {
  const b = await getBilling(client, now);
  if (b.state === "unavailable") return { slug: client.slug, state: "unknown", pauseAt: null, invoice: null };
  if (!("overdue" in b) || !b.overdue) return { slug: client.slug, state: "ok", pauseAt: null, invoice: null };
  const o = b.overdue;
  const state = o.paused ? "paused" : now.getTime() >= Date.parse(o.warnAt) ? "warn" : "ok";
  return {
    slug: client.slug,
    state,
    pauseAt: o.pauseAt,
    invoice: { number: o.invoice.number, amount: o.invoice.amount, hostedUrl: o.invoice.hostedUrl },
  };
}

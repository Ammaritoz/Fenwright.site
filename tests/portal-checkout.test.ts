import { beforeEach, describe, expect, it, vi } from "vitest";
import { clientCanPayOnline, createInvoiceCheckout, isSettled, onlinePaymentAvailable, returnBaseUrl, stripeKey, stripeKeyKind, stripePaidAmount } from "@/lib/portal/checkout";
import type { Client, InvoiceDoc } from "@/content/clients/types";

/**
 * Online payment builds a Stripe Checkout page for an invoice's balance. These
 * tests pin the properties that matter with money: the amount is derived from
 * the invoice (never supplied by a caller), a settled invoice cannot be paid
 * again, the secret key stays in the Authorization header, and a bad Stripe
 * response never yields a redirect to somewhere other than Stripe.
 */

const client = {
  slug: "acme-12345678",
  currency: "EUR",
  business: { name: "Acme Ltd", contact: { name: "A", email: "a@example.com" } },
} as unknown as Client;

const invoice = (over: Partial<InvoiceDoc> = {}): InvoiceDoc => ({
  type: "invoice",
  number: "INV-007",
  issued: "2027-01-01",
  due: "2027-01-15",
  lines: [{ kind: "Sprint", description: "Sprint", quantity: 1, unitPrice: 200000 }],
  ...over,
});

const fetchMock = vi.fn();

beforeEach(() => {
  fetchMock.mockReset();
  vi.stubGlobal("fetch", fetchMock);
  vi.stubEnv("STRIPE_SECRET_KEY", "sk_test_dummy_do_not_use");
});

function stripeReplies(body: unknown, ok = true) {
  fetchMock.mockResolvedValue({ ok, status: ok ? 200 : 400, json: async () => body });
}

describe("createInvoiceCheckout", () => {
  it("charges exactly the balance due, in the client's currency, and tags the invoice", async () => {
    stripeReplies({ url: "https://checkout.stripe.com/c/pay/cs_test_123" });
    const r = await createInvoiceCheckout({
      client, docSlug: "invoice-007", invoice: invoice({ amountPaid: 50000 }), returnBase: "https://www.fenwright.ie",
    });
    expect(r).toEqual({ ok: true, url: "https://checkout.stripe.com/c/pay/cs_test_123" });

    const [url, init] = fetchMock.mock.calls[0];
    expect(url).toBe("https://api.stripe.com/v1/checkout/sessions");
    expect(init.headers.Authorization).toBe("Bearer sk_test_dummy_do_not_use");
    const body = new URLSearchParams(init.body as URLSearchParams);
    expect(body.get("line_items[0][price_data][unit_amount]")).toBe("150000"); // 2000.00 less 500.00 already paid
    expect(body.get("line_items[0][price_data][currency]")).toBe("eur");
    expect(body.get("metadata[fenwright_invoice]")).toBe("INV-007");
    expect(body.get("client_reference_id")).toBe("acme-12345678");
    expect(body.get("success_url")).toBe("https://www.fenwright.ie/portal/acme-12345678/invoice-007?payment=success");
    expect(body.get("cancel_url")).toBe("https://www.fenwright.ie/portal/acme-12345678/invoice-007?payment=cancelled");
    // The key must never end up in the request body.
    expect(String(init.body)).not.toContain("sk_test");
  });

  it("refuses an invoice that is already paid or fully covered, without calling Stripe", async () => {
    for (const inv of [invoice({ paid: true }), invoice({ amountPaid: 200000 })]) {
      const r = await createInvoiceCheckout({ client, docSlug: "invoice-007", invoice: inv, returnBase: "https://x" });
      expect(r.ok).toBe(false);
    }
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("says online payment is unavailable when no Stripe key is set", async () => {
    vi.stubEnv("STRIPE_SECRET_KEY", "");
    const r = await createInvoiceCheckout({ client, docSlug: "invoice-007", invoice: invoice(), returnBase: "https://x" });
    expect(r.ok).toBe(false);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("never redirects anywhere but Stripe, even if the response says otherwise", async () => {
    stripeReplies({ url: "https://evil.example/pay" });
    const r = await createInvoiceCheckout({ client, docSlug: "invoice-007", invoice: invoice(), returnBase: "https://x" });
    expect(r.ok).toBe(false);
  });

  it("fails calmly, without leaking Stripe's message, when Stripe rejects or is unreachable", async () => {
    stripeReplies({ error: { type: "invalid_request_error", message: "secret detail" } }, false);
    let r = await createInvoiceCheckout({ client, docSlug: "invoice-007", invoice: invoice(), returnBase: "https://x" });
    expect(r.ok).toBe(false);
    expect(JSON.stringify(r)).not.toContain("secret detail");

    fetchMock.mockRejectedValue(new Error("network down"));
    r = await createInvoiceCheckout({ client, docSlug: "invoice-007", invoice: invoice(), returnBase: "https://x" });
    expect(r.ok).toBe(false);
  });
});

describe("returnBaseUrl", () => {
  it("uses SITE_URL when set, and a fixed production address otherwise, never a request header", () => {
    vi.stubEnv("SITE_URL", "https://portal.example.com/");
    expect(returnBaseUrl("evil.example")).toBe("https://portal.example.com");
    vi.stubEnv("SITE_URL", "");
    vi.stubEnv("NODE_ENV", "production");
    expect(returnBaseUrl("evil.example")).toBe("https://www.fenwright.ie");
    vi.stubEnv("NODE_ENV", "development");
    expect(returnBaseUrl("localhost:3001")).toBe("http://localhost:3001");
  });
});

describe("stripePaidAmount and isSettled", () => {
  const session = (over: Record<string, unknown> = {}) => ({
    id: "cs_" + Math.random().toString(36).slice(2),
    payment_status: "paid",
    amount_total: 200000,
    currency: "eur",
    metadata: { fenwright_client: "acme-12345678", fenwright_invoice: "INV-100" },
    ...over,
  });
  // Each test uses its own invoice number so the short in-memory cache never carries over.
  let n = 100;
  const inv = () => invoice({ number: `INV-${++n}` });
  const list = (data: unknown[], has_more = false) =>
    fetchMock.mockResolvedValueOnce({ ok: true, status: 200, json: async () => ({ data, has_more }) });
  const meta = (invNumber: string, slug = "acme-12345678") => ({ fenwright_client: slug, fenwright_invoice: invNumber });

  it("sums paid sessions for this client and invoice, and nothing else", async () => {
    const i = inv();
    list([
      session({ metadata: meta(i.number), amount_total: 150000 }),
      session({ metadata: meta(i.number), amount_total: 50000 }),
      session({ metadata: meta(i.number), payment_status: "unpaid" }), // abandoned checkout
      session({ metadata: meta("INV-OTHER") }), // a different invoice
      session({ metadata: meta(i.number, "someone-else-00000000") }), // a different client
      session({ metadata: meta(i.number), currency: "gbp" }), // a different currency
    ]);
    expect(await stripePaidAmount(client, i)).toBe(200000);
    const [url, init] = fetchMock.mock.calls[0];
    expect(String(url)).toContain("https://api.stripe.com/v1/checkout/sessions?");
    expect(init.headers.Authorization).toBe("Bearer sk_test_dummy_do_not_use");
  });

  it("follows Stripe's pagination", async () => {
    const i = inv();
    list([session({ id: "cs_a", metadata: meta(i.number), amount_total: 1000 })], true);
    list([session({ id: "cs_b", metadata: meta(i.number), amount_total: 2000 })], false);
    expect(await stripePaidAmount(client, i)).toBe(3000);
    expect(String(fetchMock.mock.calls[1][0])).toContain("starting_after=cs_a");
  });

  it("returns 0 and never throws when Stripe is down, slow or the key is missing", async () => {
    fetchMock.mockRejectedValueOnce(new Error("network down"));
    expect(await stripePaidAmount(client, inv())).toBe(0);
    fetchMock.mockResolvedValueOnce({ ok: false, status: 500, json: async () => ({}) });
    expect(await stripePaidAmount(client, inv())).toBe(0);
    vi.stubEnv("STRIPE_SECRET_KEY", "");
    fetchMock.mockClear();
    expect(await stripePaidAmount(client, inv())).toBe(0);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("calls Stripe once for repeated lookups of the same invoice within the cache window", async () => {
    const i = inv();
    list([session({ metadata: meta(i.number) })]);
    await stripePaidAmount(client, i);
    await stripePaidAmount(client, i);
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it("treats an invoice as settled once the file flag or online payments cover it", () => {
    expect(isSettled(invoice())).toBe(false);
    expect(isSettled(invoice({ paid: true }))).toBe(true);
    expect(isSettled(invoice(), 200000)).toBe(true); // paid in full through Stripe
    expect(isSettled(invoice(), 100000)).toBe(false); // part paid
    expect(isSettled(invoice({ amountPaid: 50000 }), 150000)).toBe(true); // file deposit plus Stripe
  });

  it("will not open a second checkout for money already collected", async () => {
    const r = await createInvoiceCheckout({ client, docSlug: "invoice-007", invoice: invoice(), returnBase: "https://x", paidOnline: 200000 });
    expect(r.ok).toBe(false);
    expect(fetchMock).not.toHaveBeenCalled();
  });
});

describe("the Stripe key as pasted into a dashboard", () => {
  it("is cleaned of whitespace, newlines and quotes", () => {
    for (const pasted of ["sk_test_abc123", "  sk_test_abc123\n", '"sk_test_abc123"', "'sk_test_abc123'\r\n", ' "sk_test_abc123" ']) {
      vi.stubEnv("STRIPE_SECRET_KEY", pasted);
      expect(stripeKey(), JSON.stringify(pasted)).toBe("sk_test_abc123");
    }
  });

  it("counts as not set when it is empty or only whitespace", () => {
    for (const blank of ["", "   ", "\n", '""']) {
      vi.stubEnv("STRIPE_SECRET_KEY", blank);
      expect(stripeKey(), JSON.stringify(blank)).toBeUndefined();
      expect(onlinePaymentAvailable()).toBe(false);
    }
  });

  it("is sent to Stripe cleaned, in the Authorization header", async () => {
    vi.stubEnv("STRIPE_SECRET_KEY", ' "sk_test_abc123"\n');
    stripeReplies({ url: "https://checkout.stripe.com/c/pay/cs_test_1" });
    await createInvoiceCheckout({ client, docSlug: "invoice-007", invoice: invoice(), returnBase: "https://www.fenwright.ie" });
    expect((fetchMock.mock.calls[0][1] as { headers: Record<string, string> }).headers.Authorization).toBe("Bearer sk_test_abc123");
  });

  it("names only the kind of key for the logs, never the key", () => {
    expect(stripeKeyKind("sk_live_abcdef")).toBe("sk_live");
    expect(stripeKeyKind("sk_test_abcdef")).toBe("sk_test");
    expect(stripeKeyKind("rk_live_abcdef")).toBe("rk_live");
    expect(stripeKeyKind("pk_live_abcdef")).toBe("pk_live");
    expect(stripeKeyKind("whsec_abcdef")).toBe("unrecognised");
    expect(stripeKeyKind(undefined)).toBe("unrecognised");
    expect(stripeKeyKind("sk_live_abcdef")).not.toContain("abcdef");
  });

  it("logs the key kind, and not the key, when Stripe refuses it", async () => {
    vi.stubEnv("STRIPE_SECRET_KEY", "pk_live_SECRETSECRET");
    const log = vi.spyOn(console, "error").mockImplementation(() => {});
    stripeReplies({ error: { type: "invalid_request_error" } }, false);
    const r = await createInvoiceCheckout({ client, docSlug: "invoice-007", invoice: invoice(), returnBase: "https://www.fenwright.ie" });
    expect(r.ok).toBe(false);
    const logged = JSON.stringify(log.mock.calls);
    expect(logged).toContain("pk_live");
    expect(logged).not.toContain("SECRETSECRET");
    log.mockRestore();
  });
});

describe("a client with online payment turned off", () => {
  const demo = { ...client, onlinePayment: false } as unknown as Client;

  it("is refused by the server without ever calling Stripe", async () => {
    stripeReplies({ url: "https://checkout.stripe.com/c/pay/cs_live_1" });
    const r = await createInvoiceCheckout({ client: demo, docSlug: "invoice-007", invoice: invoice(), returnBase: "https://www.fenwright.ie" });
    expect(r.ok).toBe(false);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("is not offered the Pay button even though Stripe is set up", () => {
    expect(onlinePaymentAvailable()).toBe(true);
    expect(clientCanPayOnline(demo)).toBe(false);
    expect(clientCanPayOnline(client)).toBe(true);
    expect(clientCanPayOnline({ onlinePayment: true } as Client)).toBe(true);
  });

  it("everyone else still pays online as before", async () => {
    stripeReplies({ url: "https://checkout.stripe.com/c/pay/cs_test_1" });
    const r = await createInvoiceCheckout({ client, docSlug: "invoice-007", invoice: invoice(), returnBase: "https://www.fenwright.ie" });
    expect(r.ok).toBe(true);
  });
});

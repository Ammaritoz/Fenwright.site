import { beforeEach, describe, expect, it, vi } from "vitest";

/**
 * Regression for the server-actions session gap found in the security audit.
 *
 * acceptAgreement and submitFeedback write contract-acceptance and testimonial
 * records. middleware.ts only gates page URLs under /portal/:path* (and lets
 * /unlock through), but a server action is dispatched by action ID and can
 * arrive on a path the middleware does not gate. So each action must verify the
 * session itself, for the tenant it names, before writing anything.
 */

// vi.mock calls are hoisted above module-level variables, so anything the
// factories use has to come from vi.hoisted.
const { cookieJar, getAgreementAcceptance, getFeedbackSubmission, logAgreementAcceptance, logClientFeedback, logCompletion } = vi.hoisted(() => ({
  logCompletion: vi.fn(async (..._args: unknown[]) => {}),
  cookieJar: new Map<string, string>(),
  getFeedbackSubmission: vi.fn(async (..._args: unknown[]) => null as null | { name: string; at: string }),
  getAgreementAcceptance: vi.fn(async (..._args: unknown[]) => null as null | { name: string; at: string }),
  logAgreementAcceptance: vi.fn(async (..._args: unknown[]) => {}),
  logClientFeedback: vi.fn(async (..._args: unknown[]) => {}),
}));

vi.mock("next/headers", () => ({
  cookies: () => ({
    get: (name: string) => (cookieJar.has(name) ? { name, value: cookieJar.get(name)! } : undefined),
    set: vi.fn(),
  }),
  headers: () => new Headers({ "user-agent": "vitest", "x-real-ip": "203.0.113.9" }),
}));
vi.mock("next/navigation", () => ({ redirect: vi.fn() }));

vi.mock("@/lib/airtable", () => ({ getAgreementAcceptance, getFeedbackSubmission, logAgreementAcceptance, logClientFeedback, logCompletion }));
vi.mock("@/lib/portal/dashboard", () => ({
  getDashboard: async () => {
    const { dashboardFixture } = await import("@/lib/portal/dashboard-fixture");
    return { ok: true, data: dashboardFixture() };
  },
}));
const { createInvoiceCheckout } = vi.hoisted(() => ({
  createInvoiceCheckout: vi.fn(async (..._a: unknown[]) => ({ ok: true as const, url: "https://checkout.stripe.com/c/pay/cs_test_1" })),
}));
vi.mock("@/lib/portal/checkout", () => ({ createInvoiceCheckout, returnBaseUrl: () => "https://www.fenwright.ie", stripePaidAmount: async () => 0 }));
vi.mock("@/lib/ratelimit", () => ({ rateLimit: vi.fn(async () => ({ success: true })) }));

import { acceptAgreement, markItemDone, markReportSubmitted, startPayment, submitFeedback, unlockPortal } from "@/app/portal/[client]/actions";
import { rateLimit } from "@/lib/ratelimit";
import { questionItemId, reportItemId } from "@/lib/portal/action-items";
import { redirect } from "next/navigation";
import { sessionCookieName, signSession } from "@/lib/portal/cookie";

// The fictional worked-example client registered in content/clients/index.ts.
const SLUG = "lowmoor-controls-222d0f7e";

function acceptForm(over: Record<string, string> = {}) {
  const f = new FormData();
  for (const [k, v] of Object.entries({ slug: SLUG, docSlug: "agreement", fullName: "Test Signatory", confirmed: "on", ...over })) {
    f.set(k, v);
  }
  return f;
}
function feedbackForm(over: Record<string, string> = {}) {
  const f = new FormData();
  for (const [k, v] of Object.entries({ slug: SLUG, docSlug: "feedback", ratings: "{}", answers: "{}", testimonial: "", name: "T", ...over })) {
    f.set(k, v);
  }
  return f;
}

beforeEach(() => {
  vi.stubEnv("PORTAL_COOKIE_SECRET", "0".repeat(64));
  cookieJar.clear();
  getAgreementAcceptance.mockReset();
  getAgreementAcceptance.mockResolvedValue(null);
  getFeedbackSubmission.mockReset();
  getFeedbackSubmission.mockResolvedValue(null);
  logAgreementAcceptance.mockClear();
  logClientFeedback.mockClear();
  createInvoiceCheckout.mockClear();
  logCompletion.mockClear();
  vi.mocked(redirect).mockClear();
});

describe("acceptAgreement session gate", () => {
  it("refuses and writes nothing with no session cookie", async () => {
    const r = await acceptAgreement({}, acceptForm());
    expect(r.ok).toBeUndefined();
    expect(r.error).toMatch(/session/i);
    expect(logAgreementAcceptance).not.toHaveBeenCalled();
  });

  it("refuses a session minted for a different client", async () => {
    cookieJar.set(sessionCookieName(SLUG), await signSession("another-client-00000000"));
    const r = await acceptAgreement({}, acceptForm());
    expect(r.error).toMatch(/session/i);
    expect(logAgreementAcceptance).not.toHaveBeenCalled();
  });

  it("refuses a tampered cookie", async () => {
    const good = await signSession(SLUG);
    cookieJar.set(sessionCookieName(SLUG), good.slice(0, -2) + "00");
    const r = await acceptAgreement({}, acceptForm());
    expect(r.error).toMatch(/session/i);
    expect(logAgreementAcceptance).not.toHaveBeenCalled();
  });

  it("fails closed when the cookie secret is missing", async () => {
    cookieJar.set(sessionCookieName(SLUG), await signSession(SLUG));
    vi.stubEnv("PORTAL_COOKIE_SECRET", "");
    const r = await acceptAgreement({}, acceptForm());
    expect(r.error).toMatch(/session/i);
    expect(logAgreementAcceptance).not.toHaveBeenCalled();
  });

  it("records the acceptance for a valid session on that client", async () => {
    cookieJar.set(sessionCookieName(SLUG), await signSession(SLUG));
    const r = await acceptAgreement({}, acceptForm());
    expect(r.ok).toBe(true);
    expect(logAgreementAcceptance).toHaveBeenCalledOnce();
    expect(logAgreementAcceptance).toHaveBeenCalledWith(
      expect.objectContaining({ clientSlug: SLUG, documentSlug: "agreement", signatoryName: "Test Signatory" })
    );
  });

  it("refuses a second signature once the agreement is already signed", async () => {
    cookieJar.set(sessionCookieName(SLUG), await signSession(SLUG));
    getAgreementAcceptance.mockResolvedValue({ name: "First Signer", at: "2027-01-12T10:00:00.000Z" });
    const r = await acceptAgreement({}, acceptForm());
    expect(r.ok).toBeUndefined();
    expect(r.error).toMatch(/already been signed/i);
    expect(logAgreementAcceptance).not.toHaveBeenCalled();
    expect(getAgreementAcceptance).toHaveBeenCalledWith(SLUG, "agreement");
  });

  it("refuses a docSlug that is not this client's agreement, even with a valid session", async () => {
    cookieJar.set(sessionCookieName(SLUG), await signSession(SLUG));
    for (const docSlug of ["does-not-exist", "invoice-001", "feedback"]) {
      const r = await acceptAgreement({}, acceptForm({ docSlug }));
      expect(r.ok).toBeUndefined();
    }
    expect(logAgreementAcceptance).not.toHaveBeenCalled();
  });
});

describe("submitFeedback session gate", () => {
  it("refuses and writes nothing with no session cookie", async () => {
    const r = await submitFeedback({}, feedbackForm());
    expect(r.ok).toBeUndefined();
    expect(r.error).toMatch(/session/i);
    expect(logClientFeedback).not.toHaveBeenCalled();
  });

  it("refuses a session minted for a different client", async () => {
    cookieJar.set(sessionCookieName(SLUG), await signSession("another-client-00000000"));
    const r = await submitFeedback({}, feedbackForm());
    expect(r.error).toMatch(/session/i);
    expect(logClientFeedback).not.toHaveBeenCalled();
  });

  it("saves feedback for a valid session on that client", async () => {
    cookieJar.set(sessionCookieName(SLUG), await signSession(SLUG));
    const r = await submitFeedback({}, feedbackForm());
    expect(r.ok).toBe(true);
    expect(logClientFeedback).toHaveBeenCalledOnce();
  });

  it("refuses a second submission once feedback has already been sent", async () => {
    cookieJar.set(sessionCookieName(SLUG), await signSession(SLUG));
    getFeedbackSubmission.mockResolvedValue({ name: "First", at: "2027-01-12T10:00:00.000Z" });
    const r = await submitFeedback({}, feedbackForm());
    expect(r.ok).toBeUndefined();
    expect(r.error).toMatch(/already have your feedback/i);
    expect(logClientFeedback).not.toHaveBeenCalled();
  });

  it("refuses a docSlug that is not this client's feedback form", async () => {
    cookieJar.set(sessionCookieName(SLUG), await signSession(SLUG));
    for (const docSlug of ["does-not-exist", "agreement"]) {
      const r = await submitFeedback({}, feedbackForm({ docSlug }));
      expect(r.ok).toBeUndefined();
    }
    expect(logClientFeedback).not.toHaveBeenCalled();
  });
});

describe("startPayment", () => {
  const payForm = (over: Record<string, string> = {}) => {
    const f = new FormData();
    for (const [k, v] of Object.entries({ slug: SLUG, docSlug: "invoice-001", ...over })) f.set(k, v);
    return f;
  };

  it("opens no payment page without a session", async () => {
    const r = await startPayment({}, payForm());
    expect(r.error).toMatch(/session/i);
    expect(createInvoiceCheckout).not.toHaveBeenCalled();
    expect(redirect).not.toHaveBeenCalled();
  });

  it("refuses a session for a different client", async () => {
    cookieJar.set(sessionCookieName(SLUG), await signSession("another-client-00000000"));
    const r = await startPayment({}, payForm());
    expect(r.error).toMatch(/session/i);
    expect(createInvoiceCheckout).not.toHaveBeenCalled();
  });

  it("only pays invoices: any other document slug is refused", async () => {
    cookieJar.set(sessionCookieName(SLUG), await signSession(SLUG));
    for (const docSlug of ["agreement", "does-not-exist"]) {
      const r = await startPayment({}, payForm({ docSlug }));
      expect(r.error).toBeTruthy();
    }
    expect(createInvoiceCheckout).not.toHaveBeenCalled();
  });

  it("sends a signed-in client to Stripe for their own invoice, taking no amount from the form", async () => {
    cookieJar.set(sessionCookieName(SLUG), await signSession(SLUG));
    const f = payForm();
    f.set("amount", "1"); // a forged price must be ignored
    await startPayment({}, f);
    expect(createInvoiceCheckout).toHaveBeenCalledOnce();
    const arg = createInvoiceCheckout.mock.calls[0][0] as { client: { slug: string }; docSlug: string; invoice: { number: string } };
    expect(arg.client.slug).toBe(SLUG);
    expect(arg.docSlug).toBe("invoice-001");
    expect(arg.invoice.number).toBe("INV-001");
    expect(redirect).toHaveBeenCalledWith("https://checkout.stripe.com/c/pay/cs_test_1");
  });
});

describe("markItemDone", () => {
  const doneForm = (itemId: string, slug = SLUG) => {
    const f = new FormData();
    f.set("slug", slug);
    f.set("itemId", itemId);
    return f;
  };
  const REPORT = reportItemId({ cve: "CVE-2026-31337", stage: "early_warning" });
  const QUESTION = questionItemId({
    cve: "CVE-2026-18810",
    question: "Is CONFIG_NF_TABLES enabled in the 2.5 kernel build? A yes or no settles this one.",
  });

  it("records nothing without a session", async () => {
    const r = await markItemDone({}, doneForm(REPORT));
    expect(r.error).toMatch(/session/i);
    expect(logCompletion).not.toHaveBeenCalled();
  });

  it("refuses a session for a different client", async () => {
    cookieJar.set(sessionCookieName(SLUG), await signSession("another-client-00000000"));
    const r = await markItemDone({}, doneForm(REPORT));
    expect(r.error).toMatch(/session/i);
    expect(logCompletion).not.toHaveBeenCalled();
  });

  it("marks an open report draft done, recording who and what", async () => {
    cookieJar.set(sessionCookieName(SLUG), await signSession(SLUG));
    const r = await markItemDone({}, doneForm(REPORT));
    expect(r.ok).toBe(true);
    expect(logCompletion).toHaveBeenCalledOnce();
    expect(logCompletion).toHaveBeenCalledWith(
      expect.objectContaining({ clientSlug: SLUG, itemId: REPORT, kind: "report", ip: "203.0.113.9" })
    );
  });

  it("marks an open engineer question done", async () => {
    cookieJar.set(sessionCookieName(SLUG), await signSession(SLUG));
    const r = await markItemDone({}, doneForm(QUESTION));
    expect(r.ok).toBe(true);
    expect(logCompletion).toHaveBeenCalledWith(expect.objectContaining({ itemId: QUESTION, kind: "question" }));
  });

  it("refuses ids that are invented, or that belong to items a client cannot clear", async () => {
    cookieJar.set(sessionCookieName(SLUG), await signSession(SLUG));
    for (const id of ["report:CVE-0000-0000:final", "question:CVE-2026-18810:nope", "invoice:invoice-001", "upload", "agreement:agreement", "../../x"]) {
      const r = await markItemDone({}, doneForm(id));
      expect(r.ok, id).toBeUndefined();
      expect(r.error, id).toBeTruthy();
    }
    expect(logCompletion).not.toHaveBeenCalled();
  });

  it("tells the client when saving fails, instead of pretending it worked", async () => {
    cookieJar.set(sessionCookieName(SLUG), await signSession(SLUG));
    logCompletion.mockRejectedValueOnce(new Error("airtable down"));
    const r = await markItemDone({}, doneForm(REPORT));
    expect(r.ok).toBeUndefined();
    expect(r.error).toMatch(/could not save/i);
  });
});

describe("unlockPortal", () => {
  // The worked-example client's passcode is printed in its own file header.
  const PASSCODE = "9XCR5-SY2D2";
  const unlockForm = (passcode: string, next: string | null = null, slug = SLUG) => {
    const f = new FormData();
    f.set("slug", slug);
    f.set("passcode", passcode);
    if (next !== null) f.set("next", next);
    return f;
  };
  const home = `/portal/${SLUG}`;

  it("opens the portal with the right passcode however it is typed", async () => {
    for (const typed of [PASSCODE, "9xcr5-sy2d2", "9XCR5SY2D2", "9xcr5 sy2d2", "  9XCR5 - SY2D2  "]) {
      vi.mocked(redirect).mockClear();
      // A successful unlock redirects (which throws in real Next), so it returns no state.
      const r = await unlockPortal({}, unlockForm(typed));
      expect(r?.error, typed).toBeUndefined();
      expect(redirect, typed).toHaveBeenCalledWith(home);
    }
  });

  it("refuses a wrong passcode and does not redirect", async () => {
    const r = await unlockPortal({}, unlockForm("AAAAA-BBBBB"));
    expect(r.error).toMatch(/not right/i);
    expect(redirect).not.toHaveBeenCalled();
  });

  it("refuses an unknown client with the same message as a wrong passcode", async () => {
    const r = await unlockPortal({}, unlockForm(PASSCODE, null, "nobody-00000000"));
    expect(r.error).toMatch(/not right/i);
    expect(redirect).not.toHaveBeenCalled();
  });

  it("sends the visitor back to the page they asked for, inside their own portal", async () => {
    await unlockPortal({}, unlockForm(PASSCODE, `${home}/invoice-001`));
    expect(redirect).toHaveBeenCalledWith(`${home}/invoice-001`);
  });

  it("never redirects anywhere outside the portal", async () => {
    for (const next of ["//evil.example", "https://evil.example/x", "/", "/api/contact", "/portal/another-client-00000000/agreement", "javascript:alert(1)", `${home}x`]) {
      vi.mocked(redirect).mockClear();
      await unlockPortal({}, unlockForm(PASSCODE, next));
      expect(redirect, next).toHaveBeenCalledWith(home);
    }
  });

  it("checks nothing when the rate limit says stop", async () => {
    vi.mocked(rateLimit).mockResolvedValueOnce({ success: false } as never);
    const r = await unlockPortal({}, unlockForm(PASSCODE));
    expect(r.error).toMatch(/too many attempts/i);
    expect(redirect).not.toHaveBeenCalled();
  });

  it("rejects malformed input without throwing", async () => {
    const f = new FormData();
    f.set("slug", SLUG);
    const r = await unlockPortal({}, f);
    expect(r.error).toBeTruthy();
    expect(redirect).not.toHaveBeenCalled();
  });
});

describe("markReportSubmitted", () => {
  const form = (over: Record<string, string> = {}) => {
    const f = new FormData();
    for (const [k, v] of Object.entries({ slug: SLUG, cve: "CVE-2026-31337", stage: "early_warning", confirmed: "yes", ...over })) {
      f.set(k, v);
    }
    return f;
  };

  it("records nothing without a session", async () => {
    const r = await markReportSubmitted({}, form());
    expect(r.error).toMatch(/session/i);
    expect(logCompletion).not.toHaveBeenCalled();
  });

  it("needs the confirmation tick", async () => {
    cookieJar.set(sessionCookieName(SLUG), await signSession(SLUG));
    const f = form();
    f.delete("confirmed");
    const r = await markReportSubmitted({}, f);
    expect(r.error).toMatch(/tick/i);
    expect(logCompletion).not.toHaveBeenCalled();
  });

  it("refuses a draft that is not in this client's snapshot", async () => {
    cookieJar.set(sessionCookieName(SLUG), await signSession(SLUG));
    const r = await markReportSubmitted({}, form({ cve: "CVE-2099-0001" }));
    expect(r.error).toMatch(/no longer available/i);
    expect(logCompletion).not.toHaveBeenCalled();
  });

  it("records the submission against the dashboard item's id, so the deadline clears", async () => {
    cookieJar.set(sessionCookieName(SLUG), await signSession(SLUG));
    const r = await markReportSubmitted({}, form());
    expect(r.ok).toBe(true);
    expect(logCompletion).toHaveBeenCalledOnce();
    const arg = logCompletion.mock.calls[0][0] as { itemId: string; kind: string; title: string };
    expect(arg.itemId).toBe(reportItemId({ cve: "CVE-2026-31337", stage: "early_warning" }));
    expect(arg.kind).toBe("report");
    expect(arg.title).toMatch(/Submitted the 24-hour early warning/);
  });
});

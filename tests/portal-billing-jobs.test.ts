import { describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));

import { getClient } from "@/content/clients";
import { bearerOk, noticeFor } from "@/lib/portal/billing-jobs";

const client = getClient("lowmoor-controls-222d0f7e")!;
const invoice = { number: "F-0007", amount: 75000, hostedUrl: "https://invoice.stripe.com/i/x" };

describe("pause-rule notices (Services Agreement 4.5)", () => {
  it("send nothing while nothing is overdue", () => {
    expect(noticeFor(client, { slug: client.slug, state: "ok", pauseAt: null, invoice: null })).toBeNull();
    expect(noticeFor(client, { slug: client.slug, state: "unknown", pauseAt: null, invoice: null })).toBeNull();
  });

  it("warn with the pause date, the amount and a pay link, keyed once per invoice", () => {
    const n = noticeFor(client, { slug: client.slug, state: "warn", pauseAt: "2027-02-01T00:00:00.000Z", invoice })!;
    expect(n.key).toBe(`warn:${client.slug}:F-0007`);
    expect(n.subject).toContain("1 February 2027");
    expect(n.body).toContain("€750.00");
    expect(n.body).toContain(invoice.hostedUrl);
    expect(n.body).toMatch(/obligations under the CRA stay with you/);
  });

  it("tell the client the day monitoring pauses, with a different key", () => {
    const n = noticeFor(client, { slug: client.slug, state: "paused", pauseAt: "2027-02-01T00:00:00.000Z", invoice })!;
    expect(n.key).toBe(`paused:${client.slug}:F-0007`);
    expect(n.body).toMatch(/resumes within one business day/);
  });
});

describe("bearerOk", () => {
  it("accepts only the exact secret", () => {
    expect(bearerOk("Bearer s3cret", "s3cret")).toBe(true);
    expect(bearerOk("Bearer s3cre", "s3cret")).toBe(false);
    expect(bearerOk("s3cret", "s3cret")).toBe(false);
    expect(bearerOk(null, "s3cret")).toBe(false);
    expect(bearerOk("Bearer ", undefined)).toBe(false);
  });
});

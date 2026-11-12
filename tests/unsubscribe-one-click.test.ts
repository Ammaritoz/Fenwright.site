import { beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";

const addUnsubscribe = vi.fn();
const rateLimit = vi.fn();
vi.mock("@/lib/suppression", () => ({ addUnsubscribe: (e: string) => addUnsubscribe(e) }));
vi.mock("@/lib/ratelimit", () => ({ rateLimit: (...a: unknown[]) => rateLimit(...a) }));

import { GET, POST } from "@/app/api/unsubscribe/one-click/route";

// RFC 8058: the mail provider POSTs "List-Unsubscribe=One-Click" as a form to the URL in
// the List-Unsubscribe header, from its own servers (no Origin, no JSON, no cookies).
function oneClick(query: string, body = "List-Unsubscribe=One-Click") {
  return new NextRequest(`https://fenwright.ie/api/unsubscribe/one-click${query}`, {
    method: "POST",
    headers: { "content-type": "application/x-www-form-urlencoded" },
    body,
  });
}

describe("one-click unsubscribe", () => {
  beforeEach(() => {
    addUnsubscribe.mockReset().mockResolvedValue(true);
    rateLimit.mockReset().mockResolvedValue({ success: true, remaining: 9, reset: 0 });
  });

  it("unsubscribes the email from the query on a one-click POST", async () => {
    const res = await POST(oneClick("?email=Owner%40Roofco.ie"));
    expect(res.status).toBe(200);
    expect(addUnsubscribe).toHaveBeenCalledWith("owner@roofco.ie");
  });

  it("rejects a POST without the one-click body", async () => {
    const res = await POST(oneClick("?email=owner%40roofco.ie", "something=else"));
    expect(res.status).toBe(400);
    expect(addUnsubscribe).not.toHaveBeenCalled();
  });

  it("rejects a missing or invalid email", async () => {
    expect((await POST(oneClick(""))).status).toBe(400);
    expect((await POST(oneClick("?email=not-an-email"))).status).toBe(400);
    expect(addUnsubscribe).not.toHaveBeenCalled();
  });

  it("returns 429 when rate limited", async () => {
    rateLimit.mockResolvedValue({ success: false, remaining: 0, reset: 0 });
    expect((await POST(oneClick("?email=owner%40roofco.ie"))).status).toBe(429);
    expect(addUnsubscribe).not.toHaveBeenCalled();
  });

  it("returns 500 when the opt-out couldn't be stored", async () => {
    addUnsubscribe.mockResolvedValue(false);
    expect((await POST(oneClick("?email=owner%40roofco.ie"))).status).toBe(500);
  });

  it("sends a GET (someone opening the link) to the normal unsubscribe page", async () => {
    const res = await GET(new NextRequest("https://fenwright.ie/api/unsubscribe/one-click?email=owner%40roofco.ie"));
    expect([302, 303, 307]).toContain(res.status);
    expect(res.headers.get("location")).toBe("https://fenwright.ie/unsubscribe?email=owner%40roofco.ie");
    expect(addUnsubscribe).not.toHaveBeenCalled();
  });
});

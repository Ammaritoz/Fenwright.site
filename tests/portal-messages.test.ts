import { describe, expect, it } from "vitest";
import { dashboardFixture } from "@/lib/portal/dashboard-fixture";
import type { MessageRow } from "@/lib/airtable";
import { freshReplies, reportTopic, threadHref, threadsByTopic, topicBelongs } from "@/lib/portal/messages";

const row = (over: Partial<MessageRow>): MessageRow => ({
  id: Math.random().toString(36).slice(2),
  topic: "CVE-2026-1",
  author: "Client",
  body: "hello",
  recheck: null,
  outcome: null,
  at: "2026-11-20T10:00:00.000Z",
  ...over,
});

describe("threads", () => {
  it("keep a recheck open until a Fenwright reply sets an outcome", () => {
    const open = threadsByTopic([row({ recheck: "Does not affect us" }), row({ author: "Fenwright", at: "2026-11-20T11:00:00.000Z" })]);
    expect(open.get("CVE-2026-1")!.openRecheck).not.toBeNull();

    const closed = threadsByTopic([
      row({ recheck: "Does not affect us" }),
      row({ author: "Fenwright", outcome: "Decision kept", at: "2026-11-20T11:00:00.000Z" }),
    ]);
    const t = closed.get("CVE-2026-1")!;
    expect(t.openRecheck).toBeNull();
    expect(t.outcome?.outcome).toBe("Decision kept");
    expect(t.awaitingUs).toBe(false);
  });

  it("list a reply from us as fresh for a week, and not once the client answers", () => {
    const now = new Date("2026-11-22T00:00:00.000Z");
    const replied = threadsByTopic([row({}), row({ author: "Fenwright", at: "2026-11-21T09:00:00.000Z" })]);
    expect(freshReplies(replied, now)).toHaveLength(1);
    expect(freshReplies(replied, new Date("2026-12-05T00:00:00.000Z"))).toHaveLength(0);

    const answered = threadsByTopic([row({ author: "Fenwright", at: "2026-11-21T09:00:00.000Z" }), row({ at: "2026-11-21T10:00:00.000Z" })]);
    expect(freshReplies(answered, now)).toHaveLength(0);
  });
});

describe("topics", () => {
  const data = dashboardFixture();
  it("accept only this client's findings and reports", () => {
    expect(topicBelongs(data, data.findings[0].cve)).toBe(true);
    const r = data.reports[0];
    expect(topicBelongs(data, reportTopic(r.cve, r.stage))).toBe(true);
    expect(topicBelongs(data, "CVE-1999-0001")).toBe(false);
    expect(topicBelongs(data, `report:${r.cve}:not_a_stage`)).toBe(false);
  });

  it("link a finding thread so the row opens", () => {
    expect(threadHref("acme", "CVE-2026-1")).toBe("/portal/acme/findings?open=CVE-2026-1#CVE-2026-1");
    expect(threadHref("acme", "report:CVE-2026-1:final")).toBe("/portal/acme/reports/CVE-2026-1/final#thread");
  });
});

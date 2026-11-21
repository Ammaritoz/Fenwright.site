import { beforeEach, describe, expect, it, vi } from "vitest";

/**
 * getAgreementAcceptance builds an Airtable formula from a client slug and a
 * document slug. Both come from the client registry in normal use, but the
 * escaping is what keeps a stray quote from rewriting the filter, so it is
 * tested directly. As in airtable.test.ts, this asserts what the code SENDS,
 * not what Airtable will accept.
 */
const { select, firstPage, create } = vi.hoisted(() => ({ select: vi.fn(), firstPage: vi.fn(), create: vi.fn() }));

vi.mock("airtable", () => ({
  default: class FakeAirtable {
    base() {
      return () => ({ select, create });
    }
  },
}));

beforeEach(() => {
  select.mockReset();
  create.mockReset();
  firstPage.mockReset();
  select.mockReturnValue({ firstPage });
  vi.stubEnv("AIRTABLE_RECORDS_API_KEY", "test-key-do-not-use-in-production");
  vi.stubEnv("AIRTABLE_RECORDS_BASE_ID", "appTestRecords");
});

describe("getAgreementAcceptance", () => {
  it("returns the earliest signature for that client and document", async () => {
    firstPage.mockResolvedValue([{ fields: { SignatoryName: "Declan Farrell", AcceptedAt: "2027-01-12T10:00:00.000Z" } }]);
    const { getAgreementAcceptance } = await import("@/lib/airtable");
    await expect(getAgreementAcceptance("acme-1234abcd", "agreement")).resolves.toEqual({
      name: "Declan Farrell",
      at: "2027-01-12T10:00:00.000Z",
    });
    const opts = select.mock.calls[0][0];
    expect(opts.filterByFormula).toBe("AND({ClientSlug}='acme-1234abcd',{Document}='agreement')");
    expect(opts.sort).toEqual([{ field: "AcceptedAt", direction: "asc" }]);
  });

  it("returns null when nothing has been signed", async () => {
    firstPage.mockResolvedValue([]);
    const { getAgreementAcceptance } = await import("@/lib/airtable");
    await expect(getAgreementAcceptance("acme-1234abcd", "agreement")).resolves.toBeNull();
  });

  it("escapes quotes and backslashes so a value cannot break out of the filter", async () => {
    firstPage.mockResolvedValue([]);
    const { getAgreementAcceptance } = await import("@/lib/airtable");
    await getAgreementAcceptance("a'),TRUE(),('b", "x\\");
    const formula = select.mock.calls[0][0].filterByFormula as string;
    // Input a = a'),TRUE(),('b   input b = x\   (one backslash)
    // Every ' becomes \' and every \ becomes \\, so neither can end the string early.
    expect(formula).toBe("AND({ClientSlug}='a\\'),TRUE(),(\\'b',{Document}='x\\\\')");
  });

  it("returns null rather than throwing when Airtable cannot be read", async () => {
    firstPage.mockRejectedValue(new Error("network down"));
    const { getAgreementAcceptance } = await import("@/lib/airtable");
    await expect(getAgreementAcceptance("acme-1234abcd", "agreement")).resolves.toBeNull();
  });

  it("looks up feedback in the Feedback table by the same client and document", async () => {
    firstPage.mockResolvedValue([{ fields: { RespondentName: "Declan", SubmittedAt: "2027-02-01T09:00:00.000Z" } }]);
    const { getFeedbackSubmission } = await import("@/lib/airtable");
    await expect(getFeedbackSubmission("acme-1234abcd", "feedback")).resolves.toEqual({
      name: "Declan",
      at: "2027-02-01T09:00:00.000Z",
    });
    const opts = select.mock.calls[0][0];
    expect(opts.fields).toEqual(["RespondentName", "SubmittedAt"]);
    expect(opts.filterByFormula).toBe("AND({ClientSlug}='acme-1234abcd',{Document}='feedback')");
  });

  it("returns null when the records base is not configured", async () => {
    vi.stubEnv("AIRTABLE_RECORDS_BASE_ID", "");
    const { getAgreementAcceptance } = await import("@/lib/airtable");
    await expect(getAgreementAcceptance("acme-1234abcd", "agreement")).resolves.toBeNull();
    expect(select).not.toHaveBeenCalled();
  });
});

describe("uploads", () => {
  it("records a new upload once, with its size and time", async () => {
    firstPage.mockResolvedValue([]);
    create.mockResolvedValue([]);
    const { logUpload } = await import("@/lib/airtable");
    await expect(logUpload({ clientSlug: "acme-1234abcd", objectKey: "intake/acme-1234abcd/1-aaaaaaaa.fwenc", bytes: 5000 })).resolves.toBe("created");
    const fields = create.mock.calls[0][0][0].fields;
    expect(fields).toMatchObject({ ClientSlug: "acme-1234abcd", ObjectKey: "intake/acme-1234abcd/1-aaaaaaaa.fwenc", SizeBytes: 5000 });
    expect(typeof fields.ReceivedAt).toBe("string");
  });

  it("does not record the same object twice, so a replayed request is recognised", async () => {
    firstPage.mockResolvedValue([{ fields: { ObjectKey: "x" } }]);
    const { logUpload } = await import("@/lib/airtable");
    await expect(logUpload({ clientSlug: "a", objectKey: "intake/a/1-aaaaaaaa.fwenc", bytes: 1 })).resolves.toBe("exists");
    expect(create).not.toHaveBeenCalled();
  });

  it("never throws when Airtable fails, so a good upload is not reported as failed", async () => {
    firstPage.mockRejectedValue(new Error("table not found"));
    const { logUpload, listUploads } = await import("@/lib/airtable");
    await expect(logUpload({ clientSlug: "a", objectKey: "k", bytes: 1 })).resolves.toBe("unavailable");
    await expect(listUploads("a")).resolves.toEqual([]);
  });

  it("lists a client's uploads newest first", async () => {
    firstPage.mockResolvedValue([
      { fields: { ReceivedAt: "2027-02-02T10:00:00.000Z", SizeBytes: 2000 } },
      { fields: { ReceivedAt: "2027-02-01T10:00:00.000Z", SizeBytes: 1000 } },
    ]);
    const { listUploads } = await import("@/lib/airtable");
    await expect(listUploads("acme-1234abcd")).resolves.toEqual([
      { at: "2027-02-02T10:00:00.000Z", bytes: 2000 },
      { at: "2027-02-01T10:00:00.000Z", bytes: 1000 },
    ]);
    expect(select.mock.calls[0][0].sort).toEqual([{ field: "ReceivedAt", direction: "desc" }]);
  });
});

describe("completions", () => {
  const input = { clientSlug: "acme-1234abcd", itemId: "report:CVE-2026-1:final", kind: "report", title: "Approve it", ip: "203.0.113.9" };

  it("records a completion once for a client and item", async () => {
    firstPage.mockResolvedValue([]);
    create.mockResolvedValue([]);
    const { logCompletion } = await import("@/lib/airtable");
    await logCompletion(input);
    const fields = create.mock.calls[0][0][0].fields;
    expect(fields).toMatchObject({ ItemId: input.itemId, ClientSlug: input.clientSlug, Kind: "report", Ip: "203.0.113.9" });
    expect(select.mock.calls[0][0].filterByFormula).toBe("AND({ClientSlug}='acme-1234abcd',{ItemId}='report:CVE-2026-1:final')");
  });

  it("is idempotent: a double click does not store a second row", async () => {
    firstPage.mockResolvedValue([{ fields: { ItemId: input.itemId } }]);
    const { logCompletion } = await import("@/lib/airtable");
    await logCompletion(input);
    expect(create).not.toHaveBeenCalled();
  });

  it("throws on failure so the client is told, and returns an empty set when it cannot list", async () => {
    firstPage.mockRejectedValue(new Error("403"));
    const { logCompletion, listCompletions } = await import("@/lib/airtable");
    await expect(logCompletion(input)).rejects.toBeTruthy();
    await expect(listCompletions("acme-1234abcd")).resolves.toEqual(new Set());
  });

  it("lists the item ids a client has completed", async () => {
    firstPage.mockResolvedValue([{ fields: { ItemId: "a" } }, { fields: { ItemId: "b" } }]);
    const { listCompletions } = await import("@/lib/airtable");
    await expect(listCompletions("acme-1234abcd")).resolves.toEqual(new Set(["a", "b"]));
  });
});

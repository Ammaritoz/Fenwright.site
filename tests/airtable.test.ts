import { beforeEach, describe, expect, it, vi } from "vitest";

/**
 * lib/airtable.ts builds its field map inline, so the only way to assert what
 * actually reaches the Leads table is to stand in for the SDK. base(baseId)
 * returns a callable that takes a table name, which is the shape the module
 * uses: b("Leads").create([...]).
 */
const create = vi.fn().mockResolvedValue([]);
const tableFn = vi.fn(() => ({ create }));

vi.mock("airtable", () => ({
  default: class FakeAirtable {
    base() {
      return tableFn;
    }
  },
}));

beforeEach(() => {
  vi.clearAllMocks();
  vi.stubEnv("AIRTABLE_API_KEY", "test-airtable-key-do-not-use-in-production");
  vi.stubEnv("AIRTABLE_BASE_ID", "appTestBaseId");
});

function writtenFields(): Record<string, unknown> {
  const records = create.mock.calls[0][0] as Array<{ fields: Record<string, unknown> }>;
  return records[0].fields;
}

describe("logLead", () => {
  // Spec section 7: Leads gains the voice source values plus a CallId link.
  // Without it a voice lead can only be matched to its call by phone number
  // and timestamp.
  it("writes CallId when the lead came from a voice call", async () => {
    const { logLead } = await import("@/lib/airtable");
    await logLead({
      name: "Bob",
      phone: "+353833378541",
      callId: "call_abc123",
      source: "voice-inbound",
    });

    expect(tableFn).toHaveBeenCalledWith("Leads");
    expect(writtenFields().CallId).toBe("call_abc123");
    expect(writtenFields().Source).toBe("voice-inbound");
  });

  it("omits CallId entirely for a lead that came from the website", async () => {
    const { logLead } = await import("@/lib/airtable");
    await logLead({ name: "Bob", phone: "+353833378541", source: "site-contact" });

    expect(writtenFields()).not.toHaveProperty("CallId");
  });

  // The value arrives in a request body, so it gets the same treatment as
  // every other string written to this table.
  it("neutralises a formula in the CallId", async () => {
    const { logLead } = await import("@/lib/airtable");
    await logLead({ name: "Bob", callId: "=cmd|'/c calc'!A1", source: "voice-inbound" });

    expect(String(writtenFields().CallId).startsWith("'")).toBe(true);
  });
});

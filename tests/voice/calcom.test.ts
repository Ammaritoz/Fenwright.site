import { afterEach, describe, expect, it, vi } from "vitest";
import { createBooking, getAvailability, spokenTime } from "@/lib/voice/calcom";

afterEach(() => vi.unstubAllGlobals());

function stubFetch(payload: unknown, ok = true) {
  const fn = vi.fn().mockResolvedValue({
    ok,
    status: ok ? 200 : 500,
    json: async () => payload,
  });
  vi.stubGlobal("fetch", fn);
  return fn;
}

describe("spokenTime", () => {
  it("renders a slot the way a receptionist would say it", () => {
    expect(spokenTime("2026-09-01T09:00:00.000Z", "Europe/Dublin")).toBe(
      "Tuesday the 1st of September at 10am"
    );
  });

  it("says half past for a 30 minute slot", () => {
    expect(spokenTime("2026-09-01T13:30:00.000Z", "Europe/Dublin")).toBe(
      "Tuesday the 1st of September at 2.30pm"
    );
  });
});

describe("getAvailability", () => {
  it("returns spoken slots", async () => {
    stubFetch({ data: { slots: { "2026-09-01": [{ start: "2026-09-01T09:00:00.000Z" }] } } });
    const slots = await getAvailability({ limit: 3 });
    expect(slots[0].startIso).toBe("2026-09-01T09:00:00.000Z");
    expect(slots[0].spoken).toContain("September");
  });

  it("caps the number of options offered", async () => {
    stubFetch({
      data: {
        slots: {
          "2026-09-01": [
            { start: "2026-09-01T09:00:00.000Z" },
            { start: "2026-09-01T10:00:00.000Z" },
            { start: "2026-09-01T11:00:00.000Z" },
            { start: "2026-09-01T12:00:00.000Z" },
          ],
        },
      },
    });
    expect(await getAvailability({ limit: 3 })).toHaveLength(3);
  });

  it("returns an empty list when Cal.com errors", async () => {
    stubFetch({}, false);
    expect(await getAvailability({})).toEqual([]);
  });

  // Regression: date maths on `fromIso` used to run before the try block, so
  // an unparsable fromIso raised RangeError: Invalid time value straight out
  // of the async function instead of resolving to []. See self-review in
  // task-7-report.md.
  it("returns an empty list rather than throwing on an unparsable fromIso", async () => {
    const fn = stubFetch({});
    await expect(getAvailability({ fromIso: "not-a-real-date" })).resolves.toEqual([]);
    expect(fn).not.toHaveBeenCalled();
  });
});

describe("createBooking", () => {
  it("reports success with a reference", async () => {
    stubFetch({ data: { uid: "abc123" } });
    const res = await createBooking({
      slotStart: "2026-09-01T09:00:00.000Z",
      name: "Bob",
      phone: "+353833378541",
    });
    expect(res).toEqual({ ok: true, ref: "abc123" });
  });

  it("reports failure without throwing", async () => {
    stubFetch({ error: "slot taken" }, false);
    const res = await createBooking({
      slotStart: "2026-09-01T09:00:00.000Z",
      name: "Bob",
      phone: "+353833378541",
    });
    expect(res.ok).toBe(false);
  });
});

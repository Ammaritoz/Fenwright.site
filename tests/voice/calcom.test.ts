import { afterEach, describe, expect, it, vi } from "vitest";
import { createBooking, getAvailability, spokenTime } from "@/lib/voice/calcom";
import { limits } from "@/config/limits";

/** Read from config rather than hard-coded, so retuning the budget cannot
 *  leave these tests asserting a deadline the module no longer uses. */
const TIMEOUT_MS = limits.voice.externalTimeoutMs;

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

/**
 * A fetch that never settles until its signal aborts, which is what a hung
 * dependency looks like from inside the module. Rejecting on abort mirrors
 * real fetch, so these tests exercise the same path production would take.
 */
function stubHangingFetch() {
  const fn = vi.fn().mockImplementation((_url: unknown, init?: { signal?: AbortSignal }) => {
    return new Promise((_resolve, reject) => {
      init?.signal?.addEventListener("abort", () => {
        const err = new Error("The operation was aborted.");
        err.name = "AbortError";
        reject(err);
      });
    });
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

  // matchesPartOfDay had no coverage through the public API at all, so the
  // whole filter could have been deleted with every test still green.
  // September is IST in Dublin, so these UTC instants are 9am, 2pm and 7pm.
  describe("partOfDay filtering", () => {
    const acrossTheDay = {
      data: {
        slots: {
          "2026-09-01": [
            { start: "2026-09-01T08:00:00.000Z" },
            { start: "2026-09-01T13:00:00.000Z" },
            { start: "2026-09-01T18:00:00.000Z" },
          ],
        },
      },
    };

    it("offers only morning slots when the caller asked for a morning", async () => {
      stubFetch(acrossTheDay);
      const slots = await getAvailability({ partOfDay: "morning" });
      expect(slots.map((s) => s.startIso)).toEqual(["2026-09-01T08:00:00.000Z"]);
    });

    it("offers only afternoon slots when the caller asked for an afternoon", async () => {
      stubFetch(acrossTheDay);
      const slots = await getAvailability({ partOfDay: "afternoon" });
      expect(slots.map((s) => s.startIso)).toEqual(["2026-09-01T13:00:00.000Z"]);
    });

    it("offers only evening slots when the caller asked for an evening", async () => {
      stubFetch(acrossTheDay);
      const slots = await getAvailability({ partOfDay: "evening" });
      expect(slots.map((s) => s.startIso)).toEqual(["2026-09-01T18:00:00.000Z"]);
    });

    it("offers the whole day when the caller expressed no preference", async () => {
      stubFetch(acrossTheDay);
      const slots = await getAvailability({ partOfDay: "any" });
      expect(slots.map((s) => s.startIso)).toEqual([
        "2026-09-01T08:00:00.000Z",
        "2026-09-01T13:00:00.000Z",
        "2026-09-01T18:00:00.000Z",
      ]);
    });
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

  // Plan Global Constraint: a tool handler has 8 seconds because a live
  // conversation is waiting. A hung Cal.com must resolve to this module's
  // existing sentinel, never reject upward into dead air.
  it("resolves to no slots rather than rejecting when Cal.com hangs", async () => {
    vi.useFakeTimers();
    try {
      stubHangingFetch();
      const pending = getAvailability({});
      await vi.advanceTimersByTimeAsync(TIMEOUT_MS + 1);
      await expect(pending).resolves.toEqual([]);
    } finally {
      vi.useRealTimers();
    }
  });

  it("aborts the availability request rather than waiting on it forever", async () => {
    vi.useFakeTimers();
    try {
      const fn = stubHangingFetch();
      const pending = getAvailability({});
      await vi.advanceTimersByTimeAsync(TIMEOUT_MS + 1);
      await pending;

      const signal = (fn.mock.calls[0][1] as { signal: AbortSignal }).signal;
      expect(signal.aborted).toBe(true);
    } finally {
      vi.useRealTimers();
    }
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

  // Same 8 second budget as availability. A hung booking must land on the
  // module's failure sentinel so the assistant can offer another time.
  it("reports a timeout sentinel rather than rejecting when Cal.com hangs", async () => {
    vi.useFakeTimers();
    try {
      stubHangingFetch();
      const pending = createBooking({
        slotStart: "2026-09-01T09:00:00.000Z",
        name: "Bob",
        phone: "+353833378541",
      });
      await vi.advanceTimersByTimeAsync(TIMEOUT_MS + 1);
      await expect(pending).resolves.toEqual({ ok: false, reason: "timeout" });
    } finally {
      vi.useRealTimers();
    }
  });
});

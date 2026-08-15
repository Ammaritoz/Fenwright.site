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
    text: async () => JSON.stringify(payload),
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
  // A 200 with zero slots is correct on the phone ("nothing showing") but
  // looks identical whether the calendar is genuinely full or the event type
  // ID is simply wrong. Only this warning tells the two apart, so it has to
  // name the actual ID in play.
  it("warns with the full request URL when Cal.com returns 200 but no slots", async () => {
    const warnSpy = vi.spyOn(console, "warn").mockImplementation(() => {});
    stubFetch({ data: { slots: {} } });

    await getAvailability({});

    expect(warnSpy).toHaveBeenCalledWith(expect.stringContaining("eventTypeId=123456"));
    // The key is a header, never a query param, so the logged URL must not
    // be able to leak it even by accident.
    expect(warnSpy.mock.calls[0][0]).not.toContain("test-calcom-key");
    warnSpy.mockRestore();
  });

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

  /**
   * getAvailability returns [] on any non-ok response, so a regression that
   * moved the endpoint or dropped the version header would be indistinguishable
   * from "no slots available": the receptionist would say "I do not have
   * anything showing just now" on every call forever, with every other test in
   * this file still green. These pin the request itself.
   */
  describe("the request it actually sends", () => {
    it("calls the v2 slots endpoint with the configured event type and time zone", async () => {
      const fn = stubFetch({ data: { slots: {} } });
      await getAvailability({ fromIso: "2026-09-03T00:00:00.000Z", timeZone: "Europe/Dublin" });

      const url = fn.mock.calls[0][0] as URL;
      expect(`${url.origin}${url.pathname}`).toBe("https://api.cal.com/v2/slots");
      expect(url.searchParams.get("eventTypeId")).toBe(process.env.CALCOM_EVENT_TYPE_ID);
      expect(url.searchParams.get("timeZone")).toBe("Europe/Dublin");
    });

    it("searches a fortnight forward from the requested start", async () => {
      const fn = stubFetch({ data: { slots: {} } });
      await getAvailability({ fromIso: "2026-09-03T00:00:00.000Z" });

      const url = fn.mock.calls[0][0] as URL;
      expect(url.searchParams.get("start")).toBe("2026-09-03T00:00:00.000Z");
      expect(url.searchParams.get("end")).toBe("2026-09-17T00:00:00.000Z");
    });

    it("authenticates and pins the API version", async () => {
      const fn = stubFetch({ data: { slots: {} } });
      await getAvailability({ fromIso: "2026-09-03T00:00:00.000Z" });

      const init = fn.mock.calls[0][1] as RequestInit;
      const headers = init.headers as Record<string, string>;
      expect(headers.Authorization).toBe(`Bearer ${process.env.CALCOM_API_KEY}`);
      // Cal.com selects the response shape from this header. Dropping it
      // returns a payload this module cannot read, which reads as "no slots".
      expect(headers["cal-api-version"]).toBe("2024-09-04");
      expect(init.method ?? "GET").toBe("GET");
      expect(init.cache).toBe("no-store");
    });
  });

  it("returns an empty list when Cal.com errors", async () => {
    stubFetch({}, false);
    expect(await getAvailability({})).toEqual([]);
  });

  // A non-ok response returns [] the same as genuine "no slots available",
  // which is right for the caller, but silently that is indistinguishable
  // from a misconfigured key or a wrong API host. Only the log line tells
  // the two apart, so it has to actually fire, not fall through to a
  // different catch path.
  it("logs the failing status rather than swallowing it silently", async () => {
    const errSpy = vi.spyOn(console, "error").mockImplementation(() => {});
    stubFetch({ message: "Invalid API Key" }, false);

    await getAvailability({});

    expect(errSpy).toHaveBeenCalledWith(expect.stringContaining("500"));
    errSpy.mockRestore();
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

  // Same reasoning as the availability request tests: createBooking reports
  // ok: false for any non-ok response, so a wrong endpoint, a wrong version
  // header or a malformed body all look identical to "that slot is taken".
  describe("the request it actually sends", () => {
    const args = {
      slotStart: "2026-09-01T09:00:00.000Z",
      name: "Bob",
      phone: "+353833378541",
    };

    it("posts to the v2 bookings endpoint, authenticated and version pinned", async () => {
      const fn = stubFetch({ data: { uid: "abc123" } });
      await createBooking(args);

      const [url, init] = fn.mock.calls[0] as [string, RequestInit];
      expect(url).toBe("https://api.cal.com/v2/bookings");
      expect(init.method).toBe("POST");

      const headers = init.headers as Record<string, string>;
      expect(headers.Authorization).toBe(`Bearer ${process.env.CALCOM_API_KEY}`);
      // A different version from the slots endpoint, and deliberately so.
      expect(headers["cal-api-version"]).toBe("2024-08-13");
      expect(headers["Content-Type"]).toBe("application/json");
    });

    it("sends the slot, the numeric event type and the attendee", async () => {
      const fn = stubFetch({ data: { uid: "abc123" } });
      await createBooking(args);

      const init = fn.mock.calls[0][1] as RequestInit;
      expect(JSON.parse(init.body as string)).toEqual({
        start: "2026-09-01T09:00:00.000Z",
        // Cal.com rejects a string here, and CALCOM_EVENT_TYPE_ID is a string.
        eventTypeId: Number(process.env.CALCOM_EVENT_TYPE_ID),
        attendee: {
          name: "Bob",
          phoneNumber: "+353833378541",
          timeZone: "Europe/Dublin",
          language: "en",
        },
      });
    });

    it("carries the notes through when the caller gave any", async () => {
      const fn = stubFetch({ data: { uid: "abc123" } });
      await createBooking({ ...args, notes: "Fuse board tripping" });

      const init = fn.mock.calls[0][1] as RequestInit;
      const body = JSON.parse(init.body as string);
      expect(body.bookingFieldsResponses).toEqual({ notes: "Fuse board tripping" });
    });

    it("omits the notes field entirely when there are none", async () => {
      const fn = stubFetch({ data: { uid: "abc123" } });
      await createBooking(args);

      const init = fn.mock.calls[0][1] as RequestInit;
      expect(JSON.parse(init.body as string)).not.toHaveProperty("bookingFieldsResponses");
    });
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

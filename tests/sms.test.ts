import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { lookupAllowsSms, sendSms, smsConfigured } from "@/lib/sms";

const jsonRes = (status: number, body: unknown) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  });

let fetchMock: ReturnType<typeof vi.fn>;

beforeEach(() => {
  vi.stubEnv("TELNYX_API_KEY", "test-telnyx-key-do-not-use-in-production");
  vi.stubEnv("TELNYX_FROM_NUMBER", "+353830000000");
  fetchMock = vi.fn().mockResolvedValue(jsonRes(200, { data: { id: "msg_1" } }));
  vi.stubGlobal("fetch", fetchMock);
});

afterEach(() => {
  vi.unstubAllGlobals();
  vi.clearAllMocks();
});

describe("smsConfigured", () => {
  it("is true with a key and a from number", () => {
    expect(smsConfigured()).toBe(true);
  });

  it("is false without an API key", () => {
    vi.stubEnv("TELNYX_API_KEY", "");
    expect(smsConfigured()).toBe(false);
  });

  it("is false without a from number", () => {
    vi.stubEnv("TELNYX_FROM_NUMBER", "");
    expect(smsConfigured()).toBe(false);
  });
});

describe("sendSms", () => {
  it("posts to the Telnyx messages endpoint with the bearer key", async () => {
    await sendSms("+353871234567", "hello");

    expect(fetchMock).toHaveBeenCalledTimes(1);
    const [url, init] = fetchMock.mock.calls[0];
    expect(url).toBe("https://api.telnyx.com/v2/messages");
    expect(init.method).toBe("POST");
    expect(init.headers.Authorization).toBe(
      "Bearer test-telnyx-key-do-not-use-in-production"
    );
    expect(JSON.parse(init.body)).toEqual({
      from: "+353830000000",
      to: "+353871234567",
      text: "hello",
    });
  });

  it("includes the messaging profile when one is configured", async () => {
    vi.stubEnv("TELNYX_MESSAGING_PROFILE_ID", "profile-abc");
    await sendSms("+353871234567", "hello");
    expect(JSON.parse(fetchMock.mock.calls[0][1].body).messaging_profile_id).toBe(
      "profile-abc"
    );
  });

  it("omits the messaging profile when unset", async () => {
    await sendSms("+353871234567", "hello");
    expect(
      JSON.parse(fetchMock.mock.calls[0][1].body)
    ).not.toHaveProperty("messaging_profile_id");
  });

  it("throws without a from number", async () => {
    vi.stubEnv("TELNYX_FROM_NUMBER", "");
    await expect(sendSms("+353871234567", "hi")).rejects.toThrow(
      "TELNYX_FROM_NUMBER is not set"
    );
  });

  it("throws with the status and Telnyx error code on failure", async () => {
    fetchMock.mockResolvedValue(
      jsonRes(422, { errors: [{ code: "40300", title: "Invalid destination" }] })
    );
    await expect(sendSms("+353871234567", "hi")).rejects.toThrow(
      /422.*40300.*Invalid destination/
    );
  });

  it("never puts the destination number in the error message", async () => {
    fetchMock.mockResolvedValue(
      jsonRes(422, {
        errors: [
          { code: "40300", title: "Invalid destination", detail: "+353871234567 is bad" },
        ],
      })
    );
    await expect(sendSms("+353871234567", "hi")).rejects.toThrow(
      expect.objectContaining({
        message: expect.not.stringContaining("353871234567"),
      })
    );
  });

  it("still throws when the failure body is not JSON", async () => {
    fetchMock.mockResolvedValue(new Response("<html>502</html>", { status: 502 }));
    await expect(sendSms("+353871234567", "hi")).rejects.toThrow(/502/);
  });
});

describe("lookupAllowsSms", () => {
  it("allows without calling the API when the lookup is off", async () => {
    await expect(lookupAllowsSms("+353871234567")).resolves.toBe(true);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("blocks a landline when the lookup is on", async () => {
    vi.stubEnv("TELNYX_LOOKUP", "1");
    fetchMock.mockResolvedValue(
      jsonRes(200, { data: { carrier: { type: "landline" } } })
    );
    await expect(lookupAllowsSms("+35312345678")).resolves.toBe(false);
  });

  it("allows a mobile", async () => {
    vi.stubEnv("TELNYX_LOOKUP", "1");
    fetchMock.mockResolvedValue(
      jsonRes(200, { data: { carrier: { type: "mobile" } } })
    );
    await expect(lookupAllowsSms("+353871234567")).resolves.toBe(true);
  });

  it("allows an unknown line type rather than guessing", async () => {
    vi.stubEnv("TELNYX_LOOKUP", "1");
    fetchMock.mockResolvedValue(jsonRes(200, { data: {} }));
    await expect(lookupAllowsSms("+353871234567")).resolves.toBe(true);
  });

  it("fails open when the lookup API errors", async () => {
    vi.stubEnv("TELNYX_LOOKUP", "1");
    fetchMock.mockResolvedValue(jsonRes(500, {}));
    await expect(lookupAllowsSms("+353871234567")).resolves.toBe(true);
  });

  it("fails open when the lookup request throws", async () => {
    vi.stubEnv("TELNYX_LOOKUP", "1");
    fetchMock.mockRejectedValue(new Error("network down"));
    await expect(lookupAllowsSms("+353871234567")).resolves.toBe(true);
  });
});

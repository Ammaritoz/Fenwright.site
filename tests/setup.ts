import { beforeEach, vi } from "vitest";

// Deterministic env for every test. Individual tests override as needed.
beforeEach(() => {
  vi.unstubAllEnvs();
  vi.stubEnv("VOICE_WEBHOOK_SECRET", "test-secret-do-not-use-in-production");
  vi.stubEnv("CALCOM_API_KEY", "test-calcom-key-do-not-use-in-production");
  vi.stubEnv("CALCOM_EVENT_TYPE_ID", "123456");
});

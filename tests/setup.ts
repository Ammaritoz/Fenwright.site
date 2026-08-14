import { beforeEach, vi } from "vitest";

// Deterministic env for every test. Individual tests override as needed.
beforeEach(() => {
  vi.unstubAllEnvs();
  vi.stubEnv("VOICE_WEBHOOK_SECRET", "test-secret-do-not-use-in-production");
});

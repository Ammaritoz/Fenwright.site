import { describe, expect, it } from "vitest";
import { toGsm7 } from "@/lib/receptionist";

describe("test infrastructure", () => {
  it("resolves the @/ alias and stubs server-only", () => {
    expect(toGsm7("Hello — “world”")).toBe('Hello - "world"');
  });
});

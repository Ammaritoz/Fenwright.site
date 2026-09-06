import { readdirSync, readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

/**
 * The failure this file exists to catch: a real client's passcode written into
 * their content/clients/<slug>.ts file, in a field or a comment.
 *
 * Everything else in the portal treats the passcode as a secret. scripts/
 * portal-passcode.ts prints it once and never writes it to disk, lib/portal/
 * auth.ts stores only a salted SHA-256 hash and compares with timingSafeEqual,
 * and content/clients/README.md says to send the URL and passcode in separate
 * messages. All of that is undone by one line of comment, because these files
 * are committed: a passcode written here is readable by anyone with repo access
 * and survives deletion in the git history.
 *
 * Matching is on the shape the generator emits -- two groups of five from its
 * deliberately ambiguity-free alphabet -- rather than on any particular value,
 * so this catches a passcode nobody has thought to look for.
 */

const CLIENTS_DIR = path.resolve(__dirname, "../content/clients");

/**
 * scripts/portal-passcode.ts: "ABCDEFGHJKLMNPQRSTUVWXYZ23456789". I, O, 0 and 1
 * are absent so a passcode read off a screen cannot be retyped wrong. Kept in
 * sync by hand; the shape has to change in the generator before it changes here.
 *
 * Held as a string, not a RegExp. A /g regex carries lastIndex between calls,
 * so a single shared instance would make these assertions order-dependent.
 */
const PASSCODE_PATTERN = String.raw`\b[A-HJ-NP-Z2-9]{5}-[A-HJ-NP-Z2-9]{5}\b`;

/**
 * The one deliberate exception. example-clinic.ts documents the passcode for
 * Bright Smile Dental, the fictional clinic already used in the marketing demo
 * (config/site.ts hero.phone). Its own header says nothing in that file is real
 * business data, and the recorded passcode is what keeps the worked example
 * openable. A real client file must never be added here.
 */
const FICTIONAL_EXAMPLE = "example-clinic.ts";

function clientFiles(): string[] {
  return readdirSync(CLIENTS_DIR)
    .filter((f) => f.endsWith(".ts"))
    .filter((f) => f !== FICTIONAL_EXAMPLE);
}

describe("client files", () => {
  it("record no passcode", () => {
    const offenders: string[] = [];

    for (const file of clientFiles()) {
      const source = readFileSync(path.join(CLIENTS_DIR, file), "utf8");
      for (const match of source.matchAll(new RegExp(PASSCODE_PATTERN, "g"))) {
        const line = source.slice(0, match.index ?? 0).split("\n").length;
        offenders.push(`${file}:${line} looks like a passcode: ${match[0]}`);
      }
    }

    expect(offenders).toEqual([]);
  });

  /**
   * Guards the guard. If the generator's alphabet or dash position changes and
   * nobody updates PASSCODE_PATTERN, the check above would quietly pass on every
   * file forever. This asserts the pattern still matches real generated codes.
   */
  it("uses a pattern that still matches the generator's output", () => {
    for (const code of ["DCUPN-VMK8D", "E75YQ-CACXM", "R7TVX-M2QWJ"]) {
      expect(new RegExp(PASSCODE_PATTERN).test(code)).toBe(true);
    }
  });

  /**
   * The scan is only worth anything if it is actually reading files. An empty
   * or mis-resolved directory would make "no offenders" vacuously true.
   */
  it("checks the template, which is where a new client starts", () => {
    expect(clientFiles()).toContain("_template.ts");
  });
});

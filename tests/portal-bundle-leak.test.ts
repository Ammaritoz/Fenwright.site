import { existsSync, readdirSync, readFileSync, statSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

/**
 * The failure this file exists to catch: a client component importing the
 * client registry, which would bundle every client's fees, contract terms and
 * contact details into the public JavaScript any visitor can download.
 *
 * "server-only" in content/clients/index.ts makes that a build error, so this
 * is the belt to that braces -- it asserts on the actual built output rather
 * than trusting the import graph.
 *
 * Runs against .next/static from the last `npm run build`. When there is no
 * build to inspect it skips rather than failing, so `npm test` still passes on
 * a clean checkout.
 */

const STATIC_DIR = path.resolve(__dirname, "../.next/static");

/** Strings that only ever appear in private client data. */
const MUST_NOT_APPEAR = [
  "977168e59bf35db473655c5a5f31f141", // passcode salt
  "e2505d12dd8ea7454c5c5d9e2b2a4828c1f9b69aaa6d2cd90a108a5820a8c457", // passcode hash
  "Ciara Nolan", // client contact name
  "ciara@example.com", // client contact email
  "BRIGHTSMILE-01", // payment reference
  "12 Example Street", // billing address
];

function jsFiles(dir: string): string[] {
  if (!existsSync(dir)) return [];
  const out: string[] = [];
  for (const entry of readdirSync(dir)) {
    const full = path.join(dir, entry);
    if (statSync(full).isDirectory()) out.push(...jsFiles(full));
    else if (entry.endsWith(".js")) out.push(full);
  }
  return out;
}

describe("client bundle", () => {
  const files = jsFiles(STATIC_DIR);

  it.skipIf(files.length === 0)(
    "ships no private client data to the browser",
    () => {
      const offenders: string[] = [];
      for (const file of files) {
        const source = readFileSync(file, "utf8");
        for (const secret of MUST_NOT_APPEAR) {
          if (source.includes(secret)) {
            offenders.push(`${path.relative(STATIC_DIR, file)} contains "${secret}"`);
          }
        }
      }
      expect(offenders).toEqual([]);
    }
  );

  it.skipIf(files.length === 0)("actually inspected some bundles", () => {
    // Guards against the check above passing vacuously because the glob broke.
    expect(files.length).toBeGreaterThan(3);
  });
});

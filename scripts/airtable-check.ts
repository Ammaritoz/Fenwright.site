/**
 * Diff what this codebase writes to Airtable against the live schema.
 *
 *   npm run airtable:check
 *
 * Exists because mocked unit tests assert what the code writes and can never
 * assert what Airtable will accept. logLead spent months writing field names
 * that did not exist on its target table; every call failed with a 422 that
 * logLead swallowed by design, so nothing looked wrong while every website
 * enquiry was silently dropped. This catches that in about a second.
 *
 * Read-only: it fetches table metadata and writes nothing. Run it after
 * changing lib/airtable-schema.ts, after editing a table in the Airtable UI,
 * and in CI if you ever add one.
 */

import { airtableExpectations, type BaseKind } from "../lib/airtable-schema";

type AirtableField = { name: string };
type AirtableTable = { name: string; fields: AirtableField[] };

const BASE_ENV: Record<BaseKind, { id: string; key: string; label: string }> = {
  leads: {
    id: "AIRTABLE_BASE_ID",
    key: "AIRTABLE_API_KEY",
    label: "leads base",
  },
  records: {
    id: "AIRTABLE_RECORDS_BASE_ID",
    key: "AIRTABLE_RECORDS_API_KEY",
    label: "client records base",
  },
};

async function fetchTables(baseId: string, apiKey: string): Promise<AirtableTable[]> {
  const res = await fetch(`https://api.airtable.com/v0/meta/bases/${baseId}/tables`, {
    headers: { Authorization: `Bearer ${apiKey}` },
  });
  if (res.status === 403) {
    throw new Error(
      "403 from Airtable. The personal access token probably does not list this " +
        "base. Add it at https://airtable.com/create/tokens under the token's " +
        "Access section, or grant it all current and future bases in the workspace."
    );
  }
  if (!res.ok) {
    throw new Error(`${res.status} ${res.statusText}: ${(await res.text()).slice(0, 200)}`);
  }
  return ((await res.json()) as { tables: AirtableTable[] }).tables;
}

async function main() {
  const problems: string[] = [];
  const cache = new Map<BaseKind, AirtableTable[] | Error>();

  for (const kind of Object.keys(BASE_ENV) as BaseKind[]) {
    const cfg = BASE_ENV[kind];
    const baseId = process.env[cfg.id];
    // The records base may share the leads token; see getRecordsBase().
    const apiKey = process.env[cfg.key] || process.env.AIRTABLE_API_KEY;
    if (!baseId || !apiKey) {
      cache.set(kind, new Error(`${cfg.id} is not set, skipping`));
      continue;
    }
    try {
      cache.set(kind, await fetchTables(baseId, apiKey));
    } catch (err) {
      cache.set(kind, err instanceof Error ? err : new Error(String(err)));
    }
  }

  for (const exp of airtableExpectations) {
    const label = `${BASE_ENV[exp.base].label} / ${exp.table}`;
    const tables = cache.get(exp.base);

    if (tables instanceof Error) {
      console.log(`  ?  ${label.padEnd(42)} ${tables.message}`);
      continue;
    }
    if (!tables) continue;

    const table = tables.find((t) => t.name === exp.table);
    if (!table) {
      const near = tables.map((t) => t.name).join(", ");
      problems.push(`${label}: table not found. Base has: ${near}`);
      console.log(`  X  ${label.padEnd(42)} table missing`);
      continue;
    }

    const actual = new Set(table.fields.map((f) => f.name));
    const missing = exp.fields.filter((f) => !actual.has(f));
    if (missing.length) {
      problems.push(
        `${label}: ${exp.writtenBy} writes fields that do not exist: ${missing.join(", ")}`
      );
      console.log(`  X  ${label.padEnd(42)} missing: ${missing.join(", ")}`);
    } else {
      console.log(`  OK ${label.padEnd(42)} ${exp.fields.length} fields, written by ${exp.writtenBy}`);
    }
  }

  if (problems.length) {
    console.error("\nSchema mismatch. Airtable will reject these writes:\n");
    for (const p of problems) console.error(`  - ${p}`);
    console.error(
      "\nlogLead swallows write failures by design, so a mismatch here means " +
        "leads are being dropped silently. Fix before deploying.\n"
    );
    process.exit(1);
  }

  console.log("\nEvery table this codebase writes to exists with the fields it expects.");
}

main().catch((err) => {
  console.error("airtable:check failed:", err instanceof Error ? err.message : err);
  process.exit(1);
});

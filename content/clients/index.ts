import "server-only";
import type { Client, DocRecord, DocStatus } from "./types";
import { exampleClinic } from "./example-clinic";

/**
 * The client registry.
 *
 * "server-only" is the load-bearing line in this file. Every client's fees,
 * contract terms and contact details are in these modules; a single import
 * from a client component would bundle all of them into the public JavaScript
 * every visitor downloads. Keep portal documents as server components and pass
 * only the fields a form actually needs across the boundary.
 *
 * To add a client: copy _template.ts, fill it in, import it here, add it below.
 */
const clients: Client[] = [exampleClinic];

const bySlug = new Map(clients.map((c) => [c.slug, c]));

export function getClient(slug: string): Client | undefined {
  return bySlug.get(slug);
}

export function getDoc(client: Client, docSlug: string): DocRecord | undefined {
  return client.docs.find((d) => d.slug === docSlug);
}

/** Status defaults to "live", so an existing client file needs no changes. */
export function docStatus(doc: DocRecord): DocStatus {
  return doc.status ?? "live";
}

/**
 * The index, split into what the client can read now and what is still coming.
 * `hidden` documents appear in neither: they are drafts, reachable only by
 * their direct URL so you can proofread them.
 */
export function visibleDocs(client: Client): { live: DocRecord[]; upcoming: DocRecord[] } {
  return {
    live: client.docs.filter((d) => docStatus(d) === "live"),
    upcoming: client.docs.filter((d) => docStatus(d) === "upcoming"),
  };
}

/** Slugs only. Safe to enumerate server-side; never expose this over HTTP. */
export function allClientSlugs(): string[] {
  return clients.map((c) => c.slug);
}

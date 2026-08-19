import { describe, expect, it } from "vitest";
import { allClientSlugs, docStatus, getClient, getDoc, visibleDocs } from "@/content/clients";
import { hashPasscode } from "@/lib/portal/auth";
import type { DocType } from "@/content/clients/types";

/**
 * Guards on the client registry itself. These are the mistakes that would show
 * up on a real client's screen: a duplicate slug shadowing a document, a
 * placeholder passcode shipped to production, a broken link on the index.
 */

const EVERY_DOC_TYPE: DocType[] = [
  "agreement",
  "welcome",
  "invoice",
  "brief",
  "delivery",
  "report",
  "payment",
  "thank-you",
  "feedback",
  "packages",
];

describe("client registry", () => {
  it("returns undefined for an unknown slug rather than throwing", () => {
    // The [client] route calls notFound() on this; a throw would be a 500.
    expect(getClient("does-not-exist")).toBeUndefined();
  });

  it("has no duplicate client slugs", () => {
    const slugs = allClientSlugs();
    expect(new Set(slugs).size).toBe(slugs.length);
  });

  it("gives every client an unguessable slug suffix", () => {
    // A bare "acme" is enumerable. The generator appends 8 hex characters.
    for (const slug of allClientSlugs()) {
      expect(slug).toMatch(/-[0-9a-f]{8}$/);
    }
  });

  it("never stores a passcode in plaintext", () => {
    for (const slug of allClientSlugs()) {
      const client = getClient(slug)!;
      expect(client.passcodeHash).toMatch(/^[0-9a-f]{64}$/);
      expect(client.passcodeSalt).toMatch(/^[0-9a-f]{16,}$/);
      // A hash of the empty string would mean nobody set a passcode.
      expect(client.passcodeHash).not.toBe(hashPasscode("", client.passcodeSalt));
    }
  });

  it("keeps document slugs unique within a client", () => {
    for (const slug of allClientSlugs()) {
      const docs = getClient(slug)!.docs;
      const docSlugs = docs.map((d) => d.slug);
      expect(new Set(docSlugs).size).toBe(docSlugs.length);
    }
  });

  it("resolves every declared document slug", () => {
    for (const slug of allClientSlugs()) {
      const client = getClient(slug)!;
      for (const doc of client.docs) {
        expect(getDoc(client, doc.slug)).toBe(doc);
      }
    }
    const client = getClient(allClientSlugs()[0])!;
    expect(getDoc(client, "no-such-doc")).toBeUndefined();
  });

  it("gives every document a title and a blurb for the index page", () => {
    for (const slug of allClientSlugs()) {
      for (const doc of getClient(slug)!.docs) {
        expect(doc.title.trim().length).toBeGreaterThan(0);
        expect(doc.blurb.trim().length).toBeGreaterThan(0);
      }
    }
  });

  it("covers all ten document types in the worked example", () => {
    // The example client exists so every template renders on day one; a type
    // missing here means one of the ten is never exercised.
    const example = getClient(allClientSlugs()[0])!;
    const types = new Set(example.docs.map((d) => d.payload.type));
    for (const type of EVERY_DOC_TYPE) {
      expect(types).toContain(type);
    }
  });
});

describe("document staging", () => {
  it("defaults an unmarked document to live", () => {
    const doc = getClient(allClientSlugs()[0])!.docs.find((d) => d.slug === "agreement")!;
    expect(doc.status).toBeUndefined();
    expect(docStatus(doc)).toBe("live");
  });

  it("splits the index into live and upcoming, and drops hidden entirely", () => {
    const client = getClient(allClientSlugs()[0])!;
    const { live, upcoming } = visibleDocs(client);

    expect(live.every((d) => docStatus(d) === "live")).toBe(true);
    expect(upcoming.every((d) => docStatus(d) === "upcoming")).toBe(true);

    const listed = [...live, ...upcoming].length;
    const hidden = client.docs.filter((d) => docStatus(d) === "hidden").length;
    expect(listed + hidden).toBe(client.docs.length);
  });

  it("gives every upcoming document an expected note", () => {
    // Without one the client sees a greyed row and no idea when it arrives.
    for (const slug of allClientSlugs()) {
      for (const doc of visibleDocs(getClient(slug)!).upcoming) {
        expect(doc.expected, `${doc.slug} is upcoming with no expected note`).toBeTruthy();
      }
    }
  });

  it("stages the example as a client who has just signed", () => {
    // The documents you hand over on day one, and the ones that come later.
    const { live, upcoming } = visibleDocs(getClient(allClientSlugs()[0])!);
    expect(live.map((d) => d.slug)).toEqual([
      "agreement",
      "welcome",
      "brief",
      "payment",
      "invoice-001",
      "packages",
    ]);
    expect(upcoming.map((d) => d.slug)).toEqual([
      "delivery",
      "report-2026-10",
      "thank-you",
      "feedback",
    ]);
  });

  it("still resolves an upcoming document by direct URL, for proofreading", () => {
    const client = getClient(allClientSlugs()[0])!;
    expect(getDoc(client, "delivery")).toBeDefined();
    expect(docStatus(getDoc(client, "delivery")!)).toBe("upcoming");
  });
});

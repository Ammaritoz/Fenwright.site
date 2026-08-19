/**
 * Generate a passcode, salt and hash for a new client portal.
 *
 *   npm run portal:passcode
 *   npm run portal:passcode -- "bright smile"   # seed the slug suffix
 *
 * Prints the passcode once, to paste into the message you send the client, and
 * the salt/hash pair to paste into their content/clients/<slug>.ts file. The
 * passcode itself is never written to disk by this script.
 */

import { randomBytes, createHash } from "node:crypto";

/** Ambiguous characters removed: a passcode gets read off a screen and retyped. */
const ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";

function passcode(length = 10): string {
  const bytes = randomBytes(length);
  let out = "";
  for (let i = 0; i < length; i++) {
    out += ALPHABET[bytes[i] % ALPHABET.length];
    if (out.replace(/-/g, "").length % 5 === 0 && i < length - 1) out += "-";
  }
  return out;
}

function slugify(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

const name = process.argv[2] ?? "";
const code = passcode();
const salt = randomBytes(16).toString("hex");
const hash = createHash("sha256").update(`${code}${salt}`).digest("hex");
const suffix = randomBytes(4).toString("hex");
const slug = name ? `${slugify(name)}-${suffix}` : `client-${suffix}`;

console.log(`
  Portal credentials
  ------------------------------------------------------------------
  slug:          ${slug}
  passcode:      ${code}          <- give this to the client, once

  Paste into content/clients/${slug}.ts:

    slug: "${slug}",
    passcodeSalt: "${salt}",
    passcodeHash: "${hash}",

  Portal URL:    https://www.fenwright.ie/portal/${slug}
  ------------------------------------------------------------------
  The passcode is not stored anywhere. If it is lost, run this again
  and replace the salt and hash in the client file.
`);

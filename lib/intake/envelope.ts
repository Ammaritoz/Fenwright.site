/**
 * Browser-side encryption for firmware uploads.
 *
 * The file is encrypted in the prospect's browser before it leaves, with a
 * fresh AES-256-GCM key; that key is wrapped with Fenwright's RSA-OAEP
 * (SHA-256) public key. Only the holder of the private key (the pipeline,
 * `fenwright-watch intake fetch`) can read it. The storage service sees
 * ciphertext only, and the file name travels inside the ciphertext.
 *
 * Envelope:  "FWENC1" | u16 wrapped-key length | wrapped key | 12-byte IV | AES-GCM ciphertext+tag
 * Plaintext: u32 metadata length | metadata JSON (UTF-8) | file bytes
 *
 * Uses only WebCrypto, so it runs in the browser and in Node tests alike.
 * fenwright-watch/src/fenwright_watch/intake.py reads exactly this format.
 */

export const ENVELOPE_MAGIC = "FWENC1";

export type IntakeMeta = {
  name: string;
  size: number;
  sha256: string;
  type: string;
  uploadedAt: string;
  prospect: string;
};

function pemToDer(pem: string): ArrayBuffer {
  const b64 = pem.replace(/-----(BEGIN|END) PUBLIC KEY-----/g, "").replace(/\s+/g, "");
  const bin = atob(b64);
  const out = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i);
  return out.buffer;
}

function hex(buf: ArrayBuffer): string {
  return Array.from(new Uint8Array(buf), (b) => b.toString(16).padStart(2, "0")).join("");
}

export async function sha256Hex(data: ArrayBuffer): Promise<string> {
  return hex(await crypto.subtle.digest("SHA-256", data));
}

export async function encryptForFenwright(
  file: ArrayBuffer,
  meta: Omit<IntakeMeta, "sha256" | "size">,
  publicKeyPem: string,
): Promise<{ envelope: Uint8Array<ArrayBuffer>; sha256: string }> {
  const sha256 = await sha256Hex(file);
  const metaBytes = new TextEncoder().encode(JSON.stringify({ ...meta, size: file.byteLength, sha256 }));

  const plain = new Uint8Array(4 + metaBytes.length + file.byteLength);
  new DataView(plain.buffer).setUint32(0, metaBytes.length);
  plain.set(metaBytes, 4);
  plain.set(new Uint8Array(file), 4 + metaBytes.length);

  const rsa = await crypto.subtle.importKey(
    "spki",
    pemToDer(publicKeyPem),
    { name: "RSA-OAEP", hash: "SHA-256" },
    false,
    ["wrapKey"],
  );
  const aes = await crypto.subtle.generateKey({ name: "AES-GCM", length: 256 }, true, ["encrypt"]);
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const cipher = new Uint8Array(await crypto.subtle.encrypt({ name: "AES-GCM", iv }, aes, plain));
  const wrapped = new Uint8Array(await crypto.subtle.wrapKey("raw", aes, rsa, { name: "RSA-OAEP" }));

  const magic = new TextEncoder().encode(ENVELOPE_MAGIC);
  const out = new Uint8Array(magic.length + 2 + wrapped.length + iv.length + cipher.length);
  let o = 0;
  out.set(magic, o);
  o += magic.length;
  new DataView(out.buffer).setUint16(o, wrapped.length);
  o += 2;
  out.set(wrapped, o);
  o += wrapped.length;
  out.set(iv, o);
  o += iv.length;
  out.set(cipher, o);
  return { envelope: out, sha256 };
}

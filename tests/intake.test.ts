import { describe, expect, it } from "vitest";
import { generateKeyPairSync, privateDecrypt, constants, createDecipheriv, createHash } from "node:crypto";
import { signIntakeToken, verifyIntakeToken } from "@/lib/intake/token";
import { encryptForFenwright, ENVELOPE_MAGIC } from "@/lib/intake/envelope";

const KEY = "k".repeat(40);

describe("upload links", () => {
  const now = 1_800_000_000;

  it("verifies a good link and rejects tampering, expiry and other keys", () => {
    const t = signIntakeToken("lowmoor-controls", now + 3600, KEY);
    expect(verifyIntakeToken(t, now, KEY)).toEqual({ prospect: "lowmoor-controls", expires: now + 3600 });
    expect(verifyIntakeToken(t, now + 7200, KEY)).toBeNull(); // expired
    expect(verifyIntakeToken(t.replace("lowmoor", "acme"), now, KEY)).toBeNull(); // other prospect
    expect(verifyIntakeToken(t, now, "x".repeat(40))).toBeNull(); // other secret
    expect(verifyIntakeToken("a.b", now, KEY)).toBeNull();
  });

  it("only accepts simple prospect slugs", () => {
    expect(() => signIntakeToken("../etc", now, KEY)).toThrow();
    expect(() => signIntakeToken("Has Spaces", now, KEY)).toThrow();
  });
});

describe("browser-side encryption", () => {
  it("produces an envelope only the private key can open", async () => {
    const { publicKey, privateKey } = generateKeyPairSync("rsa", { modulusLength: 2048 });
    const pem = publicKey.export({ type: "spki", format: "pem" }).toString();
    const file = new TextEncoder().encode("firmware bytes ".repeat(500));
    const { envelope, sha256 } = await encryptForFenwright(
      file.buffer,
      { name: "fw.bin", type: "application/octet-stream", uploadedAt: "2026-11-19T00:00:00Z", prospect: "p" },
      pem,
    );
    expect(new TextDecoder().decode(envelope.slice(0, 6))).toBe(ENVELOPE_MAGIC);
    expect(Buffer.from(envelope).includes(Buffer.from("fw.bin"))).toBe(false); // name is inside the ciphertext

    const view = new DataView(envelope.buffer);
    const klen = view.getUint16(6);
    const wrapped = envelope.slice(8, 8 + klen);
    const iv = envelope.slice(8 + klen, 20 + klen);
    const body = envelope.slice(20 + klen);
    const aesKey = privateDecrypt({ key: privateKey, padding: constants.RSA_PKCS1_OAEP_PADDING, oaepHash: "sha256" }, wrapped);
    const d = createDecipheriv("aes-256-gcm", aesKey, iv);
    d.setAuthTag(body.slice(-16));
    const plain = Buffer.concat([d.update(body.slice(0, -16)), d.final()]);
    const mlen = plain.readUInt32BE(0);
    const meta = JSON.parse(plain.subarray(4, 4 + mlen).toString());
    expect(meta).toMatchObject({ name: "fw.bin", prospect: "p", size: file.length, sha256 });
    expect(createHash("sha256").update(plain.subarray(4 + mlen)).digest("hex")).toBe(sha256);
  });
});

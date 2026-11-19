import "server-only";
import { AwsClient } from "aws4fetch";

/**
 * Cloudflare R2 (S3-compatible) access for firmware uploads.
 *
 * The browser uploads ciphertext straight to R2 with a short-lived presigned
 * PUT URL, so large files never pass through a Vercel function (which caps
 * request bodies at 4.5 MB). The bucket should have a lifecycle rule deleting
 * objects after 7 days, as a backstop to the pipeline deleting each one when it
 * collects it.
 *
 * Env: R2_ACCOUNT_ID, R2_ACCESS_KEY_ID, R2_SECRET_ACCESS_KEY, R2_BUCKET, and
 * R2_JURISDICTION=eu for Fenwright's bucket (created in the EU jurisdiction).
 * Use an R2 API token scoped to this one bucket with Object Read & Write.
 */

export function r2Configured(): boolean {
  return Boolean(
    process.env.R2_ACCOUNT_ID &&
      process.env.R2_ACCESS_KEY_ID &&
      process.env.R2_SECRET_ACCESS_KEY &&
      process.env.R2_BUCKET,
  );
}

function client(): AwsClient {
  return new AwsClient({
    accessKeyId: process.env.R2_ACCESS_KEY_ID!,
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY!,
    service: "s3",
    region: "auto",
  });
}

/** EU-jurisdiction buckets (data kept in the EU) use their own endpoint: set R2_JURISDICTION=eu. */
export function r2Host(): string {
  const j = process.env.R2_JURISDICTION?.trim().toLowerCase();
  return `${process.env.R2_ACCOUNT_ID}.${j ? `${j}.` : ""}r2.cloudflarestorage.com`;
}

export function objectUrl(key: string): string {
  const path = key.split("/").map(encodeURIComponent).join("/");
  return `https://${r2Host()}/${process.env.R2_BUCKET}/${path}`;
}

/** A URL the browser can PUT one object to, valid for `expiresSeconds`. */
export async function presignPut(key: string, expiresSeconds = 900): Promise<string> {
  const url = new URL(objectUrl(key));
  url.searchParams.set("X-Amz-Expires", String(expiresSeconds));
  const signed = await client().sign(new Request(url, { method: "PUT" }), { aws: { signQuery: true } });
  return signed.url;
}

/** The object's size in bytes, or null if it is not there. */
export async function objectSize(key: string): Promise<number | null> {
  const res = await client().fetch(objectUrl(key), { method: "HEAD" });
  if (!res.ok) return null;
  return Number(res.headers.get("content-length") ?? 0);
}

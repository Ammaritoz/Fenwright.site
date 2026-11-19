/**
 * Firmware upload settings.
 *
 * `publicKeyPem` is Fenwright's intake public key: safe to publish, it can only
 * encrypt. Generate the pair with `fenwright-watch intake keygen`, paste the
 * public key here, and keep the private key off this machine's synced folders.
 * While it is empty, the upload page says uploads are not set up yet.
 */
export const intake = {
  publicKeyPem: "",
  /** Largest file a prospect can send. Encryption happens in browser memory. */
  maxFileBytes: 300 * 1024 * 1024,
  /** How long an upload link works for, by default (days). */
  defaultLinkDays: 14,
};

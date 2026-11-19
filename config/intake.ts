/**
 * Firmware upload settings.
 *
 * `publicKeyPem` is Fenwright's intake public key: safe to publish, it can only
 * encrypt. Generate the pair with `fenwright-watch intake keygen`, paste the
 * public key here, and keep the private key off this machine's synced folders.
 * While it is empty, the upload page says uploads are not set up yet.
 */
export const intake = {
  publicKeyPem: "-----BEGIN PUBLIC KEY-----\r\nMIICIjANBgkqhkiG9w0BAQEFAAOCAg8AMIICCgKCAgEAkE1Z2j+CECAdrBjRZzF+\r\ncosh7bigjIxDgsvdmgyWcvDsmBNNq8+QsW6WzeN+QEUhSwoSU6VKd6rawZIJGAAc\r\nE79KSWCSiRQTnzloDvDne1C4qKtE4k6Hb6gBUTFOKTufu9jlCxJY+Mi4XmEhK5HI\r\nRYsGXMsbefZR5rwtF3FUAB9Oe4JqsCI7i1bkOMLRCkCkI5eVrHJ0mh/3+h6ibCoq\r\n4wJfC3Yk7hmbeIW7QHab2ns7UN+w7EJQ1ja0w2kAhpPzU5837W2EN/fU445tkkYi\r\njYY3qTis3VOEpxAcmJj14qARD02H9QgxDp+ybHa4nA86qmaBgLWbsAq3t2pJnapK\r\nw+GoYFIQmlZYq1qlgg6TbC0zxZsqMS4onbCsRtGiCME4mbl3FYlHY5ALhu6TZ/Ie\r\nHDtjOxDQ4n9FrayySyQCPBTreRhWSX8kEhGC3/rCgBN9RsxJ8FXhnCEJ9nrdUfzV\r\ns00RzW/JAgJa9/ZKXrwTEOvCQL/0Vo/hnhLnMozUq6Sxz+4ghAjh62Sno7JTxpT3\r\nOQVlystMcxUEHpP368tBF5Kq97Pszu5HKnd4xlW9mV5rXkzHpCCgg+moytfDKqe9\r\npeLNmDYpG3QidI+qdqQ7sjZ5deYL+e0g7qTZDuQx0k+TnTt+dPIGNJEOxc2BNxv8\r\nAjxfHjI9fWco/8AXYMpngo0CAwEAAQ==\r\n-----END PUBLIC KEY-----\r\n",
  /** Largest file a prospect can send. Encryption happens in browser memory. */
  maxFileBytes: 300 * 1024 * 1024,
  /** How long an upload link works for, by default (days). */
  defaultLinkDays: 14,
};

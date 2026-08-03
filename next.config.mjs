/**
 * Security headers for a marketing page that embeds the Cal.com EU booking
 * iframe and collects PII in forms.
 *
 *   - HSTS: force HTTPS (Vercel serves HTTPS; this pins it and enables preload).
 *   - X-Content-Type-Options: stop MIME sniffing.
 *   - Referrer-Policy: don't leak full URLs/PII in the Referer header.
 *   - Permissions-Policy: deny powerful features the site never uses.
 *   - X-Frame-Options + CSP frame-ancestors 'self': clickjacking protection.
 *   - Content-Security-Policy: restricts where scripts/frames/connections can
 *     come from to self + the Cal.com EU embed origin.
 *
 * CSP notes:
 *   - 'unsafe-inline' is required for script-src because Next.js App Router
 *     injects inline bootstrap/hydration scripts (and we add the tiny `js`-class
 *     script in layout.tsx) without nonces. It's required for style-src because
 *     both Next and the Cal embed inject inline styles. React escapes all
 *     rendered output and the app renders no user-supplied HTML, so the residual
 *     XSS surface is minimal.
 *   - 'unsafe-eval' and the HMR websocket (ws:) are only added in development,
 *     where the webpack dev runtime needs them. Production stays stricter.
 *   - app.cal.eu is allowed for script-src/frame-src/connect-src so the inline
 *     booking embed (embed.js + iframe) works. Its cal.eu subdomains are allowed
 *     for connect-src in case embed.js talks to a sibling host.
 *   - Google Analytics origins are allowed for script-src/connect-src. gtag.js
 *     itself is only ever injected client-side after the visitor accepts the
 *     cookie consent banner (see components/CookieConsent.tsx) -- allowing the
 *     origin here doesn't mean it loads unconditionally.
 */
const isDev = process.env.NODE_ENV !== "production";

const CAL = "https://app.cal.eu";
const GTAG = "https://www.googletagmanager.com";
const GA = "https://www.google-analytics.com";

const scriptSrc = ["'self'", "'unsafe-inline'", CAL, GTAG, ...(isDev ? ["'unsafe-eval'"] : [])];
const connectSrc = [
  "'self'",
  CAL,
  "https://*.cal.eu",
  GTAG,
  GA,
  "https://*.google-analytics.com",
  ...(isDev ? ["ws:"] : []),
];

const csp = [
  `default-src 'self'`,
  `base-uri 'self'`,
  `form-action 'self'`,
  `frame-ancestors 'self'`,
  `object-src 'none'`,
  `img-src 'self' data: https:`,
  `font-src 'self' data:`,
  `style-src 'self' 'unsafe-inline'`,
  `script-src ${scriptSrc.join(" ")}`,
  `frame-src ${CAL}`,
  `connect-src ${connectSrc.join(" ")}`,
].join("; ");

const securityHeaders = [
  {
    key: "Strict-Transport-Security",
    value: "max-age=63072000; includeSubDomains; preload",
  },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  {
    key: "Permissions-Policy",
    value: "camera=(), microphone=(), geolocation=(), browsing-topics=()",
  },
  { key: "X-Frame-Options", value: "SAMEORIGIN" },
  { key: "Content-Security-Policy", value: csp },
];

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,
  async headers() {
    return [{ source: "/:path*", headers: securityHeaders }];
  },
};

export default nextConfig;

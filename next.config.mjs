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
 *   - app.cal.com is allowed for script-src/frame-src/connect-src so the inline
 *     booking embed (embed.js + iframe) works. Its cal.com subdomains are allowed
 *     for connect-src in case embed.js talks to a sibling host. (The account was
 *     on Cal's EU cloud, cal.eu, until 2026-10-28.)
 *   - Google Analytics origins are allowed for script-src/connect-src. gtag.js
 *     itself is only ever injected client-side after the visitor accepts the
 *     cookie consent banner (see components/CookieConsent.tsx) -- allowing the
 *     origin here doesn't mean it loads unconditionally.
 */
const isDev = process.env.NODE_ENV !== "production";

const CAL = "https://app.cal.com";
const GTAG = "https://www.googletagmanager.com";
const GA = "https://www.google-analytics.com";

const scriptSrc = [
  "'self'",
  "'unsafe-inline'",
  CAL,
  GTAG,
  ...(isDev ? ["'unsafe-eval'"] : []),
];
const connectSrc = [
  "'self'",
  CAL,
  "https://*.cal.com",
  GTAG,
  GA,
  "https://*.google-analytics.com",
  // GA4's actual collect beacon lands on one of these depending on setup --
  // analytics.google.com is GA4's newer collect domain, www.google.com is
  // used when the property is linked to a Google Ads account (ours is).
  "https://analytics.google.com",
  // GA4 also beacons to regional hosts (region1.analytics.google.com), which
  // were being blocked, so page views never reached Analytics.
  "https://*.analytics.google.com",
  "https://www.google.com",
  // Firmware uploads (/upload/<token>) PUT encrypted files straight to the
  // Cloudflare R2 bucket with a presigned URL. Exact host when the account is
  // known at build time; the R2 wildcard otherwise.
  process.env.R2_ACCOUNT_ID
    ? `https://${process.env.R2_ACCOUNT_ID}.${process.env.R2_JURISDICTION ? `${process.env.R2_JURISDICTION.trim().toLowerCase()}.` : ""}r2.cloudflarestorage.com`
    : "https://*.r2.cloudflarestorage.com",
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
  experimental: {
    // Next keeps dynamic pages in the browser for 30 seconds between clicks.
    // For the client portal that means the dashboard can show "unpaid" or
    // "unsigned" for half a minute after the client has just paid or signed.
    // Zero means every click on a portal link asks the server again.
    staleTimes: { dynamic: 0, static: 30 },
  },
  // Pages from the roofing and voice-receptionist business, closed in
  // November 2026. Old email signatures and links still point at them.
  async redirects() {
    return ["/roofing-leads", "/roi", "/demo"].map((source) => ({
      source,
      destination: "/",
      permanent: true,
    }));
  },
  async headers() {
    return [{ source: "/:path*", headers: securityHeaders }];
  },
};

export default nextConfig;

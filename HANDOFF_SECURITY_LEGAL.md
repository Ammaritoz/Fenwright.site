# Handoff: security audit + EU legal/compliance research + user-facing bug sweep

Paste this whole file as your first message in the new chat.

## What I need

Three separate deliverables, all against the codebase at
`C:\Users\kingy\OneDrive\Desktop\fenwright\fenwright-site` (a standalone Next.js
14 App Router + TypeScript project, sibling to an unrelated n8n repo — do not
touch the n8n repo):

1. **A high-grade security audit** of this codebase and its deployment
   configuration. Go deep: auth/secrets handling, injection surfaces, rate
   limiting, SSRF, dependency risk, the works. Do not just skim — actually read
   every file under `app/api/`, `lib/`, and `config/`.
2. **Research on EU legal/compliance requirements** for what this site needs to
   have (GDPR, ePrivacy, consumer-info duties, etc.) since the business
   operates in Ireland and the UK and the site is public on the internet. I
   want to know what's currently missing, not just a generic checklist.
3. **A user-facing bug sweep**: actually use the site the way a real visitor
   would (ideally in a real browser, not just by reading the code) and find
   anything that would trip someone up — broken flows, confusing states,
   mobile issues, edge cases in the forms, anything that looks or behaves
   wrong. See the dedicated section below for specifics and known trouble
   spots to check first.

Do not assume any of these areas are already fine because the app "seems to
work" — verify from the actual code (and by actually using the site for the
bug sweep) and give me concrete findings, file/line references, and a
prioritized fix list for each.

## What the site is

Fenwright is an AI automation studio for small service businesses (dental
clinics, salons, plumbers, electricians, etc.) in Ireland and the UK. The
flagship product is a "speed to lead" AI receptionist that texts back every
missed call / web enquiry within ~60 seconds. This site is the marketing page
for that product, and it proves the pitch by running a live, interactive demo
of the exact system on the page itself. Domain will be `fenwright.ie`, hosted
on Vercel, DNS in Cloudflare.

## Architecture (verify this is still accurate — code is the truth, not this doc)

- Next.js 14 App Router, TypeScript, Tailwind. Single page (`app/page.tsx`)
  with these sections in order: Nav, Hero, Problem (stats), Demo (the
  centerpiece), How It Works, What You Get, Book a Call (Cal.com embed),
  Contact/instant-text form, Footer.
- All backend logic lives in three route handlers under `app/api/`:
  - `app/api/demo-reply/route.ts` — generates an on-screen AI reply, no SMS,
    rate-limited by IP.
  - `app/api/demo-text/route.ts` — generates a reply AND sends a real SMS to a
    visitor-entered phone number. Gated by a required consent checkbox. Has
    layered anti-abuse: max 1 SMS/phone/24h, max 3 SMS/IP/hour, a global daily
    cap (`DEMO_SMS_DAILY_CAP` env var), and forces the SMS body into a single
    GSM-7 segment (160 chars, ASCII-sanitized, no emoji).
  - `app/api/contact/route.ts` — a real lead-capture form (name, phone,
    message). Sends the visitor a real AI-generated text back, logs the lead
    to Airtable, and optionally forwards to an n8n webhook
    (`N8N_WEBHOOK_URL`, best-effort, must not block the response). **Only has
    a passive consent notice (a line of text), no checkbox gate** —
    flag/research whether that's sufficient under Irish/EU rules for sending
    an unsolicited SMS in response to form submission.
- Shared logic lives in `lib/`:
  - `lib/receptionist.ts` — calls Anthropic (`claude-sonnet-4-6`) server-side
    to generate replies. Has a `toGsm7()` sanitizer for SMS-safe output.
  - `lib/twilio.ts` — sends SMS via Twilio. Has an optional `lookupAllowsSms()`
    using Twilio Lookup (gated behind `TWILIO_LOOKUP=1` env var to control
    cost), fails open (allows) on any Lookup error.
  - `lib/airtable.ts` — logs leads to an Airtable base ("Fenwright" base,
    `Leads` table). Best-effort, swallows errors so it never breaks the
    visitor-facing response.
  - `lib/ratelimit.ts` — Upstash Redis-backed rate limiting via
    `@upstash/ratelimit`, with an **in-memory fallback** if Upstash env vars
    are absent (intentional for local dev; must verify this never silently
    activates in production — check `usingUpstash` export and how/whether
    anything alerts if production ends up on the in-memory fallback).
  - `lib/validation.ts` — zod schemas. Phone numbers validated as E.164
    (`^\+[1-9]\d{6,14}$`).
  - `lib/request.ts` — `clientIp()` reads `x-forwarded-for` / `x-real-ip`
    headers for rate-limit keys. **Verify this can't be spoofed to bypass rate
    limits** — Vercel sets `x-forwarded-for` itself, but confirm the app
    trusts the right header/position and isn't naively trusting
    client-supplied headers if run anywhere other than Vercel.
- `config/site.ts` holds all editable copy (single source of truth).
  `config/limits.ts` holds rate-limit numbers.
- Phone input: `components/PhoneField.tsx`, using `react-phone-number-input`
  (country selector with SVG flags, defaults to Ireland, normalizes any format
  to E.164 via `libphonenumber-js`, shows inline valid/invalid feedback).
- Cal.com booking embed uses `@calcom/embed-react`. **The account is on Cal's
  EU cloud instance (`cal.eu`), not the default `cal.com`** — the embed origin
  is wired to `app.cal.eu` via `NEXT_PUBLIC_CALCOM_ORIGIN`, and the SMS
  booking-link text uses `NEXT_PUBLIC_CALCOM_BOOKING_BASE` (`https://cal.eu`).
  Slug is `fenwright/30min`. Verify this is still correct and that the embed
  doesn't leak the origin/slug in a way that breaks if env vars are unset.

## Secrets / environment variables

Full list is in `.env.example` at the project root and `.env.local` (gitignored,
already has real values — **do not print its contents back to me or commit
it**). Names: `ANTHROPIC_API_KEY`, `TWILIO_ACCOUNT_SID`, `TWILIO_AUTH_TOKEN`,
`TWILIO_FROM_NUMBER`, `TWILIO_LOOKUP`, `AIRTABLE_API_KEY`, `AIRTABLE_BASE_ID`,
`UPSTASH_REDIS_REST_URL`, `UPSTASH_REDIS_REST_TOKEN`, `DEMO_SMS_DAILY_CAP`,
`N8N_WEBHOOK_URL`, `CALCOM_LINK`, `NEXT_PUBLIC_CALCOM_LINK`,
`NEXT_PUBLIC_CALCOM_ORIGIN`, `NEXT_PUBLIC_CALCOM_BOOKING_BASE`.

**Already done in a previous session** (re-verify, don't just trust this):
- All four secret-touching files (`lib/twilio.ts`, `lib/receptionist.ts`,
  `lib/airtable.ts`, `lib/ratelimit.ts`) are marked with `import "server-only"`
  as their first import, so any accidental future client-side import of them
  is a hard build error.
- Verified no client component imports those files, and grepped the built
  `.next/static` client bundle for the secret env var *names* — none present.
- Only `NEXT_PUBLIC_*` vars are the Cal.com link/origin, which are meant to be
  public.

Please re-verify all of this yourself rather than trusting this note — grep
the current code, rebuild, and check the client bundle again as part of the
audit. Also check for anything I might have missed: response bodies/error
messages leaking stack traces or internal details, timing side-channels,
whether zod validation errors could leak schema internals, whether the
Anthropic/Twilio/Airtable client libraries log request bodies anywhere
reachable, etc.

## Known operational facts relevant to the audit

- **Twilio account is currently a Trial account.** Trial accounts can only
  send SMS to phone numbers verified under Verified Caller IDs, prepend a
  "sent from your trial account" notice, and by default only certain
  countries are enabled in Messaging → Geo Permissions (Egypt was recently
  found to be blocked, error 21408, until enabled). This isn't a code bug but
  is relevant to any "what happens if Twilio rejects" resilience checks — the
  `demo-text` and `contact` routes should (and I believe do) still respond
  gracefully and log the lead even when Twilio fails; confirm this holds.
- The dev server has previously broken with EINVAL/module-not-found errors
  from stale `.next` cache when `npm run build` was run while `npm run dev`
  was still active (Windows/OneDrive-synced folder). If you need to build,
  stop any running dev server first, and if it breaks, delete `.next` and
  restart `npm run dev`. This is an environment quirk, not a security issue,
  but avoid triggering it while auditing.
- No CSP, security headers (`next.config.mjs`), or `helmet`-equivalent has
  been explicitly configured as far as I know — check `next.config.mjs` and
  recommend headers (CSP, X-Frame-Options/frame-ancestors given the Cal.com
  iframe embed, Referrer-Policy, Permissions-Policy, HSTS via Vercel, etc.)
  appropriate for a page that embeds a third-party iframe (Cal.com) and takes
  PII in forms.

## Known gaps relevant to the legal research (not yet fixed — find out what's actually required)

- **No privacy policy page, no cookie banner, no terms of service page exist
  on the site at all.** Confirm via `app/` — there's currently just the one
  page (`app/page.tsx`) plus the three API routes; no `/privacy`, `/terms`,
  `/legal` routes.
- No cookie/consent-management tooling is present (no analytics script found
  in a scan of the codebase either, but re-verify — if analytics get added
  later, cookie consent requirements would kick in).
- The site collects: name, phone number, and a free-text message (contact
  form); phone number + selected industry + free-text enquiry (demo SMS
  path). All of this is sent to Anthropic (for AI generation), Twilio (for
  SMS delivery), and Airtable (for lead storage), all third-party US-based
  (or Twilio/EU-hosted, verify) processors.
- Contact form: only a line of text near the submit button
  (`site.contact.consentNote`) says "By submitting you agree to receive one
  text from Fenwright. No spam, ever." — **no explicit checkbox, no separate
  opt-in action**. The demo SMS path (`demo-text`) *does* have a required
  checkbox ("Send one text message to this number. Standard rates may
  apply."). Research whether Ireland's ePrivacy rules (S.I. No. 336/2011
  transposing the ePrivacy Directive, as amended, and GDPR Art. 6/7 consent
  standards) require an explicit affirmative opt-in (not just a passive
  notice) before sending an unsolicited SMS, even a single "reply" text
  triggered by the user's own form submission — and whether the "single
  reply, not marketing" framing changes the analysis versus a marketing text.
- No visible business identity/imprint info (registered company name,
  address, registration number) anywhere on the site — check against EU
  E-Commerce Directive / Irish S.I. requirements for what a commercial website
  must display (this is separate from and in addition to GDPR).
- Research whether a business operating from Ireland, targeting Ireland + UK
  customers, and processing EU residents' personal data (name, phone number)
  via US-based processors (Anthropic, Twilio, Airtable — confirm each one's
  actual data-hosting region and whether they offer EU data residency /
  Standard Contractual Clauses / a DPA) needs: a published privacy policy
  covering these processors, an Art. 30 records-of-processing consideration,
  a lawful basis analysis for each data flow (consent vs. legitimate
  interest), and data retention statements (how long leads sit in Airtable).
- UK GDPR applies in parallel for the UK market — note anywhere requirements
  diverge from EU GDPR post-Brexit (e.g., ICO's stance on SMS marketing under
  PECR, the UK's near-equivalent to the ePrivacy Directive).
- Cal.com embed: confirm whether Cal.com's EU-hosted instance
  (`cal.eu`, i.e., Cal's EU-hosted infrastructure) changes any of the above
  vs. the default `cal.com` in terms of data residency claims worth
  mentioning in a privacy policy.

## User-facing bug sweep: what to check

Go through the site as a real visitor would, on both desktop and mobile
viewport sizes, and try to break it. Prioritize the interactive parts — they
have the most moving state and the most room for bugs. Known trouble spots and
history worth knowing before you start:

- **The on-screen demo** (`components/Demo.tsx`): industry picker, the enquiry
  textarea, "Generate reply," the live seconds-counter animation, then the
  "Send this to my phone" stage-two panel. Things to specifically try: switch
  industries mid-flow, generate a reply then immediately regenerate before the
  timer settles, submit with an empty/edited enquiry, resize the window while
  the reply is typing in, and check `prefers-reduced-motion` actually gives a
  sane instant state instead of a broken one. The typing/timer animation logic
  has been rewritten more than once in this project's history because an
  earlier version snapped the counter instead of easing — confirm the current
  version in `Demo.tsx` behaves correctly and doesn't regress under fast
  clicking or rapid industry switching.
- **The phone number field** (`components/PhoneField.tsx`, used in both the
  demo's SMS panel and the contact form): confirm valid/invalid inline
  feedback is accurate for several countries, not just Ireland (try IE, UK,
  US, and a country with a different national-number length like Egypt).
  Confirm it doesn't show a false "invalid" while the user is still mid-typing
  a number that would become valid, and that leaving it empty never shows an
  error. Confirm the "invalid" state actually clears the border color when
  fixed.
- **The contact form** (`components/ContactForm.tsx` + `app/api/contact/route.ts`):
  submit with a phone number Twilio will reject (e.g. an unverified number on
  the current Trial account, or a country not enabled in Twilio's Geo
  Permissions) and confirm the UI shows the honest "we have your details,
  we'll be in touch" message rather than falsely claiming a text was sent —
  this was a real bug fixed in a previous session (the server used to return
  a generic success even when the SMS failed); confirm it's still correct and
  look for any other place the same false-positive pattern could exist (e.g.
  in `demo-text`'s error handling).
- **Rate limiting UX**: trigger each rate limit deliberately (spam "Generate
  reply," spam the SMS send button) and confirm the user gets a clear,
  friendly message rather than a raw error or a silently-ignored click.
- **The Cal.com booking embed** (`components/BookCall.tsx`): confirm it
  actually renders a real calendar (it's wired to Cal's EU cloud instance,
  `app.cal.eu`, slug `fenwright/30min` — verify this is still the live,
  working configuration and that a visitor can actually pick a slot and book,
  not just that the iframe loads).
- **Form validation edge cases**: extremely long input in the free-text
  fields (enquiry, contact message — both capped at 500 chars via zod, but
  check the UI enforces/reflects that sanely), submitting with only
  whitespace, double-submitting by clicking a submit button twice quickly,
  and browser back/forward button behavior mid-flow.
- **Responsive/mobile**: check every section at common breakpoints (375px,
  768px, 1024px, 1440px) for overflow, cramped touch targets, or text that
  overlaps. Also check keyboard-only navigation and focus states across the
  whole page (nav, industry picker buttons, form fields, the mobile menu
  toggle in `components/Nav.tsx`).
- **General**: broken links/anchors, console errors on load or during any
  interaction, any hydration mismatch warnings, and whether reduced-motion
  users get a broken/blank experience anywhere reveal animations are used
  (`components/Reveal.tsx` and any `data-reveal` usage — it's designed to only
  hide content once a `js` class confirms JS is running, specifically so
  content never ships blank; verify that guarantee actually holds).

For anything you find, note whether it's reproducible, how to reproduce it,
and whether it's a real functional bug vs. a rough edge / polish item — I want
to know the difference so I can prioritize.

## What "done" looks like

For the **security audit**: a prioritized list of findings (critical / high /
medium / low), each with the file + line, a concrete exploit scenario, and a
recommended fix — not generic advice.

For the **legal research**: a clear statement of what Irish/EU (and UK, where
it diverges) law actually requires for a site like this (cite the specific
regulation/directive/statutory instrument), a gap list against what currently
exists on the site, and concrete next steps (e.g., "add a privacy policy page
covering X, Y, Z"; "add an explicit consent checkbox to the contact form
because ___"). I am not a lawyer and neither are you — flag clearly where
something needs an actual solicitor's sign-off versus where it's a
straightforward technical/content fix you can just implement.

For the **bug sweep**: a list of concrete, reproducible issues (what you did,
what happened, what you expected instead), each tagged as a functional bug, a
UX rough edge, or a cosmetic nit, roughly ordered by how much it would
actually confuse or block a real visitor.

Once all three are done, go ahead and implement the fixes that are
unambiguous (security hardening, real functional bugs, straightforward
technical/content additions like security headers or an obvious validation
fix); flag anything that's a business/legal judgment call, or a UX choice
with real tradeoffs (copy, how strict a validation rule should be, etc.), for
me to decide rather than guessing.

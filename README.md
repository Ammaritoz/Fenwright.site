# Fenwright site

Marketing website for Fenwright, an AI speed-to-lead receptionist studio for small
service businesses in Ireland and the UK. Single-page site plus serverless API
routes. The demo runs on the same system Fenwright sells: pick an industry, watch
an AI reply generate live, and optionally get that reply texted to your phone.

## Stack

- Next.js 14 (App Router) + TypeScript
- Tailwind CSS
- Anthropic Messages API (`claude-sonnet-4-6`), server-side only
- Twilio SMS, server-side only
- Airtable logging (`Leads` table)
- Upstash Redis rate limiting (in-memory fallback for local dev)
- Cal.com inline embed (`@calcom/embed-react`)

## Getting started

```bash
npm install
cp .env.example .env.local   # fill in your keys
npm run dev
```

Open http://localhost:3000.

The on-screen demo (`/api/demo-reply`) needs only `ANTHROPIC_API_KEY`.
Texting (`/api/demo-text`, `/api/contact`) also needs the Twilio vars.
Without Upstash vars, rate limiting falls back to an in-memory limiter and logs a
warning: production must set the Upstash vars.

## Editing copy

All visitor-facing copy and settings live in [`config/site.ts`](config/site.ts).
Rate-limit numbers and the daily SMS cap live in [`config/limits.ts`](config/limits.ts).
You should not need to touch components to change wording.

## Environment variables

See [`.env.example`](.env.example). Every secret is read server-side only. The
Anthropic and Twilio keys never reach the browser. Only `NEXT_PUBLIC_CALCOM_LINK`
is exposed to the client (it is a public booking handle).

## API routes

- `POST /api/demo-reply` — on-screen AI reply, no SMS. Rate limited per IP.
- `POST /api/demo-text` — real single-segment SMS. Consent required, E.164 phone,
  1/phone/24h, 3/IP/hour, global daily cap (`DEMO_SMS_DAILY_CAP`).
- `POST /api/contact` — texts the lead back, logs to Airtable, optional n8n forward.

## Deploy (Vercel)

Push to a git repo, import into Vercel, add the env vars from `.env.example` in the
Vercel project settings, and deploy. Domain `fenwright.ie` is managed in Cloudflare;
DNS is out of scope for this repo.

## Airtable

Base "Fenwright", table `Leads`. Expected fields: `Name`, `Phone`, `Message`,
`Industry`, `Source`, `Timestamp`. Missing fields are simply skipped by the logger.

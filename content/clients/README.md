# Client portal

Ten client-facing documents, rendered from one data file per client, at
`/portal/<slug>`. Each page also prints to a clean PDF.

## Adding a client

```bash
npm run portal:passcode -- "Bright Smile Dental"
```

Prints a slug, a passcode, and the salt/hash pair. The passcode is shown **once**
and is never written to disk; if it is lost, run the command again and replace
the salt and hash.

1. Copy `_template.ts` to `content/clients/<slug>.ts`.
2. Paste in the slug, salt and hash. Fill in the rest.
3. Import it in `index.ts` and add it to the `clients` array.
4. Deploy, then send the client their URL and passcode **in separate messages**.

Everything is typechecked, so `npm run typecheck` catches a missing due date or
a malformed date before a client ever sees it.

## Releasing documents over time

An engagement runs for months, so the ten documents are not sent at once. Each
one carries a `status`:

| `status` | On the index | Direct URL |
|---|---|---|
| `live` (default) | Listed and clickable | Opens |
| `upcoming` | Listed, greyed, with an `expected` note | Opens |
| `hidden` | Not listed | Opens |

A client who has just signed sees the agreement, welcome pack, brief, payment
details and deposit invoice as live, and the rest under **Coming later** with a
note like "On handover". They can see what they are getting; they cannot open a
report for work that has not happened.

To release a document, delete its `status` and `expected` lines. Use `hidden`
for one you are still drafting. Because upcoming and hidden documents still open
at their direct URL, you can proofread before releasing — the whole portal is
passcode-gated, so this controls tidiness rather than access.

Recurring documents are just new entries: add `report-2026-11` alongside
`report-2026-10`, or `invoice-002` alongside `invoice-001`.

## Things worth knowing

**Money is integer minor units.** `150000` is €1,500.00. Never write `1500.00`.

**Dates are `YYYY-MM-DD`**, periods are `YYYY-MM`. Both are validated: a
truncated `2026-08` throws rather than silently rendering 1 August.

**VAT is off.** `config/site.ts` has `legal.vatNumber: ""`, so invoices show no
VAT line and carry a note saying why. Set that field once registered and the row
appears on its own. `VAT_RATE` in `Invoice.tsx` is the Irish standard 23%.

**The agreement ships as a draft.** While `solicitorReviewed: false` it shows an
internal-only amber band. Get it reviewed, then flip the flag per client.

**Fill in `documents.paymentDetails`** in `config/documents.ts` before sending a
Payment Details doc. While the bank fields are blank the page shows a warning
instead of pretending to be payable.

## How access works

Two layers, either sufficient on its own:

- The URL contains 8 random hex characters, so slugs cannot be enumerated.
- A passcode unlocks it, setting a signed cookie scoped to that client's path
  for 30 days. The cookie is an HMAC over the slug, so one client's cookie can
  never open another's portal.

The gate is `middleware.ts`, not the layout — a Next layout can be skipped by
partial rendering and is not a security boundary.

Portal pages are kept out of search three ways: `noindex` metadata, a
`/portal/` disallow in `app/robots.ts`, and absence from the sitemap. Google
Analytics is disabled on `/portal/` entirely, because the slug is the access
credential and `gtag` would report the full URL to a third party.

Requires `PORTAL_COOKIE_SECRET` (32+ chars) in the environment. Changing it logs
every client out.

## Where things live

| Path | What |
|---|---|
| `content/clients/types.ts` | The data model |
| `config/documents.ts` | Standing content: clauses, packages, bank details |
| `components/portal/docs/` | One component per document type |
| `lib/portal/format.ts` | Money, dates, invoice totals |
| `lib/portal/auth.ts`, `cookie.ts` | Passcode and session |

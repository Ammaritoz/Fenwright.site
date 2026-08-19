import type { Client } from "./types";

/**
 * Blank client. Copy this file to content/clients/<slug>.ts for each new
 * client, fill it in, then register it in content/clients/index.ts.
 *
 * Underscore prefix keeps it out of the registry, but it is still typechecked,
 * so the template cannot silently rot out of date with the data model.
 *
 * Steps:
 *   1. npm run portal:passcode -- "Their Business Name"
 *   2. Copy the printed slug, salt and hash into the fields below.
 *   3. Delete any document your client does not need, and fill in the rest.
 *   4. Import and add to the `clients` array in content/clients/index.ts.
 *   5. Send them https://www.fenwright.ie/portal/<slug> and the passcode,
 *      separately from each other.
 *
 * Documents are staged, not dumped. Below, the ones a client sees the day they
 * sign are live; the rest are `upcoming`, so they can see what is coming but
 * cannot open a report for work that has not happened. As the engagement moves
 * on, delete the `status` and `expected` lines from a document to release it.
 * Use `status: "hidden"` for one you are still drafting. Both upcoming and
 * hidden documents still render at their direct URL, so you can proofread
 * before releasing.
 *
 * Money is in minor units: EUR 1,500.00 is 150000. Dates are YYYY-MM-DD.
 */
export const templateClient: Client = {
  // From `npm run portal:passcode`. Keep the random suffix: it is what stops
  // portal URLs being guessed.
  slug: "REPLACE-ME-00000000",
  passcodeSalt: "REPLACE-ME",
  passcodeHash: "REPLACE-ME",

  // EUR for Ireland, GBP for the UK. Drives every price on every document.
  currency: "EUR",

  business: {
    name: "[Business name]",
    contact: {
      name: "[Their name]",
      role: "[Their role]",
      email: "[their@email]",
      phone: "[Their phone]",
    },
    // Optional. Both are omitted cleanly from documents when left out.
    address: "[Billing address]",
    vatNumber: "",
  },

  docs: [
    {
      slug: "agreement",
      title: "Client Agreement",
      blurb: "What we are building, what it costs, and how we each end it.",
      payload: {
        type: "agreement",
        // Leave false until a solicitor has read it. While false, the document
        // shows an internal-only draft band warning you not to send the link.
        solicitorReviewed: false,
        scope: ["[What we are delivering, one bullet each]"],
        exclusions: ["[What is explicitly not included]"],
        totalFee: 0,
        schedule: [
          { label: "Deposit", amount: 0, due: "On signature", note: "Non-refundable." },
          { label: "Balance", amount: 0, due: "On handover" },
        ],
        noticeDays: 30,
        passThroughServices: ["[Service, and what it is for]"],
      },
    },
    {
      slug: "welcome",
      title: "Welcome Pack",
      blurb: "Everything you need to know about how the next few weeks run.",
      payload: {
        type: "welcome",
        projectName: "[Project name]",
        startDate: "2026-01-01",
        targetDelivery: "2026-01-31",
        pointOfContact: "Billal Khan",
      },
    },
    {
      slug: "brief",
      title: "Project Brief",
      blurb: "The scope agreed before any building started. Read it, correct it.",
      payload: {
        type: "brief",
        projectTitle: "[Project title]",
        deadline: "2026-01-31",
        objective: "[The business outcome, not the feature list]",
        audience: {
          who: "[Who their customers are]",
          painPoint: "[What goes wrong for them today]",
          cares: "[What actually matters to them]",
        },
        keyMessage: "[The one thing this work must get across]",
        successCriteria: ["[How we will know it worked, measurably]"],
      },
    },
    {
      slug: "payment",
      title: "Payment Details",
      blurb: "How to pay us, and the reference to use so it gets matched.",
      payload: {
        type: "payment",
        // Unique per client so a bank transfer can be matched without guessing.
        reference: "[SHORTNAME-01]",
      },
    },
    {
      slug: "invoice-001",
      title: "Invoice INV-001",
      blurb: "[What this invoice covers]",
      payload: {
        type: "invoice",
        number: "INV-001",
        issued: "2026-01-01",
        due: "2026-01-15",
        projectReference: "[Project name]",
        lines: [
          { kind: "Build", description: "[What they are paying for]", quantity: 1, unitPrice: 0 },
        ],
        // Deposit already received, if any. Drives the balance due.
        amountPaid: 0,
      },
    },
    {
      slug: "delivery",
      title: "Delivery Guide",
      blurb: "What we built, where it lives, and what to check each week.",
      // Release this one at handover.
      status: "upcoming",
      expected: "On handover",
      payload: {
        type: "delivery",
        deliveredOn: "2026-01-31",
        systems: [
          {
            name: "[System name]",
            whatItDoes: "[In their words, not ours]",
            platform: "[Telnyx / Cal.com / Airtable]",
            // "Client" wherever possible, so they own it if you ever part ways.
            accountOwner: "Client",
          },
        ],
        runbook: [{ title: "[Task they will do weekly]", body: "[Exactly what to click]" }],
        clientActions: ["[What they must keep on top of, e.g. keeping a card on file]"],
      },
    },
    {
      slug: "report-2026-01",
      title: "Monthly Report, January 2026",
      blurb: "What actually happened to your enquiries last month.",
      // One of these per month. Add the next as report-2026-02, and so on.
      status: "upcoming",
      expected: "Start of each month",
      payload: {
        type: "report",
        period: "2026-01",
        summary: "[Two or three sentences in plain English]",
        metrics: {
          enquiriesReceived: 0,
          enquiriesAnswered: 0,
          medianResponseMinutes: 0,
          bookingsMade: 0,
          noShows: 0,
          // Omit `previous` in the first month: with nothing to compare
          // against, the change indicators are hidden rather than invented.
        },
        actionsTaken: ["[What we changed or watched]"],
        nextMonth: ["[What we will do next]"],
      },
    },
    {
      slug: "thank-you",
      title: "Thank You",
      blurb: "The project is complete. Here is where things stand.",
      status: "upcoming",
      expected: "When we finish",
      payload: {
        type: "thank-you",
        projectName: "[Project name]",
        startDate: "2026-01-01",
        completedDate: "2026-01-31",
        // Write this one by hand. A generic thank-you is worse than none.
        note: "[Something specific and true about working with them]",
        whatNext: ["[What they should do over the next few weeks]"],
      },
    },
    {
      slug: "feedback",
      title: "Feedback",
      blurb: "Two minutes, and it genuinely helps us get better.",
      status: "upcoming",
      expected: "When we finish",
      payload: { type: "feedback", projectName: "[Project name]" },
    },
    {
      slug: "packages",
      title: "Services and Packages",
      blurb: "What ongoing support looks like, and what each level includes.",
      // Uses the standard tiers from config/documents.ts. Add a `tiers` array
      // here only to override them for a bespoke quote.
      payload: { type: "packages" },
    },
  ],
};

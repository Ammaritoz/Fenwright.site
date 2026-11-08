/**
 * The roofer page (app/roofing-leads) and the sample lead card it shares with
 * the homepage. Linked from the signature of every US roofer cold email
 * (outreach/us_roofing.py), so it is written for a Texas roofer first.
 *
 * Every rule here comes from course-notes/fenwright-lead-gen-playbook.md;
 * change the playbook first, then this. Rules the copy keeps:
 * - No prices. We never quote before an area's first leads show the real cost.
 * - No results, close rates or client claims until we have real ones.
 * - Guarantee the process (the checks), never the outcome (jobs).
 * - Leads arrive by email. Don't promise texts or "SMS verified".
 * No em dashes in visitor-facing copy (matches config/site.ts).
 */

export const roofing = {
  meta: {
    title: "Exclusive roofing leads",
    description:
      "Homeowners in your area asking for a roof quote, sent to one roofer per area. Prepaid packs, no retainer, and the first 5 leads free for the first roofer in each new area.",
  },

  hero: {
    headline: "Roofing leads that go to you,",
    headlineEmphasis: "and nobody else.",
    lead: "Homeowners in your area asking for a roof quote, from our own ads and our own quote form. Each enquiry is checked, then sent to one roofer per area the moment it comes in. No retainer, no shared leads.",
    offer:
      "We are launching area by area. The first roofer in each area gets their first 5 leads free, so you can judge them before you pay anything.",
    primaryCta: { label: "Book a call", href: "#book" },
    secondaryCta: { label: "What counts as a lead", href: "#checks" },
    note: "Ammar and Billal, Fenwright. You deal with us directly.",
  },

  // A made-up lead in the real format. Keep the "Example" label on it: it must
  // never read as a real homeowner or a real result. 555-01xx numbers and
  // example.com are reserved for fiction.
  sampleLead: {
    tag: "Example lead",
    title: "New roof quote request",
    sentAt: "Tue 7:42am",
    fields: [
      { label: "Name", value: "Dana Ruiz" },
      { label: "Phone", value: "(469) 555-0142" },
      { label: "Email", value: "dana.ruiz@example.com" },
      { label: "Area", value: "Plano, TX 75024" },
      { label: "Job", value: "Roof replacement, storm damage" },
      { label: "Wants it", value: "Within a month" },
      { label: "Notes", value: "Shingles missing on the back slope since last week's hail. Adjuster booked for Friday." },
    ],
    checksLabel: "Checks passed",
    checks: ["Name, phone and email checked", "Inside your ZIP codes", "Owns the home", "Wants it within a month", "Not a duplicate"],
    footer: "Sent to you only. No other roofer gets this lead.",
    disclaimer: "A made-up homeowner, in the format real leads arrive in.",
  },

  compare: {
    headline: "Not another shared lead site.",
    themLabel: "Typical shared lead sites",
    usLabel: "Fenwright",
    rows: [
      { them: "The same homeowner sent to several roofers at once", us: "One roofer per area. Every lead is yours alone" },
      { them: "Monthly fees whether the leads are any good or not", us: "Prepaid packs of 10, 30 or 50 leads. No contract" },
      { them: "Arguing over which leads were bad", us: "Written replacement rules, agreed before your first lead" },
      { them: "Pay first, find out later", us: "First 5 leads free if you are first in your area" },
    ],
  },

  checks: {
    headline: "What counts as a lead",
    lead: "Every lead passes all of these before it reaches you. If one fails, it is not sent.",
    items: [
      "Asked for a roofing quote or a callback through our own form",
      "A real name, and a valid phone number and email. Not a duplicate",
      "Owns the property",
      "Inside the ZIP codes you cover",
      "Wants the work in the timeframe we agree. We start with within a month",
      "Matches the jobs you chose, such as replacements, repairs or storm damage",
    ],
    note: "We agree this list with you in writing before your first lead.",
  },

  steps: {
    headline: "How it starts",
    items: [
      {
        title: "A short call",
        body: "Your areas, the jobs you want, and how many more you can take on each month. No price pitch.",
      },
      {
        title: "Your first 5 leads, free",
        body: "If you are the first roofer in your area, we switch on ads there and send you the first 5 leads that pass the checks, at no cost.",
      },
      {
        title: "You judge them",
        body: "A few days later we call to hear what happened with each one. Straight answers, both ways.",
      },
      {
        title: "Packs, if they are worth it",
        body: "Want more? Buy a pack of 10, 30 or 50. You know the exact price before you pay, we remind you when 8 are left, and leads pause when it runs out.",
      },
    ],
  },

  rules: {
    headline: "Fair rules, agreed up front",
    lead: "You pay for real homeowners who asked for a quote and pass the checks. Whether they become jobs depends on your price and your speed, so that is what the rules cover.",
    columns: [
      {
        title: "Your side",
        tone: "neutral",
        items: [
          "Call new leads within 10 minutes during working hours, or by 9am for evening leads",
          "No answer? Keep trying: 6 calls over 3 days, plus a text after the first missed call",
          "Keep a note of the attempts, so a lead that never picks up can be replaced",
        ],
      },
      {
        title: "Replaced",
        tone: "yes",
        items: [
          "Fake or wrong contact details",
          "Outside your agreed area",
          "A duplicate of a lead you already had",
          "Never asked for a quote",
          "Denies owning the home, or the timeframe, on the first call",
          "Never answers, after the full 6 calls",
        ],
      },
      {
        title: "Not replaced",
        tone: "no",
        items: [
          "Hired someone else, or nobody",
          "Thought the price was too high",
          "Changed their mind after you spoke",
          "Claimed more than 72 hours after the lead arrived",
        ],
      },
    ],
  },

  promise: {
    headline: "We promise real leads. We do not promise jobs.",
    body: "Every lead is a real homeowner in your area who meets the checks we agreed. Turning them into jobs is down to your price and how fast you call. If that is where jobs slip, we also build systems that answer and follow up for you.",
    cta: { label: "See the systems", href: "/#services" },
  },

  faq: {
    headline: "Questions roofers ask",
    items: [
      {
        q: "How much does a lead cost?",
        a: "It depends on your area and the jobs you want, and you will know the exact price before you pay anything. We set it once the first leads in your area show what they really cost to generate, so we never have to guess high.",
      },
      {
        q: "Does anyone else get my leads?",
        a: "No. One roofer per area. If a second roofer asks for the same area, we offer them the next area over.",
      },
      {
        q: "Is there a contract or a monthly fee?",
        a: "No. Leads come in prepaid packs. When a pack runs out, leads pause until you top up. Nothing renews by itself.",
      },
      {
        q: "How do leads reach me?",
        a: "By email, the moment each one passes the checks, with the homeowner's details and what they asked for.",
      },
      {
        q: "Where do the leads come from?",
        a: "Our own ads, shown only in your area, send homeowners to our own quote form. We do not buy, rent or resell lists.",
      },
      {
        q: "I already pay for leads. Why change?",
        a: "You do not have to. Plenty of roofers keep what they have and compare. Ours are not shared, so you are not racing anyone to the phone, and if you are first in your area the 5 free leads make the comparison easy.",
      },
      {
        q: "Who are you?",
        a: "Fenwright is Ammar and Billal, a two-person team based in Ireland. We run the ads, the quote forms and the checks, and we work to your hours. You deal with us directly, not a call centre.",
      },
    ],
  },

  book: {
    headline: "See if your area is still open",
    subhead: "A short call about your areas and the jobs you want. If it is a fit, we hold your area while we launch.",
  },
} as const;

export type Roofing = typeof roofing;

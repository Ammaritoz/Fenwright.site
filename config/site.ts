/**
 * Fenwright site config.
 *
 * Single source of truth for all editable copy and settings. Change copy here,
 * not in the components. No em dashes anywhere in visitor-facing copy.
 */

export type Industry = {
  /** stable id, used in API payloads */
  id: string;
  /** label shown in the picker */
  label: string;
  /** prefilled example enquiry for the demo input */
  exampleEnquiry: string;
  /** honest comparison line vs typical response time for this trade */
  averageLine: string;
};

export const site = {
  brand: {
    name: "Fenwright",
    wordmark: "Fenwright",
    tagline: "CRA vulnerability response for makers of connected products.",
    email: "contact@fenwright.ie",
  },

  nav: {
    // Leading "/" makes these resolve correctly from every route (e.g.
    // /privacy), not just from "/" itself -- a bare "#services" only
    // works when you're already on the homepage.
    links: [
      { label: "What we do", href: "/#services" },
      { label: "Free first look", href: "/#first-look" },
      { label: "How it works", href: "/#how-it-works" },
      { label: "About", href: "/#about" },
    ],
    cta: { label: "Book a call", href: "/#book" },
  },

  hero: {
    // The headline renders `headline` then `headlineEmphasis` on a second line.
    headline: "Never miss",
    headlineEmphasis: "a CRA report.",
    // Short line under the hero headline.
    lede: "We watch, check and draft every Cyber Resilience Act vulnerability report for makers of connected products. Nothing is submitted without your approval.",
    // Longer statement: the page's opening paragraph and the meta description.
    subhead:
      "Since September 2026, every maker of connected products sold in the EU has 24 hours to report an actively exploited security hole. Fenwright builds the ingredients list for each of your products, watches for exploited holes every day, checks whether each one really affects you, and drafts the report. You approve it and press submit. Need weekend cover? Our Assured plan works evenings, weekends and bank holidays, and if you report through Ireland we can submit for you.",
    primaryCta: { label: "Get a free first look", href: "#first-look" },
    secondaryCta: { label: "How it works", href: "#how-it-works" },
    // The strip along the bottom of the hero. Facts about the law and who we
    // serve only: no results or client numbers until there are real ones.
    facts: [
      { value: "24 hours", label: "To report an actively exploited vulnerability" },
      { value: "11 Dec 2027", label: "No compliance, no CE mark, no EU sales" },
      { value: "50 to 249 staff", label: "Built for mid-sized manufacturers" },
    ],
    // The "example week" sheet. Illustrative, not a client: keep the label
    // saying so. Weekend rows must say Assured: Core is working days only.
    // Never write "24/7" or promise a response time beyond the 12-hour draft
    // target (see cra-action-plan.md, "Claims to avoid").
    ledger: {
      label: "An example week",
      range: "Mon to Sat",
      columns: { before: "What happens now", after: "With Fenwright" },
      entries: [
        {
          day: "Mon",
          time: "09:10",
          leak: "A hole in a common Linux component is added to the exploited list. Nobody checks",
          fix: "Matched against every product and version you ship",
        },
        {
          day: "Tue",
          time: "11:30",
          leak: "A scanner flags 40 known holes. Nobody knows which ones matter",
          fix: "Each one marked affected or not, with a written reason",
        },
        {
          day: "Wed",
          time: "14:00",
          leak: "An exploited hole is confirmed in your firmware. The 24-hour clock starts",
          fix: "Early-warning draft in your hands, ready to submit",
        },
        {
          day: "Thu",
          time: "10:00",
          leak: "The 72-hour notification is due, and your team has never written one",
          fix: "Notification drafted, with the notice for your customers",
        },
        {
          day: "Fri",
          time: "16:30",
          leak: "A big customer asks for proof you handle vulnerabilities",
          fix: "Decision log and ingredients lists, exported for them",
        },
        {
          day: "Sat",
          time: "10:00",
          leak: "Friday evening's exploited hole needs an early warning by 18:00. Your engineers are off",
          fix: "On Assured: checked and drafted overnight, ready for you to approve",
        },
      ],
      footnote: "Most weeks nothing needs reporting. We still check every signal and write down why.",
    },
  },

  statement: {
    kicker: "What we do",
  },

  problem: {
    kicker: "Why it matters",
    headline: "The 24-hour clock starts when you find out, even on a Friday evening.",
    body: "Under Article 14 of the Cyber Resilience Act, once you know a hole in your product is being actively exploited, you have 24 hours to send an early warning to ENISA. A typical device holds hundreds of third-party software parts, so someone has to know what is inside every product and watch for new holes every day. Scanning tools need someone to run them and consultants work in one-off projects, so nobody ends up doing the daily watching.",
    stats: [
      {
        value: "24 hrs",
        label: "to send the early warning, then 72 hours for the full notification.",
      },
      {
        value: "62%",
        label: "of 200 German industrial firms surveyed called the 24-hour rule particularly problematic.",
      },
    ],
    source:
      "Sources: Regulation (EU) 2024/2847, Article 14; ONEKEY IoT/OT Cybersecurity Report 2026 (vendor survey of 200 German industrial firms).",
  },

  // Used by the contact API's validation (lib/industry.ts). One generic entry
  // now that the trade-specific demo is gone.
  industries: [
    {
      id: "other",
      label: "Other",
      exampleEnquiry: "Hi, can you tell me more about how this works and what it costs?",
      averageLine: "",
    },
  ] as Industry[],

  howItWorks: {
    kicker: "How it works",
    headline: "Start with a free first look. Then we keep watch.",
    // Caption on the photo card that opens the steps deck.
    photoCaption: "Built around how your engineers already work.",
    steps: [
      {
        title: "A free first look",
        body: "Send us one product's firmware or its list of software parts. We send back a short report of what we found. Under NDA, files deleted afterwards.",
      },
      {
        title: "Onboarding",
        body: "We build the ingredients list for each product and version, set up your ENISA reporting account with you, and run a timed practice exercise.",
      },
      {
        title: "We watch, you approve",
        body: "We match new exploited holes to your products every day, check each one, and send you a draft when one needs reporting. You submit it, or on Assured, if you report through Ireland, we can once you approve.",
      },
    ],
  },

  // The free first look (components/FirstLook.tsx): what they send, what they
  // get, beside a made-up example report (config/sample-report.ts).
  firstLook: {
    headline: "See where you stand, free.",
    lead: "Send us one product's firmware, or its list of software parts, and we will send back a short, plain-English report. It is a first look, not a compliance assessment.",
    steps: [
      {
        title: "You send one product",
        body: "A firmware image, or an SBOM if you already have one. One product is enough to start.",
      },
      {
        title: "We list what is inside",
        body: "Every software component we can find, with its version, as a draft ingredients list you can keep.",
      },
      {
        title: "We check it against known holes",
        body: "Known security holes in those parts, and any on the actively exploited lists that would start the 24-hour clock.",
      },
      {
        title: "You get a short report",
        body: "What we found, and the gaps against the CRA, like a missing disclosure policy or security contact. Then 20 minutes to talk it through.",
      },
    ],
    // Caption on the photo card at the end of the steps deck.
    photoCaption: "Under NDA. Your files are deleted after the scan.",
    banner: {
      headline: "The 24-hour rule already applies to the products you have in the field.",
      note: "It covers products already on the market, not just new ones. A first look tells you what you would be dealing with.",
    },
    cta: { label: "Get a free first look", href: "#book" },
    // A real First Look made from open-source router firmware (OpenWrt), with
    // the product unnamed. Only ever publish samples built from public,
    // open-source firmware: never a client's or another company's product.
    sample: { label: "See a sample report", note: "PDF, 2 pages", href: "/samples/first-look-sample.pdf" },
  },

  about: {
    kicker: "Leadership",
    headline: "The people you will work with.",
    subhead:
      "From the first look to every draft report, you work directly with the people who build the pipeline and check each decision.",
    // Shared business WhatsApp in E.164. Empty string hides the buttons.
    whatsapp: "+353899406583",
    whatsappPreset: "Hi Fenwright, I'd like to talk about the CRA.",
    people: [
      {
        name: "Ammar Bakhet",
        role: "CTO",
        initials: "AB",
        bio: "Ammar builds the pipeline: unpacking firmware, listing every component, matching it against exploited-vulnerability feeds and drafting the reports. He reviews the decisions it makes.",
        // Full profile URL. Empty string hides this person's LinkedIn button.
        linkedin: "https://www.linkedin.com/in/ammar-bakhet-b66b97364",
      },
      {
        name: "Billal Khan",
        role: "COO",
        initials: "BK",
        bio: "Billal runs onboarding and every client relationship: your ENISA reporting setup, the playbook your team follows, and the call when something needs a decision.",
        linkedin: "https://www.linkedin.com/in/billal-khan-95b26544a/",
      },
    ],
  },

  services: {
    kicker: "What we do",
    headline: "We know what is inside your products, and we draft the report when one is due.",
    // Two halves: knowing (ingredients list, watching, checking) and acting
    // (drafts, customer notice, paper trail).
    groups: [
      {
        kicker: "Watch",
        image: "components",
        title: "Know what is inside",
        lead: "Every software part in every product, checked against new threats every day.",
        bullets: [
          {
            title: "An ingredients list for each product",
            body: "We build the software bill of materials (SBOM) from your code or firmware, including products already shipped, in open formats you can take with you.",
          },
          {
            title: "Watching, every day",
            body: "New entries on the exploited-vulnerability lists, like CISA KEV and the EU vulnerability database, matched against every product and version you sell.",
          },
          {
            title: "Checked, with a written reason",
            body: "Each match is marked affected or not affected in your shipped configuration, with the reason written down and signed off by one of us.",
          },
        ],
      },
      {
        kicker: "Report",
        image: "systems",
        title: "Report on time",
        lead: "Drafts ready to submit, and a record that stands up later.",
        bullets: [
          {
            title: "Every report drafted",
            body: "Paste-ready text for each field of ENISA's form: the 24-hour early warning, the 72-hour notification and the final report. You approve and submit, or on Assured, if you report through Ireland, we can submit once you approve.",
          },
          {
            title: "Your customer notice",
            body: "The advisory you send your own customers: what is affected, how serious it is, and what to do.",
          },
          {
            title: "A paper trail for December 2027",
            body: "A timestamped log of every signal, who checked it and why, including the ones that were not reportable. It becomes evidence for your technical file.",
          },
        ],
      },
    ],
  },

  book: {
    kicker: "Book a call",
    headline: "Tell us what you make. We will tell you where you stand on the 24-hour rule.",
    subhead:
      "A short, no-pressure call. If we cannot see something worth paying for, we will say so.",
  },

  // Copy for components/ContactForm.tsx, which is no longer on the homepage.
  contact: {
    kicker: "Prefer to text?",
    headline: "Prefer we text you first?",
    subhead: "Leave your number and a line about what you need.",
    note: "A real reply, from a real number.",
    nameLabel: "Your name",
    phoneLabel: "Your mobile number",
    messageLabel: "What do you need?",
    messagePlaceholder: "e.g. We make connected sensors and want to understand the 24-hour rule.",
    submitLabel: "Text me back",
    consentLabel:
      "Text me one reply at this number. I can reply STOP to opt out. No spam, ever.",
    consentNote: "We only use your number to reply and follow up. See our Privacy Policy.",
    success: "Check your phone.",
    // Shown when we captured the lead but the text could not be delivered.
    successNoText:
      "Got it. We have your details and will be in touch very soon.",
  },

  footer: {
    blurb:
      "Fenwright helps makers of connected products meet the Cyber Resilience Act's reporting rules: we watch, check and draft, and nothing is submitted without your approval.",
    email: "contact@fenwright.ie",
    // Extra footer links after the nav ones.
    links: [
      { label: "ENISA platform guide", href: "/guides/enisa-single-reporting-platform" },
      { label: "Security", href: "/security" },
    ],
    copyright: `© ${new Date().getFullYear()} Fenwright. All rights reserved.`,
  },

  cookieConsent: {
    text: "We use analytics cookies to see how the site is doing. They're off until you say yes.",
    acceptLabel: "Accept",
    declineLabel: "Decline",
    privacyLabel: "Privacy Policy",
  },

  // Cal.com: public link + instance used by the inline embed.
  // The account moved from Cal's EU cloud (cal.eu) to the default cal.com cloud
  // on 2026-10-28; these defaults follow it.
  calcom: {
    link: process.env.NEXT_PUBLIC_CALCOM_LINK || "fenwright/30min",
    // Origin the embed iframe + embed.js load from (app.cal.eu for EU, app.cal.com for the default cloud).
    origin: process.env.NEXT_PUBLIC_CALCOM_ORIGIN || "https://app.cal.com",
    // Public booking URL base used in the SMS text-back link.
    bookingBase: process.env.NEXT_PUBLIC_CALCOM_BOOKING_BASE || "https://cal.com",
  },

  // Legal / imprint details, surfaced in the footer and on /privacy. Blank
  // fields (address, registrationNumber, vatNumber) are omitted cleanly by
  // both renderers, not shown as placeholders.
  legal: {
    // Incorporated 2026-11-10 as FEN WRIGHT OPERATIONS LIMITED (CRO no. 830234);
    // "Fenwright" is its trading name.
    entityName: "FEN WRIGHT OPERATIONS LIMITED, trading as Fenwright",
    tradingName: "Fenwright",
    // Deliberately blank (owner's call, 2026-11-12): the registered office is
    // the owner's home, so it stays off the site until a paid registered-office
    // address exists. The US cold emails carry a postal address for CAN-SPAM.
    // Footer + /privacy render cleanly with "".
    address: "",
    // CRO company number.
    registrationNumber: "830234",
    // VAT number if VAT-registered; leave "" otherwise.
    vatNumber: "",
    contactEmail: "contact@fenwright.ie",
    // How long leads are kept in Airtable before deletion.
    dataRetention: "12 months",
    privacyLastUpdated: "17 November 2026",
  },
} as const;

export type Site = typeof site;

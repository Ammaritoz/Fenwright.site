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
    tagline: "The AI receptionist that texts every lead back in seconds.",
    email: "contact@fenwright.ie",
  },

  nav: {
    links: [
      { label: "How it works", href: "#how-it-works" },
      { label: "Demo", href: "#demo" },
    ],
    cta: { label: "Book a call", href: "#book" },
  },

  hero: {
    kicker: "Speed to lead, done for you",
    headline: "Your next customer texts three businesses. Only the fastest reply wins.",
    subhead:
      "Fenwright answers every missed call and web enquiry with a warm, on-brand text in about 60 seconds, so the lead is yours before it goes cold.",
    primaryCta: { label: "Book a call", href: "#book" },
    secondaryCta: { label: "Try the live demo", href: "#demo" },
    // The mock phone badge
    phone: {
      badge: "8s",
      businessName: "Bright Smile Dental",
      incoming: "Hi, do you have any appointments this week for a check up and clean?",
      reply:
        "Hi! Thanks for reaching out to Bright Smile Dental. Yes, we have space this week. What day suits you best and I will get you booked in.",
    },
  },

  problem: {
    kicker: "The real cost of a slow reply",
    headline: "Leads do not wait. Most businesses make them.",
    body: "When someone enquires, they are ready to buy right now. Reach them in the first five minutes and you are far more likely to win the job. Wait, and they have already booked with whoever answered first.",
    stats: [
      {
        value: "21x",
        label:
          "more likely to qualify a lead when you respond within 5 minutes versus 30 minutes.",
      },
      {
        value: "40+ hrs",
        label: "the average business response time to a new online enquiry.",
      },
      {
        value: "~60s",
        label: "Fenwright's reply time, every time, day or night.",
      },
    ],
    source:
      "Source: lead response research from MIT and InsideSales.com (Oldroyd, McElheran and Elkington). Figures reflect the widely cited findings; results vary by business.",
  },

  demo: {
    kicker: "The demo is the product",
    headline: "Watch it reply. Then have it text your phone.",
    subhead:
      "Pick an industry, send a mock enquiry, and see the exact kind of reply your customers would get. This page runs on the same system we build for you.",
    generateLabel: "Generate reply",
    regenerateLabel: "Try another",
    enquiryLabel: "What is the customer asking?",
    // Stage two
    sms: {
      heading: "Want that text on your actual phone?",
      body: "We will send this one reply to your number so you can feel the speed for yourself.",
      consentLabel:
        "Send one text message to this number. Standard message rates may apply.",
      sendLabel: "Send this to my phone",
      phoneLabel: "Your mobile number",
      phonePlaceholder: "+353 87 123 4567",
      successLabel: "Sent. Check your phone.",
      metaSell:
        "That text is exactly what your customers would get, in about the time it just took.",
    },
  },

  industries: [
    {
      id: "dental",
      label: "Dental clinic",
      exampleEnquiry:
        "Hi, do you have any appointments this week for a check up and clean?",
      averageLine: "Most clinics take hours to reply to a web enquiry.",
    },
    {
      id: "aesthetics",
      label: "Aesthetic / beauty clinic",
      exampleEnquiry:
        "How much is lip filler and do you have anything on Saturday?",
      averageLine: "The average clinic reply lands long after the moment has passed.",
    },
    {
      id: "salon",
      label: "Hair salon",
      exampleEnquiry:
        "Looking for a cut and full head of highlights, what are your prices?",
      averageLine: "Most salons only see the message when the chair is already booked.",
    },
    {
      id: "plumber",
      label: "Plumber",
      exampleEnquiry:
        "I have a leak under the kitchen sink, can someone come out today?",
      averageLine: "Tradespeople often reply hours later, once the job is gone.",
    },
    {
      id: "electrician",
      label: "Electrician",
      exampleEnquiry:
        "Fuse board keeps tripping, are you taking new jobs this week?",
      averageLine: "Emergency jobs go to whoever answers first, not best.",
    },
    {
      id: "trades",
      label: "General trades",
      exampleEnquiry:
        "Can I get a quote to fit a new bathroom, roughly how long is the wait?",
      averageLine: "Quote requests usually sit unanswered for a day or more.",
    },
    {
      id: "other",
      label: "Other",
      exampleEnquiry: "Hi, I saw your ad, can you tell me more and what it costs?",
      averageLine: "Most small businesses reply far too late to win the lead.",
    },
  ] as Industry[],

  howItWorks: {
    kicker: "How it works",
    headline: "A lead comes in. It never goes cold.",
    steps: [
      {
        title: "A lead comes in",
        body: "A missed call, a website form, or a Facebook or Instagram ad enquiry. Fenwright catches all of them.",
      },
      {
        title: "The AI replies in about 60 seconds",
        body: "A warm, on-brand text goes out straight away, asks the right question, and keeps the conversation moving.",
      },
      {
        title: "You get a warm, captured lead",
        body: "Every detail is logged, and if a human is needed you get an instant handoff alert. Nothing slips through.",
      },
    ],
  },

  whatYouGet: {
    kicker: "What you get",
    headline: "A receptionist that never misses, never sleeps, never forgets.",
    bullets: [
      {
        title: "Every lead source, covered",
        body: "Missed calls, website forms, and Facebook or Instagram lead ads all get an instant reply.",
      },
      {
        title: "Replies that sound like you",
        body: "Natural, on-brand messages that ask the right questions and move people toward booking.",
      },
      {
        title: "Nothing gets lost",
        body: "Every enquiry is captured and logged, so you always know who reached out and what they needed.",
      },
      {
        title: "A human handoff when it matters",
        body: "When a lead needs a person, you get an alert with the full context, ready to take over.",
      },
    ],
  },

  book: {
    kicker: "Book a call",
    headline: "See what this looks like for your business.",
    subhead:
      "A short, no pressure call. We will show you exactly how Fenwright would answer your leads and what it takes to get live.",
  },

  contact: {
    kicker: "The instant text back",
    headline: "Prefer we text you first?",
    subhead:
      "Leave your number and a line about what you need. You will get a real text back from Fenwright in seconds, the same thing your customers would feel.",
    nameLabel: "Your name",
    phoneLabel: "Your mobile number",
    messageLabel: "What do you need?",
    messagePlaceholder: "e.g. I run a salon and miss calls when we are with clients.",
    submitLabel: "Text me back",
    consentLabel:
      "Text me one reply at this number. I can reply STOP to opt out. No spam, ever.",
    consentNote: "We only use your number to reply and follow up. See our Privacy Policy.",
    success:
      "Check your phone. That text is exactly what we build for your customers.",
    // Shown when we captured the lead but the text could not be delivered.
    successNoText:
      "Got it. We have your details and will be in touch very soon.",
  },

  footer: {
    blurb: "AI speed to lead for small service businesses in Ireland and the UK.",
    email: "contact@fenwright.ie",
    copyright: `© ${new Date().getFullYear()} Fenwright. All rights reserved.`,
  },

  // Cal.com: public link + instance used by the inline embed.
  // This account is on Cal's EU cloud (cal.eu), so the embed origin points there.
  calcom: {
    link: process.env.NEXT_PUBLIC_CALCOM_LINK || "fenwright/30min",
    // Origin the embed iframe + embed.js load from (app.cal.eu for EU, app.cal.com for the default cloud).
    origin: process.env.NEXT_PUBLIC_CALCOM_ORIGIN || "https://app.cal.eu",
    // Public booking URL base used in the SMS text-back link.
    bookingBase: process.env.NEXT_PUBLIC_CALCOM_BOOKING_BASE || "https://cal.eu",
  },

  // Legal / imprint details, surfaced in the footer and on /privacy. Blank
  // fields (address, registrationNumber, vatNumber) are omitted cleanly by
  // both renderers, not shown as placeholders.
  legal: {
    // Not yet an incorporated company: trading as a sole trader/unregistered
    // business name. If you incorporate later, switch this to the company
    // name and fill registrationNumber below.
    entityName: "Ammar Bakhet, trading as Fenwright",
    tradingName: "Fenwright",
    // Deliberately omitted (owner's call). A geographic address is technically
    // required for e-commerce sites under the Irish E-Commerce Regulations
    // 2003, but it does not have to be a home address — a registered/virtual
    // office or accountant's address would satisfy it. Add one via this field
    // whenever that's sorted; footer + /privacy already render cleanly with "".
    address: "",
    // Leave "" until incorporated with the CRO (not applicable to sole traders).
    registrationNumber: "",
    // VAT number if VAT-registered; leave "" otherwise.
    vatNumber: "",
    contactEmail: "contact@fenwright.ie",
    // How long leads are kept in Airtable before deletion.
    dataRetention: "12 months",
    privacyLastUpdated: "24 July 2026",
  },
} as const;

export type Site = typeof site;

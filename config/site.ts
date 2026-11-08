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
    tagline: "Exclusive local leads, and the systems that win them.",
    email: "contact@fenwright.ie",
  },

  nav: {
    // Leading "/" makes these resolve correctly from every route (e.g.
    // /privacy), not just from "/" itself -- a bare "#services" only
    // works when you're already on the homepage.
    links: [
      { label: "What we do", href: "/#services" },
      { label: "Leads", href: "/#leads" },
      { label: "Demo", href: "/#demo" },
      { label: "How it works", href: "/#how-it-works" },
      { label: "About", href: "/#about" },
    ],
    cta: { label: "Book a call", href: "/#book" },
  },

  hero: {
    // The headline renders `headline` then `headlineEmphasis` in italic.
    headline: "More jobs in.",
    headlineEmphasis: "Fewer let slip.",
    subhead:
      "Fenwright sends you exclusive enquiries from customers in your area, one business per area, then builds the systems that answer, follow up and win them. Use one, or both.",
    primaryCta: { label: "Book a call", href: "#book" },
    secondaryCta: { label: "How the leads work", href: "#leads" },
    note: "Ammar and Billal. Two people, no agency retainers, no jargon.",
    // The "example week" sheet beside the headline. Illustrative, not a client:
    // keep the label saying so.
    ledger: {
      label: "An example week",
      range: "Mon to Fri",
      entries: [
        {
          day: "Mon",
          time: "07:50",
          leak: "Crew free on Thursday, nothing booked",
          fix: "New quote request from your area, sent to you only",
        },
        {
          day: "Tue",
          time: "13:15",
          leak: "Website enquiry left unread until Thursday",
          fix: "Replied to straight away",
        },
        {
          day: "Wed",
          time: "10:20",
          leak: "Bought a shared lead, lost the race to call",
          fix: "Exclusive enquiry. Nobody else rang them",
        },
        {
          day: "Thu",
          time: "18:30",
          leak: "Last week's quote went quiet",
          fix: "Followed up until they gave an answer",
        },
        {
          day: "Fri",
          time: "16:00",
          leak: "Happy customer, no review asked for",
          fix: "Review request went out after the job",
        },
      ],
      footnote: "Two kinds of leak: too few enquiries, and enquiries let slip. We fix both.",
    },
  },

  problem: {
    kicker: "Where the day goes",
    headline: "Shared leads start a race. Slow replies lose it.",
    body: "Many lead sites send the same enquiry to several firms at once, so you pay for a job you then have to race for. Even an enquiry that is yours alone goes cold fast. Two things decide how much work you win: where your enquiries come from, and how quickly they get answered. Speed matters more than most people think:",
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
    ],
    source:
      "Source: lead response research from MIT and InsideSales.com (Oldroyd, McElheran and Elkington). Figures reflect the widely cited findings; results vary by business.",
  },

  demo: {
    kicker: "Proof, not promises",
    headline: "Try one of our systems right now.",
    subhead:
      "This is a reception system we build for clinics, salons and trades, running live on this page. Pick an industry, send a mock enquiry, and watch the reply come back in seconds. Then have it text your actual phone.",
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
    // In-browser call to the voice receptionist (components/VoiceCall.tsx).
    // Hidden unless NEXT_PUBLIC_VAPI_PUBLIC_KEY and _ASSISTANT_ID are set.
    voice: {
      heading: "Rather hear it than read it?",
      body: "Talk to Erin, the phone receptionist we built for a sample electrician. Ring her the way a customer would: a fuse board that keeps tripping, a quote, a callout tonight.",
      note: "Uses your microphone. Calls last up to five minutes and are recorded so we can improve the system.",
      startLabel: "Talk to the receptionist",
      connectingLabel: "Connecting...",
      liveLabel: "Live with Erin",
      endLabel: "End call",
      endedLabel: "Call ended. That is what your callers would get.",
      endedCta: { label: "Book a call", href: "#book" },
      micError: "We could not use a microphone. Check one is connected and allowed for this site, then try again.",
      genericError: "The call could not connect. Please try again in a moment.",
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
    headline: "One short call. A clear plan. Then we switch it on.",
    steps: [
      {
        title: "Book a call",
        body: "A short call with one of us about where your work comes from and where it slips. No pitch, no jargon.",
      },
      {
        title: "Get a plain-English plan",
        body: "Whether to start with more enquiries, faster replies or both, what each is worth to you, and a fixed price.",
      },
      {
        title: "We switch it on",
        body: "Leads go live for your area within 72 hours of payment. Systems are built around how you already work.",
      },
    ],
  },

  // The "Get" half of the offer on the homepage (components/Leads.tsx). The
  // trade-specific detail lives on its own page (config/roofing.ts).
  leads: {
    headline: "How the leads work",
    lead: "We run lead generation one trade at a time, so every ad and every question on the form is built for that trade. Right now, that trade is roofing.",
    steps: [
      {
        title: "We agree your patch",
        body: "The areas you cover, the jobs you want and how many more you can take on. One business per area, so nobody else gets your leads.",
      },
      {
        title: "We run the ads",
        body: "Our own ads send local customers to our own quote form, which checks every enquiry before it goes anywhere.",
      },
      {
        title: "Leads land in seconds",
        body: "Each one is emailed to you the moment it passes the checks, with everything you need to call them back.",
      },
      {
        title: "You call, we keep count",
        body: "Call within 10 minutes and they are far easier to win. We send a weekly update and remind you before a pack runs out.",
      },
    ],
    cta: { label: "Roofer? See how it works for you", href: "/roofing-leads" },
    note: "Another trade? Tell us what you do on a call and we will say honestly whether we can run it for you.",
  },

  about: {
    kicker: "Who you'll work with",
    headline: "Two people, fully dedicated to your business.",
    subhead:
      "From the first call to the day your systems go live, you're working directly with the two of us, not passed between departments.",
    // Shared business WhatsApp in E.164. Empty string hides the buttons.
    whatsapp: "+353899406583",
    whatsappPreset: "Hi Fenwright, I'd like to talk about my business.",
    people: [
      {
        name: "Ammar Bakhet",
        role: "CTO",
        initials: "AB",
        bio: "Ammar designs and builds the systems: the reply engines, booking flows and automations that do the work. If it runs on its own, he made it run.",
        // Full profile URL. Empty string hides this person's LinkedIn button.
        linkedin: "https://www.linkedin.com/in/ammar-bakhet-b66b97364",
      },
      {
        name: "Billal Khan",
        role: "Consulting & COO",
        initials: "BK",
        bio: "Billal leads the consulting. He sits down with you, works out where your week leaks time and money, and turns that into a plan worth building.",
        linkedin: "https://www.linkedin.com/in/billal-khan-95b26544a/",
      },
    ],
  },

  services: {
    kicker: "What we do",
    headline: "We bring the enquiries in, then help you win them.",
    // Two equal halves: the lead packs ("Get") and the systems ("Answer",
    // "Convert", "Grow"). Keep them the same length so neither reads as the
    // add-on.
    groups: [
      {
        title: "Get more enquiries",
        lead: "Exclusive leads from our own ads and quote forms.",
        bullets: [
          {
            title: "Yours alone",
            body: "Each enquiry goes to one business in the area, the moment it comes in. Never shared, never resold.",
          },
          {
            title: "Checked before they reach you",
            body: "A real person in your area, asking for the work you do, in the timeframe you set. A lead that fails the checks we agreed gets replaced.",
          },
          {
            title: "Prepaid packs, no retainer",
            body: "Packs of 10, 30 or 50 leads. No monthly contract, and you know the price before you pay.",
          },
        ],
      },
      {
        title: "Win more of them",
        lead: "Systems that answer, follow up and bring customers back.",
        bullets: [
          {
            title: "Every enquiry answered",
            body: "Missed calls, website forms and ad enquiries get a warm reply straight away, so the job is yours before anyone else picks up the phone.",
          },
          {
            title: "Quotes followed up",
            body: "Polite follow-ups go out until the customer gives you an answer, so work you have priced does not go quiet.",
          },
          {
            title: "Bookings, reviews and repeat work",
            body: "Reminders before the visit, a review request after it, and a check-in with past customers when it is time again.",
          },
        ],
      },
    ],
  },

  book: {
    kicker: "Book a call",
    headline: "Tell us where your work comes from. We will tell you what we would do first.",
    subhead:
      "A short, no-pressure call. If we cannot see something worth paying for, we will say so.",
  },

  contact: {
    kicker: "Prefer to text?",
    headline: "Prefer we text you first?",
    subhead:
      "Leave your number and a line about what you need, and one of our systems will text you back the same way it would text your customers.",
    note: "A real reply, from a real number, straight away.",
    nameLabel: "Your name",
    phoneLabel: "Your mobile number",
    messageLabel: "What do you need?",
    messagePlaceholder: "e.g. I run a roofing company and want more quote requests.",
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
    blurb:
      "Fenwright sends small businesses exclusive local enquiries, then builds the systems that answer, follow up and win them.",
    email: "contact@fenwright.ie",
    // Extra footer links after the nav ones.
    links: [{ label: "For roofers", href: "/roofing-leads" }],
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
    // Not yet an incorporated company: trading as a sole trader/unregistered
    // business name. If you incorporate later, switch this to the company
    // name and fill registrationNumber below.
    entityName: "Ammar Bakhet, trading as Fenwright",
    tradingName: "Fenwright",
    // Deliberately blank (owner's call, confirmed again 2026-11-08): the postal
    // address goes in the US cold emails only (US_POSTAL_ADDRESS in
    // outreach/.env), never on the site. Footer + /privacy render cleanly
    // with "".
    address: "",
    // Leave "" until incorporated with the CRO (not applicable to sole traders).
    registrationNumber: "",
    // VAT number if VAT-registered; leave "" otherwise.
    vatNumber: "",
    contactEmail: "contact@fenwright.ie",
    // How long leads are kept in Airtable before deletion.
    dataRetention: "12 months",
    privacyLastUpdated: "8 November 2026",
  },
} as const;

export type Site = typeof site;

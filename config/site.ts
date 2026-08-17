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
    tagline: "Consulting and systems that give small businesses their time back.",
    email: "contact@fenwright.ie",
  },

  nav: {
    // Leading "/" makes these resolve correctly from every route (e.g.
    // /privacy), not just from "/" itself -- a bare "#services" only
    // works when you're already on the homepage.
    links: [
      { label: "What we do", href: "/#services" },
      { label: "Demo", href: "/#demo" },
      { label: "How it works", href: "/#how-it-works" },
      { label: "About", href: "/#about" },
    ],
    cta: { label: "Book a call", href: "/#book" },
  },

  hero: {
    kicker: "For busy service businesses in Ireland and the UK",
    headline: "You did not start your business to chase paperwork and missed calls.",
    subhead:
      "Fenwright works with clinics, salons and trades to find where the week leaks time and money, then builds the quiet systems that plug it. Enquiries answered, bookings kept, admin handled.",
    primaryCta: { label: "Book a call", href: "#book" },
    secondaryCta: { label: "See a live example", href: "#demo" },
    note: "No jargon, no big-agency retainers. Two people who fix how your week runs.",
    // The mock phone badge
    phone: {
      badge: "8s",
      caption: "A system we built for them",
      businessName: "Bright Smile Dental",
      incoming: "Hi, do you have any appointments this week for a check up and clean?",
      reply:
        "Hi! Thanks for reaching out to Bright Smile Dental. Yes, we have space this week. What day suits you best and I will get you booked in.",
    },
  },

  problem: {
    kicker: "Where the day goes",
    headline: "Small businesses rarely lose money in big ways. They lose it in minutes.",
    body: "A call missed while you are with a customer. A quote you meant to send on Friday. An evening gone to invoices. None of it looks like a crisis, and together it quietly caps how far your business can grow. The clearest leak of all is the enquiry that never got answered:",
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
    headline: "One short call. A clear plan. Systems that quietly run.",
    steps: [
      {
        title: "Book a call",
        body: "Thirty minutes with Billal about how your week actually runs. No pitch, no jargon, just questions about where the time goes.",
      },
      {
        title: "Get a plain-English plan",
        body: "We come back with the two or three fixes worth doing first, what each one is worth to you, and a fixed price.",
      },
      {
        title: "We build it, you feel it",
        body: "Ammar builds the systems around how you already work. Leads answered, diary fuller, evenings back.",
      },
    ],
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
        linkedin: "https://www.linkedin.com/in/billal-khan-100505424",
      },
    ],
  },

  services: {
    kicker: "What we do",
    headline: "We find the leak, then build the fix.",
    bullets: [
      {
        title: "Every enquiry answered",
        body: "Missed calls, website forms and ad enquiries get a warm reply straight away, so the job is yours before anyone else picks up the phone.",
      },
      {
        title: "Bookings that look after themselves",
        body: "Confirmations, reminders and follow-ups go out on time, every time. Fewer no-shows, a fuller diary.",
      },
      {
        title: "Admin off your plate",
        body: "Quotes, invoices and customer records kept tidy automatically, instead of eating your evenings.",
      },
      {
        title: "One clear picture",
        body: "Every lead, job and follow-up logged in one place, so you always know where the money is.",
      },
    ],
  },

  book: {
    kicker: "Book a call",
    headline: "Tell us how your week runs. We will tell you what we would fix.",
    subhead:
      "A short, no-pressure call. If we cannot see a fix worth paying for, we will say so.",
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
    blurb:
      "Fenwright helps small service businesses in Ireland and the UK run faster. Enquiries answered, bookings kept, admin handled.",
    email: "contact@fenwright.ie",
    copyright: `© ${new Date().getFullYear()} Fenwright. All rights reserved.`,
  },

  cookieConsent: {
    text: "We use analytics cookies to see how the site is doing. They're off until you say yes.",
    acceptLabel: "Accept",
    declineLabel: "Decline",
    privacyLabel: "Privacy Policy",
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

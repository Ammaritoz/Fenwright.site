/**
 * Standing document content: the parts that are the same for every client.
 *
 * Client-specific values live in content/clients/<slug>.ts. This file is the
 * Fenwright side of every document -- contract clauses, onboarding steps,
 * package tiers, bank details. Edit copy here, not in the components, the same
 * convention config/site.ts sets for the marketing pages.
 *
 * No em dashes in client-facing copy (matches config/site.ts).
 */

import type { PackageTier } from "@/content/clients/types";

export const documents = {
  /**
   * Sub-processors named in the Article 28 clauses. GDPR requires the client
   * to know who else touches their customers' data, and where. Keep this list
   * honest: if a service is added to a build, it belongs here before go-live.
   */
  subProcessors: [
    { name: "Telnyx", purpose: "Sending and receiving SMS", location: "United States" },
    { name: "Anthropic", purpose: "Generating reply drafts", location: "United States" },
    { name: "Airtable", purpose: "Storing enquiry and booking records", location: "United States" },
    { name: "Vapi", purpose: "Handling inbound voice calls", location: "United States" },
    { name: "Upstash", purpose: "Rate limiting and short-lived caching", location: "European Union" },
    { name: "Cal.com", purpose: "Booking and calendar scheduling", location: "United States" },
    { name: "Vercel", purpose: "Hosting the systems we build", location: "European Union" },
  ],

  agreement: {
    /**
     * Rendered above the signature block. Section bodies may contain {tokens}
     * that Agreement.tsx substitutes from the client's data, listed per clause.
     */
    intro:
      "This agreement sets out what we will build for you, what it costs, and how we each end the arrangement if it stops working. It is written to be read, not to be survived. If any part of it is unclear, ask us before you sign.",

    clauses: [
      {
        title: "Scope of work",
        body: "We will deliver the work described in the Scope section above. Anything listed under Not included is outside this agreement. Work outside the scope is quoted and agreed separately in writing before it begins. Where a change is small and we can absorb it, we will, and we will tell you rather than invoice you a surprise.",
      },
      {
        title: "Fees and payment",
        body: "The total fee and payment schedule are set out above. Invoices are payable within {paymentTermDays} days of the invoice date. Where a deposit is stated, work begins once it clears. We do not begin build work on an unsigned agreement.",
      },
      {
        title: "Late payment",
        body: "Where an invoice is overdue we may suspend the systems we operate for you, after giving you at least seven days written notice and a chance to settle. We reserve our statutory right to interest and reasonable recovery costs on late commercial payments under the European Communities (Late Payment in Commercial Transactions) Regulations 2012. We would always rather ring you than invoke this.",
      },
      {
        title: "Third party services and costs",
        body: "Some systems we build run on third party services. Wherever it is practical, these run on accounts in your name, billed to you directly, so that you own them and can keep them if we part ways. You are responsible for those subscription costs. We will tell you what is needed and roughly what it costs before we build anything that depends on it.",
      },
      {
        title: "Intellectual property",
        body: "On receipt of full payment, ownership of the systems, configurations, automations and written materials produced specifically for you transfers to you. We keep ownership of our own pre-existing tools, templates, libraries and know-how, including anything we developed before this engagement or use across clients. You get a perpetual licence to those to the extent they are embedded in what we built for you, so nothing we retain can strand you.",
      },
      {
        title: "Your responsibilities",
        body: "We need timely access to the accounts, information and people the work depends on, and decisions when we ask for them. Where the work involves contacting your customers, you confirm you have a lawful basis to contact them and that any marketing consent you rely on is genuine. You remain the data controller for your customers' information; we act on your instructions.",
      },
      {
        title: "Confidentiality",
        body: "Each of us will keep the other's non-public business information confidential and use it only to perform this agreement. This survives the end of the engagement. It does not apply to information that is already public, or that either of us is legally required to disclose.",
      },
      {
        title: "Ending the agreement",
        body: "Either of us may end an ongoing arrangement by giving {noticeDays} days written notice. If either of us commits a material breach and does not fix it within 14 days of being told, the other may end this agreement immediately. On termination you pay for work completed up to that date, and we will hand over what you have paid for in a usable state rather than leaving you stranded.",
      },
      {
        title: "Warranty and limits",
        body: "We will carry out the work with reasonable skill and care. We do not warrant that any system will be uninterrupted or error free, and we are not responsible for failures of third party services outside our control. Neither of us is liable for loss of profit or indirect loss. Our total liability is limited to the fees you paid us in the twelve months before the claim. Nothing here limits liability for death or personal injury caused by negligence, for fraud, or for anything else that cannot lawfully be limited.",
      },
      {
        title: "Governing law",
        body: "This agreement is governed by the laws of Ireland, and the courts of Ireland have exclusive jurisdiction.",
      },
    ],

    /**
     * GDPR Article 28. Not boilerplate: our systems handle the client's
     * customers' names, phone numbers and enquiry contents, which makes
     * Fenwright a processor and these terms a legal requirement.
     */
    dataProtection: {
      title: "Data protection",
      intro:
        "Where our systems handle information about your customers, you are the data controller and we are your data processor. These terms are required by Article 28 of the GDPR and apply for as long as we process that information.",
      clauses: [
        {
          title: "What we process, and why",
          body: "Subject matter and purpose: operating the systems described in this agreement. Nature: receiving, storing, and replying to enquiries and bookings. Duration: for the length of this engagement. Categories of data: your customers' names, contact details, and the contents of their enquiries. Categories of data subject: your customers and prospective customers. We do not seek special category data, and our systems are not designed to hold it.",
        },
        {
          title: "Acting on your instructions",
          body: "We process your customers' data only on your documented instructions, including on transfers outside the EEA, unless we are required to do otherwise by law. If we think an instruction breaches data protection law, we will tell you.",
        },
        {
          title: "Confidentiality and security",
          body: "Everyone we allow to process this data is bound by confidentiality. We apply appropriate technical and organisational measures, including access control, encryption in transit, rate limiting on public endpoints, and least-privilege credentials on the services we operate.",
        },
        {
          title: "Sub-processors",
          body: "You give general authorisation for the sub-processors listed below. We will give you reasonable notice before adding or replacing one, and you may object on reasonable data protection grounds. Where a sub-processor is outside the EEA, transfers are made under the European Commission's Standard Contractual Clauses or another lawful transfer mechanism.",
        },
        {
          title: "Helping you meet your obligations",
          body: "We will assist you, so far as is reasonable, with responding to data subject requests, with security and breach notification, and with data protection impact assessments. We will notify you without undue delay after becoming aware of a personal data breach affecting your customers' data.",
        },
        {
          title: "Deletion and return",
          body: "At the end of the engagement we will, at your choice, return or delete your customers' data, except where we are required by law to keep it. Our standing retention period for lead records is {dataRetention} from collection.",
        },
        {
          title: "Audit",
          body: "We will make available the information reasonably needed to show we are meeting these obligations, and will allow and contribute to audits by you or an auditor you appoint, on reasonable notice and no more than once a year unless a breach or a regulator requires otherwise.",
        },
      ],
    },

    /** Standard payment terms in days. Overridable per invoice if needed. */
    paymentTermDays: 14,

    signatureNote:
      "By typing your full name below and clicking Agree, you confirm you have authority to enter this agreement on behalf of your business, and you accept these terms. This is an electronic signature. We record your name, the date and time, and the network address used, as evidence of acceptance.",
  },

  /** Default onboarding sequence. A client file may override this. */
  onboardingSteps: [
    {
      title: "Discovery call",
      body: "Thirty minutes with Billal on how your week actually runs. No pitch. We are looking for where time and money leak out, so we build the right thing rather than the obvious thing.",
    },
    {
      title: "Project brief",
      body: "We send back a short brief confirming the objective, what we are building, and how we will know it worked. You read it and correct anything we misheard before a line of it gets built.",
    },
    {
      title: "Build",
      body: "Ammar builds the systems around how you already work, not around how software wishes you worked. We check in as it comes together rather than disappearing for a fortnight.",
    },
    {
      title: "Handover",
      body: "You get a delivery guide: what each system does, where it lives, whose account it is on, and what to check each week. We walk you through it live, then you keep the document.",
    },
    {
      title: "Ongoing",
      body: "Where you are on a support arrangement, we watch the systems, fix what breaks, and send you a monthly report showing what actually happened to your enquiries.",
    },
  ],

  /**
   * Default package tiers. Prices are placeholders: zero renders as a bracketed
   * blank so an unpriced menu is obvious rather than accidentally quoting free.
   */
  packageTiers: [
    {
      name: "Starter",
      monthlyPrice: 0,
      suitedTo: "A business losing enquiries because nobody can get to the phone in time.",
      includes: [
        "Discovery session and written plan",
        "Reception system: missed calls and web enquiries answered straight away",
        "Booking link and confirmation messages",
        "Enquiries logged in one place",
        "Email support",
      ],
    },
    {
      name: "Growth",
      monthlyPrice: 0,
      suitedTo: "A business whose diary is filling but whose admin is now the bottleneck.",
      includes: [
        "Everything in Starter",
        "Reminder and follow-up sequences to cut no-shows",
        "Quote and invoice admin automated",
        "Monthly performance report",
        "Priority support and a standing monthly call",
      ],
      highlighted: true,
    },
    {
      name: "Premium",
      monthlyPrice: 0,
      suitedTo: "A business that wants the whole week to run itself, with someone watching it.",
      includes: [
        "Everything in Growth",
        "Inbound voice reception on your main line",
        "Multi-location or multi-practitioner routing",
        "Ongoing improvement work each month",
        "Direct access to Ammar and Billal",
      ],
    },
  ] as PackageTier[],

  /**
   * Bank and card details for the payment document. Left blank deliberately:
   * fill these in before sending a payment doc to anyone. PaymentDetails.tsx
   * renders a visible warning while any of them is empty rather than printing
   * a confident-looking invoice nobody can actually pay.
   */
  paymentDetails: {
    accountName: "",
    iban: "",
    bic: "",
    /** For UK clients paying in sterling. Leave blank if not applicable. */
    ukSortCode: "",
    ukAccountNumber: "",
    /** Stripe payment link, if you use one. */
    stripeLink: "",
    note: "Please use the payment reference shown above so we can match your transfer. We do not accept cash, and we will never email you asking you to change these bank details. If you receive a message like that, it is not from us: ring us first.",
  },

  feedback: {
    intro:
      "Your feedback matters, genuinely. This takes 2 minutes. Honest answers help us improve, and help future clients make an informed decision about working with us.",
    ratings: [
      { id: "satisfaction", label: "Overall satisfaction with this project" },
      { id: "communication", label: "Communication and responsiveness" },
      { id: "quality", label: "Quality of what we delivered" },
      { id: "management", label: "Turnaround time and project management" },
      { id: "value", label: "Value for money" },
    ],
    questions: [
      {
        id: "hesitation",
        label: "What was your biggest concern or hesitation before working with us?",
      },
      { id: "result", label: "What has actually changed in your week since we finished?" },
      { id: "improve", label: "What could we have done better?" },
    ],
    testimonialLabel:
      "If you are happy for us to quote you, write a line or two we could use, and add your name and role.",
  },
} as const;

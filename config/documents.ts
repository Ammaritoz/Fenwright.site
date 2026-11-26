/**
 * Standing document content: the parts that are the same for every client.
 *
 * Client-specific values live in content/clients/<slug>.ts. This file is the
 * Fenwright side of every document -- contract clauses, onboarding steps,
 * package tiers, bank details. Edit copy here, not in the components, the same
 * convention config/site.ts sets for the marketing pages.
 *
 * The service: Fenwright builds each product's ingredients list (SBOM), watches
 * for actively exploited vulnerabilities, checks whether each one affects the
 * product, and drafts the EU Cyber Resilience Act Article 14 reports. The
 * client approves every report and submits it. On Assured, where the client
 * reports through Ireland (CSIRT-IE), we can submit an approved report for them
 * as a Secondary Assigned Representative; never offer that for other countries. Never write
 * that we guarantee compliance, or anything else, until
 * those are true (see cra-action-plan.md, "Claims to avoid"). Seven-day cover
 * (evenings, weekends, public holidays) is Assured only (26 Nov 2026); Core is
 * working days. It stays a 12-hour draft target, never "24/7" or a guarantee.
 *
 * No em dashes in client-facing copy (matches config/site.ts).
 */

import type { LineItem, Money, PackageTier } from "@/content/clients/types";

export const documents = {
  /**
   * Sub-processors named in the Article 28 clauses. GDPR requires the client
   * to know who else touches personal data in what they send us, and where.
   * Keep this list honest: if a service is added, it belongs here first.
   */
  subProcessors: [
    { name: "Anthropic", purpose: "Helping analyse advisories against component lists, and drafting reports", location: "United States" },
    { name: "Vercel", purpose: "Hosting this portal and our reporting tools", location: "European Union" },
    { name: "Airtable", purpose: "Storing client contacts and the decision log", location: "United States" },
    { name: "Zoho Mail", purpose: "Email", location: "European Union" },
    { name: "Cal.com", purpose: "Booking and calendar scheduling", location: "United States" },
  ],

  agreement: {
    /**
     * Rendered above the signature block. Section bodies may contain {tokens}
     * that Agreement.tsx substitutes from the client's data, listed per clause.
     */
    intro:
      "This agreement sets out what we will do for you, what it costs, who is responsible for what under the Cyber Resilience Act, and how we each end the arrangement if it stops working. It is written to be read, not to be survived. If any part of it is unclear, ask us before you sign.",

    clauses: [
      {
        title: "Scope of work",
        body: "We will deliver the work described in the Scope section above, for the products listed in your service brief. Anything listed under Not included is outside this agreement. Adding products or versions is quoted and agreed separately in writing before it begins.",
      },
      {
        title: "Your reporting obligations stay yours",
        body: "Under the Cyber Resilience Act the duty to report actively exploited vulnerabilities and severe incidents rests with you, as the manufacturer, and cannot be transferred to us. We watch, check and draft. You decide whether to report and you approve every report. You submit it on ENISA's Single Reporting Platform unless you are on Assured and we have agreed in writing to submit for you, which we offer only where your coordinating CSIRT is Ireland's. In that case your employee remains your Primary Assigned Representative and invites a named person of ours as a Secondary Assigned Representative, and we submit only the version you have approved in writing. We submit on any day, including weekends and public holidays, but we cannot guarantee a submission by any deadline, so you must always be able to submit yourself. Submitting for you does not move your legal responsibility to us, and you can remove our access at any time. Otherwise, nothing in this agreement means we act as your representative before ENISA or any authority.",
      },
      {
        title: "Response times",
        body: "On Core, we check new matches against your products on working days (Monday to Friday, 09:00 to 18:00 Irish time, excluding Irish public holidays), and signals that arrive outside those hours are picked up at the start of the next working period. On Assured, we check every day of the year, including evenings, weekends and Irish public holidays. Where a match is likely to be reportable, we aim to put a reviewed assessment and, if needed, a draft early warning in your hands within the response time stated in your service brief. This is a target, not a guarantee. Tell us about anything you hear of directly, at any hour, so the clock starts with us as early as possible.",
      },
      {
        title: "What we rely on from you",
        body: "Our work is only as complete as what you give us. You will send us firmware images or build files for every product and version in scope, tell us promptly about new products, versions and component changes, and give us an hour or two with an engineer during onboarding. A product or version we have not been given is not one we are watching.",
      },
      {
        title: "Questions and rechecks",
        body: "You can message us about any finding or report draft in your portal, and ask us to recheck any decision we made on a finding. Both are included. We aim to reply to a message within one business day and to finish a recheck within two, and we record each recheck's outcome and our reasons in your decision log. Portal messages are not for urgent matters while a reporting deadline is running: call us instead. A full manual review of a firmware image, as opposed to rechecking a decision, is quoted separately.",
      },
      {
        title: "Fees and payment",
        body: "The fees and payment schedule are set out above. Invoices are payable within {paymentTermDays} days of the invoice date. Where an onboarding fee is stated, onboarding begins once it clears. We do not begin work on an unsigned agreement.",
      },
      {
        title: "Late payment",
        body: "If an undisputed invoice is more than 14 days overdue, monitoring pauses. We warn your contacts in writing at least 7 days before, with the date it stops, because a paused service means nobody is watching your products. While it is paused you remain responsible for your own CRA reporting, and it resumes within one business day of payment. We reserve our statutory right to interest and reasonable recovery costs on late commercial payments under the European Communities (Late Payment in Commercial Transactions) Regulations 2012. We would always rather ring you than invoke this.",
      },
      {
        title: "Your files and confidentiality",
        body: "Firmware, build files, component lists and anything else you send us are your confidential information. We store them encrypted, use them only to provide this service, and do not share them except with the sub-processors listed below where the work needs it. Each of us keeps the other's non-public information confidential, and this survives the end of the agreement. It does not apply to information that is already public, or that either of us is legally required to disclose.",
      },
      {
        title: "Ownership of the work",
        body: "Your ingredients lists, assessments, decision log and report drafts belong to you, and we provide them in open formats (CycloneDX or SPDX for component lists) so you can take them anywhere. We keep ownership of our own tools, methods and shared vulnerability analyses that we use across clients.",
      },
      {
        title: "Ending the agreement",
        body: "Either of us may end the agreement by giving {noticeDays} days written notice. If either of us commits a material breach and does not fix it within 14 days of being told, the other may end this agreement immediately. On termination you pay for work done up to that date. We then hand over your component lists and decision log in full, and return or delete your files as you choose, within 30 days.",
      },
      {
        title: "Warranty and limits",
        body: "We will carry out the work with reasonable skill and care. No vulnerability service can find every vulnerability, and we do not warrant that our monitoring is complete, that it will be uninterrupted, or that following our assessments makes your products compliant. We are not responsible for failures of third party data sources such as public vulnerability databases. We are not liable for fines or penalties imposed on you, for loss of profit, or for indirect loss. Our total liability is limited to the fees you paid us in the twelve months before the claim. Nothing here limits liability for death or personal injury caused by negligence, for fraud, or for anything else that cannot lawfully be limited.",
      },
      {
        title: "Governing law",
        body: "This agreement is governed by the laws of Ireland, and the courts of Ireland have exclusive jurisdiction.",
      },
    ],

    /**
     * GDPR Article 28. Firmware, build files and reporting contacts can
     * contain personal data, which makes Fenwright a processor for that data.
     */
    dataProtection: {
      title: "Data protection",
      intro:
        "What you send us is mainly technical, but it can contain personal data, such as the names and email addresses of your staff in firmware, build files or reporting contacts. For that data, you are the data controller and we are your data processor. These terms are required by Article 28 of the GDPR and apply for as long as we process it.",
      clauses: [
        {
          title: "What we process, and why",
          body: "Subject matter and purpose: providing the vulnerability monitoring, assessment and report drafting described in this agreement. Nature: storing and analysing files and records you send us. Duration: for the length of this engagement. Categories of data: names, work email addresses and phone numbers of your staff and contacts, and any personal data incidentally present in firmware or build files. Categories of data subject: your staff and contacts. We do not seek special category data.",
        },
        {
          title: "Acting on your instructions",
          body: "We process this data only on your documented instructions, including on transfers outside the EEA, unless we are required to do otherwise by law. If we think an instruction breaches data protection law, we will tell you.",
        },
        {
          title: "Confidentiality and security",
          body: "Everyone we allow to process this data is bound by confidentiality. We apply appropriate technical and organisational measures, including encryption at rest and in transit, access control, and least-privilege credentials on the services we use.",
        },
        {
          title: "Sub-processors",
          body: "You give general authorisation for the sub-processors listed below. We will give you reasonable notice before adding or replacing one, and you may object on reasonable data protection grounds. Where a sub-processor is outside the EEA, transfers are made under the European Commission's Standard Contractual Clauses or another lawful transfer mechanism.",
        },
        {
          title: "Helping you meet your obligations",
          body: "We will assist you, so far as is reasonable, with responding to data subject requests, with security and breach notification, and with data protection impact assessments. We will notify you without undue delay after becoming aware of a personal data breach affecting your data.",
        },
        {
          title: "Deletion and return",
          body: "At the end of the engagement we will, at your choice, return or delete your data, except where we are required by law to keep it. Our standing retention period for contact records is {dataRetention} after the engagement ends.",
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
      "By typing your full name below and clicking Agree, you confirm you have authority to enter this agreement on behalf of your company, and you accept these terms. This is an electronic signature. We record your name, the date and time, and the network address used, as evidence of acceptance.",
  },

  /** Default onboarding sequence. A client file may override this. */
  onboardingSteps: [
    {
      title: "Kick-off call",
      body: "An hour with Billal and the engineer who knows how your products are built. We agree the products and versions in scope, where each one's software comes from, and who at your end approves reports.",
    },
    {
      title: "Ingredients lists",
      body: "Ammar builds the software bill of materials for each product and version, from your build files where they exist and from the firmware image where they do not. You get them in CycloneDX or SPDX, so they are yours to keep.",
    },
    {
      title: "First pass",
      body: "We check every known vulnerability in those components against your shipped configurations, and send you the results with a written reason for each decision. This is usually the biggest piece of work, and it only happens once.",
    },
    {
      title: "Reporting setup",
      body: "We help you register on ENISA's Single Reporting Platform: choosing the coordinating CSIRT, registering your primary reporting person and a backup, and, if you report through Ireland and want us to submit for you, inviting us as a Secondary Assigned Representative. Then we agree a short playbook for who approves and submits a report.",
    },
    {
      title: "Practice run",
      body: "A timed exercise with a made-up exploited vulnerability, from the signal arriving to a finished draft in your hands. We measure it, and you see exactly how a real one would go.",
    },
    {
      title: "Monitoring live",
      body: "From here we watch every day, check each new match, and send you a monthly report of what we saw and decided. When something needs reporting, you get a draft to approve. You submit it, or on Assured we can, where we have agreed that in writing.",
    },
  ],

  /**
   * Default package menu: the first-client offer agreed 19 Nov 2026
   * (cra-action-plan.md, "First-client offer"). Founding Core is the one ask;
   * the Sprint is the fallback. Founding Assured (26 Nov 2026) adds seven-day
   * cover and submitting for Irish-reporting clients; list price EUR 1,900.
   * Keep prices in step with config/plans.ts (a test checks it). A zero price
   * renders as a bracketed blank, never as free.
   * Keep these in step with the Services Agreement draft.
   */
  packageTiers: [
    {
      name: "Readiness Sprint",
      price: 200000,
      per: "one-off",
      suitedTo: "A fixed-price project of about 2 to 3 days that gets you ready to report. No ongoing commitment, and the fee is credited against Core if you continue.",
      includes: [
        "Ingredients list (SBOM) for every firmware version in scope",
        "Every known vulnerability checked, with a written reason",
        "Your Article 14 playbook: who is alerted, who approves, who submits",
        "Help setting up your ENISA reporting account",
        "A timed practice run ending in a finished early-warning draft",
        "A starter evidence pack for your technical file",
      ],
    },
    {
      name: "Founding Core",
      price: 75000,
      per: "month",
      badge: "Founding price",
      suitedTo: "The full monthly service at a launch price for our first three clients. 12 months, billed monthly or quarterly, with a 90-day exit.",
      includes: [
        "Ingredients lists kept up to date for each release",
        "Exploited-vulnerability lists checked every hour",
        "Every match checked on working days, with a written reason",
        "Every Article 14 report drafted: 24-hour, 72-hour and final",
        "Customer advisory drafts",
        "Timestamped decision log and a monthly report",
        "Onboarding included (normally a separate fee)",
      ],
      highlighted: true,
    },
    {
      name: "Founding Assured",
      price: 140000,
      per: "month",
      badge: "Founding price",
      suitedTo: "For makers who want cover when a deadline lands on a weekend. Launch price for our first three clients (normally €1,900 a month), on the same terms as Founding Core.",
      includes: [
        "Everything in Core",
        "Evenings, weekends and public holidays covered, with a 12-hour draft target",
        "If you report through Ireland, we submit each report once you approve it",
        "Chasing your suppliers for their component lists",
        "Answering your customers' CRA questionnaires",
      ],
    },
  ] as PackageTier[],

  packagesSmallPrint:
    "Founding Core and Founding Assured run for 12 months at the founding price, billed monthly or quarterly in advance (your choice, paid automatically by card or direct debit), and you can leave within the first 90 days of monitoring. Monitoring and its fee start only once your onboarding is finished and we confirm the start date in writing. The Sprint is a one-off fixed price, credited against Core if you continue within 90 days. Your ingredients lists and decision log are yours, in open formats, and we hand them over in full if we ever part ways. Extra product families are quoted separately, at a lower price than the first.",

  /**
   * Ready-made invoice lines for the first-client offer. Copy into a client
   * file's invoice `lines`. Amounts are minor units (cents). Not VAT
   * registered, so no VAT is added (see components/portal/docs/Invoice.tsx).
   *
   *   Sprint:        [invoiceLines.sprint]
   *   Core quarter:  [invoiceLines.coreQuarter("January to March 2027")]
   *   Core quarter after a Sprint, with the credit (Services Agreement 4.4):
   *                  [invoiceLines.coreQuarter("..."), invoiceLines.sprintCredit(200000)]
   *   The credit line can't exceed the quarter: carry any remainder to the
   *   next quarter's invoice.
   */
  invoiceLines: {
    sprint: {
      kind: "Sprint",
      description: "Readiness Sprint: SBOMs, triage, Article 14 playbook, ENISA account setup, practice run and evidence pack (fixed price)",
      quantity: 1,
      unitPrice: 200000,
    } as LineItem,
    coreQuarter: (period: string): LineItem => ({
      kind: "Core",
      description: `Founding Core, ${period} (founding price, 3 months)`,
      quantity: 3,
      unitPrice: 75000,
    }),
    sprintCredit: (amount: Money): LineItem => ({
      kind: "Credit",
      description: "Readiness Sprint fee credited against Core",
      quantity: 1,
      unitPrice: -Math.abs(amount),
    }),
  },

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
      "Your feedback matters, genuinely. This takes 2 minutes. Honest answers help us improve, and help other manufacturers make an informed decision about working with us.",
    ratings: [
      { id: "satisfaction", label: "Overall satisfaction with the service" },
      { id: "communication", label: "Communication and responsiveness" },
      { id: "quality", label: "Quality of our assessments and drafts" },
      { id: "management", label: "Speed from signal to assessment" },
      { id: "value", label: "Value for money" },
    ],
    questions: [
      {
        id: "hesitation",
        label: "What was your biggest concern or hesitation before working with us?",
      },
      { id: "result", label: "What has changed in how you handle vulnerabilities since we started?" },
      { id: "improve", label: "What could we have done better?" },
    ],
    testimonialLabel:
      "If you are happy for us to quote you, write a line or two we could use, and add your name and role.",
  },
} as const;

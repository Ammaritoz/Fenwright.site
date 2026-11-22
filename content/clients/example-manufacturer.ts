import type { Client } from "./types";
import { documents } from "@/config/documents";

/**
 * Worked example so every document renders on day one.
 *
 * Lowmoor Controls is a fictional maker of connected building controls, so
 * nothing in this file is real business data. Fees are illustrative only and
 * are not Fenwright's prices.
 *
 * Staged as a pilot client who has just signed: agreement, welcome pack,
 * brief, payment details and the onboarding invoice are live, and the
 * documents that belong to later in the engagement are marked `upcoming` so
 * the client can see what is coming without being able to open a report for
 * work that has not happened yet. Flip each to `status: "live"` (or drop the
 * field) as you reach that point. Upcoming documents still render at their
 * direct URL, so you can proofread them first.
 *
 * Portal:   /portal/lowmoor-controls-222d0f7e
 * Passcode: 9XCR5-SY2D2
 */
export const exampleManufacturer: Client = {
  slug: "lowmoor-controls-222d0f7e",
  currency: "EUR",
  passcodeSalt: "a4756d609d1821b7982ad5578602106f",
  passcodeHash: "0d01733f11afcc0bd6008630e280cdb6bb23237d2d6d7d5d20312677a5ec642d",
  // On so the owner can walk the client payment flow on the live site (22 Nov
  // 2026). The production Stripe key is LIVE: paying here charges a real card
  // the full invoice amount. Refund it from the Stripe dashboard, and set this
  // back to false before showing the demo to anyone else.
  onlinePayment: true,

  business: {
    name: "Lowmoor Controls",
    contact: {
      name: "Declan Farrell",
      role: "Head of Engineering",
      email: "declan@example.com",
      phone: "+353 1 555 0142",
    },
    address: "Unit 4, Example Business Park, Athlone, N37 XY12",
  },

  docs: [
    // ---- 1. Client agreement -------------------------------------------
    {
      slug: "agreement",
      title: "Client agreement",
      blurb: "What we do, what it costs, who is responsible for what, and how we each end it.",
      payload: {
        type: "agreement",
        solicitorReviewed: false,
        scope: [
          "A software bill of materials (SBOM) for each product and firmware version listed in the service brief, in CycloneDX format.",
          "A first pass: every known vulnerability in those components checked against your shipped configuration, with a written reason for each decision.",
          "Daily monitoring of CISA KEV, the EU Vulnerability Database and NVD, matched against your components.",
          "Working-day checks of each new match, recorded in a timestamped decision log.",
          "Drafts of every Article 14 report (24-hour early warning, 72-hour notification, final report) and the matching customer advisory, if anything is reportable.",
          "Help registering on ENISA's Single Reporting Platform, a short reporting playbook, and one timed practice run.",
          "A monthly report of what we watched, what matched and what we decided.",
        ],
        exclusions: [
          "Submitting reports to ENISA or any authority. You approve and submit every report.",
          "Evening and weekend cover. Signals outside working hours are checked at the start of the next working period.",
          "Fixing vulnerabilities, writing patches or changing your firmware.",
          "Security testing or penetration testing of your products.",
          "Legal advice, and any guarantee that your products comply with the Cyber Resilience Act.",
          "Products and versions not listed in the service brief.",
        ],
        totalFee: 300000,
        schedule: [
          {
            label: "Onboarding",
            amount: 150000,
            due: "On signature",
            note: "Covers the ingredients lists, first pass, reporting setup and practice run.",
          },
          {
            label: "Pilot, month 1",
            amount: 50000,
            due: "On monitoring going live",
          },
          {
            label: "Pilot, month 2",
            amount: 50000,
            due: "One month later",
          },
          {
            label: "Pilot, month 3",
            amount: 50000,
            due: "Two months later",
            note: "At the end of the pilot we review it against the success criteria in the brief.",
          },
        ],
        noticeDays: 30,
        passThroughServices: [],
      },
    },

    // ---- 2. Welcome doc -------------------------------------------------
    {
      slug: "welcome",
      title: "Welcome pack",
      blurb: "How onboarding runs, and what we need from you.",
      payload: {
        type: "welcome",
        projectName: "CRA vulnerability response pilot",
        startDate: "2027-01-11",
        targetDelivery: "2027-01-29",
        pointOfContact: "Billal Khan",
      },
    },

    // ---- 3. Service brief -----------------------------------------------
    {
      slug: "brief",
      title: "Service brief",
      blurb: "The products we watch and how we will judge the pilot. Read it, correct it.",
      payload: {
        type: "brief",
        projectTitle: "CRA vulnerability response pilot",
        deadline: "2027-01-29",
        objective:
          "Make sure that when a vulnerability in one of Lowmoor's controllers is actively exploited, Declan's team knows within hours and has a finished early-warning draft to approve, well inside the 24-hour window, without hiring a security engineer.",
        products: [
          {
            name: "LC-40 room controller",
            versions: "2.1 to 2.6 (all versions still sold)",
            source: "Yocto build files",
          },
          {
            name: "LC-GW building gateway",
            versions: "1.8 and 1.9",
            source: "Firmware image only (2019 build, original developer has left)",
          },
        ],
        successCriteria: [
          "An ingredients list for every product and version above, delivered by the go-live date.",
          "Every new match on an exploited-vulnerability list assessed within 8 working hours, with a written reason.",
          "A complete early-warning draft in Declan's hands within 12 hours of a confirmed match during working hours.",
          "The practice run completed and timed, with the result written up.",
          "A monthly report Declan can forward to the managing director without editing.",
        ],
        responsibilities: {
          fenwright: [
            "Build and update the ingredients lists",
            "Watch the vulnerability feeds every day",
            "Check each match and record the decision",
            "Draft reports and customer advisories",
          ],
          client: [
            "Send firmware and build files for every version in scope",
            "Tell us about new releases and component changes",
            "Approve every report, and submit it on ENISA's platform",
            "Name a backup approver for when Declan is away",
          ],
        },
        constraints: [
          "Firmware and build files stay in the EU and are stored encrypted.",
          "Nothing is sent to ENISA, customers or anyone else without Lowmoor's approval.",
        ],
      },
    },

    // ---- 4. Payment details ---------------------------------------------
    {
      slug: "payment",
      title: "Payment details",
      blurb: "How to pay us, and the reference to use so it gets matched.",
      payload: {
        type: "payment",
        reference: "LOWMOOR-01",
      },
    },

    // ---- 5. Invoice -----------------------------------------------------
    {
      slug: "invoice-001",
      title: "Invoice INV-002",
      blurb: "Readiness Sprint invoice.",
      payload: {
        type: "invoice",
        // Renumbered from INV-001 on 22 Nov 2026 to reset the demo to unpaid: a
        // Stripe test payment is recorded against INV-001. Bump it again to reset.
        number: "INV-002",
        issued: "2027-01-11",
        due: "2027-01-25",
        projectReference: "CRA Readiness Sprint",
        lines: [documents.invoiceLines.sprint],
      },
    },

    // ---- 6. Onboarding guide --------------------------------------------
    {
      slug: "delivery",
      title: "Onboarding guide",
      blurb: "What we set up, where it lives, and who does what when something turns up.",
      status: "upcoming",
      expected: "When monitoring goes live",
      payload: {
        type: "delivery",
        deliveredOn: "2027-01-29",
        systems: [
          {
            name: "Ingredients lists",
            whatItDoes:
              "One SBOM per product and version, in CycloneDX. 412 components across both products.",
            platform: "This portal",
            accountOwner: "Client",
          },
          {
            name: "Monitoring",
            whatItDoes:
              "Checks CISA KEV, the EU Vulnerability Database and NVD every hour and matches new entries against your components.",
            platform: "Fenwright",
            accountOwner: "Fenwright",
          },
          {
            name: "Decision log",
            whatItDoes:
              "Every match, who checked it, when, and why it was or was not reportable. Exported to you each quarter.",
            platform: "Fenwright",
            accountOwner: "Fenwright",
          },
          {
            name: "ENISA reporting account",
            whatItDoes:
              "Your organisation on the Single Reporting Platform, with Declan as primary reporter and Aoife Byrne as backup.",
            platform: "ENISA SRP",
            accountOwner: "Client",
          },
        ],
        runbook: [
          {
            title: "When we send you a draft",
            body: "You get an email and a text. Read the assessment first: it says what is affected and why we think it is reportable. If you agree, copy each field into the Single Reporting Platform and submit. Then reply to tell us it is done, so we can log the time.",
          },
          {
            title: "When you disagree with an assessment",
            body: "Ring us. The decision is yours, and we will record your reasoning in the log alongside ours. A disagreement written down is better evidence than an agreement that is not.",
          },
          {
            title: "When you ship a new version",
            body: "Send us the firmware image or build files before release if you can, and on release day at the latest. Until we have it, that version is not being watched.",
          },
          {
            title: "When someone reports a problem to you directly",
            body: "Forward it to us straight away, whoever it came from. Awareness can start with an email from a researcher or a customer, and the 24 hours run from then.",
          },
        ],
        clientActions: [
          "Keep Declan and Aoife's EU Login accounts active, with multi-factor authentication working.",
          "Tell us before you add a product, a version or a major component.",
          "Update the backup approver if Aoife leaves or changes role.",
        ],
        supportNote:
          "Checks run on working days, Monday to Friday, 09:00 to 18:00 Irish time. Anything that arrives outside those hours is picked up at the start of the next working period.",
      },
    },

    // ---- 7. Monthly report ----------------------------------------------
    {
      slug: "report-2027-02",
      title: "Monthly report, February 2027",
      blurb: "What we watched, what matched, and what we decided last month.",
      status: "upcoming",
      expected: "Start of each month",
      payload: {
        type: "report",
        period: "2027-02",
        summary:
          "A quiet month, which is the usual kind. Fourteen new vulnerabilities matched components in your products. Twelve were checked and closed as not affecting what you ship, mostly because the vulnerable feature is switched off in your builds. Two affect the LC-GW gateway but are not being exploited, so they need fixing but not reporting. Nothing met the Article 14 threshold.",
        metrics: {
          componentsMonitored: 412,
          vulnerabilitiesMatched: 14,
          assessedNotAffected: 12,
          assessedAffected: 2,
          reportableEvents: 0,
          medianHoursToAssessment: 3.5,
        },
        actionsTaken: [
          "Assessed all 14 matches and recorded a written decision for each in your log.",
          "Flagged two OpenSSL issues in LC-GW 1.8 for your next firmware release, with the fixed version to move to.",
          "Updated the LC-40 ingredients list for the 2.6.1 release.",
        ],
        nextMonth: [
          "Send the first quarterly evidence pack for your technical file.",
          "Review the pilot against the success criteria in the brief.",
        ],
      },
    },

    // ---- 8. Thank you ---------------------------------------------------
    {
      slug: "thank-you",
      title: "Pilot review",
      blurb: "How the pilot went against what we agreed, and what comes next.",
      status: "upcoming",
      expected: "End of the pilot",
      payload: {
        type: "thank-you",
        projectName: "CRA vulnerability response pilot",
        startDate: "2027-01-11",
        completedDate: "2027-04-30",
        note: "Thank you for trusting us with this. The thing that made the pilot work was Declan giving us an honest hour on how the LC-GW firmware was actually built, including the parts nobody had documented since 2019. That is why its ingredients list is complete, and why our checks on it hold up.",
        whatNext: [
          "Decide whether to move onto Core from May. Nothing changes day to day if you do.",
          "Think about which product family to add next. The second one costs less than the first.",
          "Keep forwarding anything you hear about directly. That habit matters more than any tool.",
        ],
      },
    },

    // ---- 9. Feedback ----------------------------------------------------
    {
      slug: "feedback",
      title: "Feedback",
      blurb: "Two minutes, and it genuinely helps us get better.",
      status: "upcoming",
      expected: "End of the pilot",
      payload: {
        type: "feedback",
        projectName: "CRA vulnerability response pilot",
      },
    },

    // ---- 10. Package menu -----------------------------------------------
    {
      slug: "packages",
      title: "Services and packages",
      blurb: "What each level of service includes.",
      payload: {
        type: "packages",
      },
    },
  ],
};

import type { Client } from "./types";

/**
 * Worked example so every document renders on day one.
 *
 * Bright Smile Dental is a fictional clinic, so nothing in this file is real
 * business data.
 *
 * Staged as a client who has just signed: agreement, welcome pack, brief,
 * payment details and the deposit invoice are live, and the documents that
 * belong to later in the engagement are marked `upcoming` so the client can
 * see what is coming without being able to open a report for work that has not
 * happened yet. Flip each to `status: "live"` (or drop the field) as you reach
 * that point. Upcoming documents still render at their direct URL, so you can
 * proofread them first.
 *
 * Portal:   /portal/bright-smile-dental-0923ca36
 * Passcode: DCUPN-VMK8D
 */
export const exampleClinic: Client = {
  slug: "bright-smile-dental-0923ca36",
  currency: "EUR",
  passcodeSalt: "977168e59bf35db473655c5a5f31f141",
  passcodeHash: "e2505d12dd8ea7454c5c5d9e2b2a4828c1f9b69aaa6d2cd90a108a5820a8c457",

  business: {
    name: "Bright Smile Dental",
    contact: {
      name: "Ciara Nolan",
      role: "Practice Manager",
      email: "ciara@example.com",
      phone: "+353 1 555 0198",
    },
    address: "12 Example Street, Dublin 2, D02 XY45",
  },

  docs: [
    // ---- 1. Client agreement -------------------------------------------
    {
      slug: "agreement",
      title: "Client Agreement",
      blurb: "What we are building, what it costs, and how we each end it.",
      payload: {
        type: "agreement",
        solicitorReviewed: false,
        scope: [
          "Discovery session and written plan covering enquiry handling across phone, web form and Instagram.",
          "Reception system: missed calls and web enquiries receive a warm reply within sixty seconds, day and night.",
          "Booking flow connected to your existing practice diary, with confirmation and reminder messages.",
          "Every enquiry, reply and booking logged to a single record you can read without our help.",
          "Live handover session plus a written delivery guide.",
        ],
        exclusions: [
          "Changes to your practice management software or patient records system.",
          "Writing or running paid advertising campaigns.",
          "Clinical or regulatory advice of any kind.",
          "Answering enquiries by hand on your behalf.",
        ],
        totalFee: 340000,
        schedule: [
          {
            label: "Deposit",
            amount: 170000,
            due: "On signature",
            note: "Non-refundable. Secures your build slot and starts the work.",
          },
          {
            label: "Balance",
            amount: 170000,
            due: "On handover",
            note: "Payable within 14 days of the handover session.",
          },
        ],
        noticeDays: 30,
        passThroughServices: [
          "Telnyx, for the phone number and text messages",
          "Cal.com, for booking and calendar sync",
          "Airtable, for the enquiry records",
        ],
      },
    },

    // ---- 2. Welcome doc -------------------------------------------------
    {
      slug: "welcome",
      title: "Welcome Pack",
      blurb: "Everything you need to know about how the next few weeks run.",
      payload: {
        type: "welcome",
        projectName: "Reception and booking system",
        startDate: "2026-08-24",
        targetDelivery: "2026-09-18",
        pointOfContact: "Billal Khan",
      },
    },

    // ---- 3. Project brief -----------------------------------------------
    {
      slug: "brief",
      title: "Project Brief",
      blurb: "The scope agreed before any building started. Read it, correct it.",
      payload: {
        type: "brief",
        projectTitle: "Reception and booking system",
        deadline: "2026-09-18",
        objective:
          "Stop losing check-up and hygiene enquiries to whoever answers first. Every enquiry gets a warm, accurate reply inside a minute, and books itself into the diary wherever possible, without adding a job to the front desk.",
        audience: {
          who: "Adults aged 25 to 55 within a fifteen minute drive of the practice, most of them enquiring from a phone, most of them outside working hours.",
          painPoint:
            "They ring or message during a gap in their own day, get no answer, and book with whichever clinic replies first.",
          cares:
            "Speed, a clear price, and knowing a real person is on the other end. Not brand, not awards.",
        },
        keyMessage:
          "You are not waiting until Monday. We have seen your enquiry and here is when we can see you.",
        successCriteria: [
          "Median first reply under two minutes, measured across all channels.",
          "At least 80 percent of enquiries answered without front desk involvement.",
          "No-shows down by a quarter within two months of the reminder flow going live.",
          "Ciara can read the month's enquiries in one place without asking us.",
        ],
        constraints: [
          "Cannot touch the existing patient records system.",
          "No clinical advice or pricing commitments in automated replies.",
          "The practice diary stays the single source of truth for appointments.",
        ],
      },
    },

    // ---- 4. Payment details ---------------------------------------------
    {
      slug: "payment",
      title: "Payment Details",
      blurb: "How to pay us, and the reference to use so it gets matched.",
      payload: {
        type: "payment",
        reference: "BRIGHTSMILE-01",
      },
    },

    // ---- 5. Invoice -----------------------------------------------------
    {
      slug: "invoice-001",
      title: "Invoice INV-001",
      blurb: "Deposit invoice for the reception and booking build.",
      payload: {
        type: "invoice",
        number: "INV-001",
        issued: "2026-08-24",
        due: "2026-09-07",
        projectReference: "Reception and booking system",
        lines: [
          {
            kind: "Discovery",
            description: "Discovery session, enquiry audit and written plan",
            quantity: 1,
            unitPrice: 60000,
          },
          {
            kind: "Build",
            description: "Reception system across phone, web form and Instagram",
            quantity: 1,
            unitPrice: 180000,
          },
          {
            kind: "Build",
            description: "Booking flow, confirmations and reminder sequence",
            quantity: 1,
            unitPrice: 80000,
          },
          {
            kind: "Handover",
            description: "Live handover session and written delivery guide",
            quantity: 1,
            unitPrice: 20000,
          },
        ],
        amountPaid: 170000,
      },
    },

    // ---- 6. Delivery guide ----------------------------------------------
    {
      slug: "delivery",
      title: "Delivery Guide",
      blurb: "What we built, where it lives, and what to check each week.",
      status: "upcoming",
      expected: "On handover",
      payload: {
        type: "delivery",
        deliveredOn: "2026-09-18",
        systems: [
          {
            name: "Reception line",
            whatItDoes:
              "Answers missed calls with a text within sixty seconds, asks what the caller needs, and passes anything urgent straight to the practice phone.",
            platform: "Telnyx",
            accountOwner: "Client",
          },
          {
            name: "Web and Instagram enquiries",
            whatItDoes:
              "Watches the website form and Instagram inbox, replies with availability, and books where the enquiry is straightforward.",
            platform: "Fenwright systems",
            accountOwner: "Fenwright",
          },
          {
            name: "Booking and reminders",
            whatItDoes:
              "Holds the slot, sends a confirmation immediately, then a reminder 48 hours and 2 hours before the appointment.",
            platform: "Cal.com",
            accountOwner: "Client",
            url: "https://cal.com",
          },
          {
            name: "Enquiry record",
            whatItDoes:
              "Every enquiry, reply, booking and no-show in one table you can filter and export.",
            platform: "Airtable",
            accountOwner: "Client",
          },
        ],
        runbook: [
          {
            title: "Checking the week's enquiries",
            body: "Open the Airtable base, choose the This Week view. Anything in the Needs a human column is waiting on you. Everything else has been handled.",
          },
          {
            title: "When someone needs a real answer",
            body: "The system never guesses at prices or clinical questions. Those land in Needs a human with the full conversation attached, so you can reply from the same thread.",
          },
          {
            title: "Changing your opening hours",
            body: "Update them in Cal.com and the reception replies follow automatically. Do not edit the reply text yourself, tell us and we will change it properly.",
          },
          {
            title: "If something looks wrong",
            body: "Ring or text Ammar on the number in your welcome pack. Do not switch anything off. Most issues are a third party service having a bad ten minutes, and turning things off makes it harder to see what happened.",
          },
        ],
        clientActions: [
          "Keep a card on the Telnyx and Cal.com accounts. If they lapse, enquiries stop being answered.",
          "Add Ciara's replacement to the Airtable base if the front desk changes hands.",
          "Tell us before you change your opening hours, phone number or website form.",
        ],
        supportNote:
          "You are on the Growth arrangement, so we watch these systems and fix what breaks. You do not need to monitor anything yourself.",
      },
    },

    // ---- 7. Monthly report ----------------------------------------------
    {
      slug: "report-2026-10",
      title: "Monthly Report, October 2026",
      blurb: "What actually happened to your enquiries last month.",
      status: "upcoming",
      expected: "Start of each month",
      payload: {
        type: "report",
        period: "2026-10",
        summary:
          "A strong month. Enquiries were up on September and the system answered 94 percent of them without the front desk. The number worth watching is median response time, now under two minutes against the forty hours typical of clinics. No-shows fell again after the 2 hour reminder went live at the start of the month.",
        metrics: {
          enquiriesReceived: 214,
          enquiriesAnswered: 201,
          medianResponseMinutes: 2,
          bookingsMade: 138,
          noShows: 9,
          previous: {
            enquiriesReceived: 186,
            enquiriesAnswered: 168,
            medianResponseMinutes: 4,
            bookingsMade: 112,
            noShows: 14,
          },
        },
        actionsTaken: [
          "Added a 2 hour reminder to the appointment flow, on top of the existing 48 hour one.",
          "Reworded the hygiene enquiry reply after four people asked the same follow-up question about appointment length.",
          "Routed out-of-hours emergency wording to the practice mobile rather than the answering text.",
        ],
        nextMonth: [
          "Test a Saturday morning availability message, since 22 percent of enquiries arrive at the weekend.",
          "Add a short follow-up for enquiries that go quiet after the first reply.",
        ],
      },
    },

    // ---- 8. Thank you ---------------------------------------------------
    {
      slug: "thank-you",
      title: "Thank You",
      blurb: "The project is complete. Here is where things stand.",
      status: "upcoming",
      expected: "When we finish",
      payload: {
        type: "thank-you",
        projectName: "Reception and booking system",
        startDate: "2026-08-24",
        completedDate: "2026-09-18",
        note: "Thank you for trusting us with the front door of your practice. The thing that made this build work was Ciara being straight with us about what the front desk actually does at 4pm on a Friday, rather than what the process document says. The system is shaped around that, which is why it is holding up.",
        whatNext: [
          "Give it a fortnight before judging the numbers. The first week always looks odd while the reminders catch up with appointments booked before go-live.",
          "Read the Airtable This Week view each Monday. Five minutes, and you will know more about your enquiry flow than most practices know in a year.",
          "Your first monthly report lands at the start of next month.",
        ],
      },
    },

    // ---- 9. Feedback ----------------------------------------------------
    {
      slug: "feedback",
      title: "Feedback",
      blurb: "Two minutes, and it genuinely helps us get better.",
      status: "upcoming",
      expected: "When we finish",
      payload: {
        type: "feedback",
        projectName: "Reception and booking system",
      },
    },

    // ---- 10. Package menu -----------------------------------------------
    {
      slug: "packages",
      title: "Services and Packages",
      blurb: "What ongoing support looks like, and what each level includes.",
      payload: {
        type: "packages",
      },
    },
  ],
};

import type { Metadata } from "next";
import Link from "next/link";
import { Nav } from "@/components/Nav";
import { Footer } from "@/components/Footer";

const title = "ENISA's Single Reporting Platform: a plain-English guide for device makers";
const description =
  "How the CRA Single Reporting Platform works: Primary and Secondary Assigned Representatives, who can submit, CSIRT validation, the 24-hour, 72-hour and final reports, and what to set up before you need it.";

export const metadata: Metadata = {
  title,
  description,
  alternates: { canonical: "/guides/enisa-single-reporting-platform" },
  robots: { index: true, follow: true },
  openGraph: { title, description, type: "article" },
};

// Facts checked against ENISA's SRP pages and FAQ (FAQ updated 17 Nov 2026),
// BSI's SRP page, and Ireland's NCSC (written answer, Nov 2026).
// Re-check when ENISA updates the platform; keep claims in line with
// cra-action-plan.md ("claims never to make").
const LAST_REVIEWED = "26 November 2026";

const sources = [
  {
    label: "ENISA: Single Reporting Platform",
    href: "https://www.enisa.europa.eu/topics/product-security/vulnerability-services/eu-incident-response-and-cyber-crisis-management/single-reporting-platform-srp",
  },
  {
    label: "ENISA: SRP frequently asked questions",
    href: "https://www.enisa.europa.eu/topics/product-security/vulnerability-services/eu-incident-response-and-cyber-crisis-management/single-reporting-platform-srp/frequently-asked-questions",
  },
  {
    label: "ENISA: Assigned Representative registration",
    href: "https://www.enisa.europa.eu/topics/product-security/single-reporting-platform-srp/cra-srp-guidance-ar-user-registration",
  },
  {
    label: "BSI (Germany): CRA Single Reporting Platform",
    href: "https://www.bsi.bund.de/EN/Themen/Unternehmen-und-Organisationen/Informationen-und-Empfehlungen/Cyber_Resilience_Act/Single_Reporting_Platform-CRA/single_reporting_platform-cra.html",
  },
  { label: "NCSC Ireland: EU Cyber Resilience Act", href: "https://ncsc.gov.ie/cra/" },
  {
    label: "Regulation (EU) 2024/2847 (the Cyber Resilience Act), Article 14",
    href: "https://eur-lex.europa.eu/eli/reg/2024/2847/oj",
  },
];

function H2({ children }: { children: React.ReactNode }) {
  return <h2 className="mt-12 font-display text-2xl font-bold text-ink">{children}</h2>;
}

function P({ children }: { children: React.ReactNode }) {
  return <p className="mt-4 text-[0.98rem] leading-relaxed text-stone-600">{children}</p>;
}

function UL({ children }: { children: React.ReactNode }) {
  return (
    <ul className="mt-4 list-disc space-y-2 pl-5 text-[0.98rem] leading-relaxed text-stone-600">
      {children}
    </ul>
  );
}

const articleJsonLd = {
  "@context": "https://schema.org",
  "@type": "Article",
  headline: title,
  description,
  dateModified: "2026-11-26",
  author: { "@type": "Organization", name: "Fenwright" },
  publisher: { "@type": "Organization", name: "Fenwright" },
  mainEntityOfPage: "https://www.fenwright.ie/guides/enisa-single-reporting-platform",
};

export default function EnisaSrpGuidePage() {
  return (
    <>
      <Nav />
      <main id="main">
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(articleJsonLd) }}
        />
        <article className="section pt-32 pb-24 sm:pt-40">
          <div className="container-px">
            <div className="mx-auto max-w-3xl">
              <Link
                href="/"
                className="text-sm font-semibold text-accent-700 underline-offset-4 hover:underline"
              >
                &larr; Back to home
              </Link>

              <p className="mt-6 text-sm font-semibold uppercase tracking-wide text-accent-700">
                Guide &middot; Cyber Resilience Act
              </p>
              <h1 className="mt-3 font-display text-[2.4rem] font-bold leading-[1.05] text-ink sm:text-[3rem]">
                ENISA&rsquo;s Single Reporting Platform, in plain English
              </h1>
              <p className="mt-4 text-sm text-stone-500">Last reviewed {LAST_REVIEWED}</p>

              <P>
                Since 11 September 2026, every manufacturer of a connected product sold in the
                EU has to report actively exploited vulnerabilities and severe security
                incidents under Article 14 of the Cyber Resilience Act. That applies to products
                already on the market, not only new ones. Every one of those reports goes
                through a single website: ENISA&rsquo;s Single Reporting Platform (SRP). This
                guide covers how it works, who can use it for you, and what to set up before the
                first 24-hour clock starts.
              </P>

              <H2>What the platform is</H2>
              <P>
                The SRP is run by ENISA, the EU&rsquo;s cybersecurity agency, and it is the one
                place CRA reports go. When you submit, the report reaches the CSIRT designated as
                coordinator in your country (the national computer security incident response
                team) and ENISA at the same time. There is no API: reports are typed into web
                forms by a named person, logged in with a personal EU Login account that has
                multi-factor authentication.
              </P>
              <P>
                The CRA lets member states and ENISA add their own national entry points later,
                but today the SRP is the route everywhere.
              </P>

              <H2>The deadlines it is built around</H2>
              <UL>
                <li>
                  <strong className="text-ink">24 hours</strong> from becoming aware: an early
                  warning, including which EU countries the product is sold in.
                </li>
                <li>
                  <strong className="text-ink">72 hours</strong>: the full notification, with what
                  you know about the flaw, the fix or workaround, and how sensitive the
                  information is.
                </li>
                <li>
                  <strong className="text-ink">Final report</strong>: for an exploited
                  vulnerability, within 14 days of a fix or mitigation being available; for a
                  severe incident, within a month of the 72-hour notification.
                </li>
              </UL>
              <P>
                The clock runs from when you become aware, and it doesn&rsquo;t stop for
                weekends. A Friday-evening alert means a Saturday-evening early warning.
              </P>

              <H2>Assigned Representatives: who can use it for you</H2>
              <P>
                Each manufacturer on the platform has people called Assigned Representatives
                (ARs). This is a login role on the platform. It is not the same thing as the
                &ldquo;authorised representative&rdquo; a non-EU manufacturer appoints under
                Article 18 of the CRA, and the two are easy to confuse.
              </P>
              <UL>
                <li>
                  <strong className="text-ink">One Primary AR</strong> per manufacturer. They
                  register the company, name its coordinating CSIRT, and manage who else has
                  access.
                </li>
                <li>
                  <strong className="text-ink">Up to 20 Secondary ARs.</strong> The Primary AR
                  invites them once the Primary&rsquo;s own link to the company has been verified.
                  Invitations expire after 7 days.
                </li>
                <li>
                  <strong className="text-ink">Both roles can submit.</strong> ENISA&rsquo;s FAQ and
                  Germany&rsquo;s BSI both say Primary and Secondary ARs can submit and update
                  notifications for the manufacturer. Secondary ARs have fewer administrative
                  rights.
                </li>
                <li>
                  <strong className="text-ink">The role isn&rsquo;t tied to a job title.</strong>{" "}
                  BSI says the same personal requirements apply to both roles, and the person
                  should be able to make a technical assessment.
                </li>
                <li>
                  <strong className="text-ink">Drafts are private.</strong> A saved draft is
                  visible only to the person who created it until it is submitted. If several
                  people need to review a report, do it outside the platform.
                </li>
              </UL>

              <H2>CSIRT validation, and why it varies by country</H2>
              <P>
                The link between an AR and a manufacturer is checked by that manufacturer&rsquo;s
                coordinating CSIRT, not by ENISA. ENISA says validation procedures may vary
                between CSIRTs, and a CSIRT can reject an association. Validation isn&rsquo;t
                required before a first submission (ENISA allows a limited number from
                unverified accounts), but you need a verified Primary AR before you can add
                anyone else. Leave time for it.
              </P>

              <H2>Can an outside provider be a Secondary AR?</H2>
              <P>
                ENISA&rsquo;s published guidance doesn&rsquo;t say either way. In Ireland it has
                been answered: in writing, in November 2026, the NCSC confirmed that, for
                manufacturers reporting through Ireland, an outside provider can be a Secondary
                AR and submit the 24-hour, 72-hour and final reports. The manufacturer&rsquo;s own
                employee must be the Primary AR, and legal responsibility for reporting stays
                with the manufacturer.
              </P>
              <P>
                For other countries, ask your coordinating CSIRT before you rely on it. If an
                outside representative isn&rsquo;t accepted, the practical fallback is that your
                provider prepares every field and your own AR submits.
              </P>

              <H2>What to set up before you need it</H2>
              <UL>
                <li>Pick your coordinating CSIRT: the one in the member state of your main EU establishment.</li>
                <li>Register a Primary AR with a personal EU Login account and MFA, and get the association verified.</li>
                <li>Name at least one backup who can submit when the Primary AR is on holiday.</li>
                <li>Keep a list of products, versions and the EU countries each is sold in. The 24-hour form asks.</li>
                <li>Publish a security contact or security.txt, so researchers and customers can reach you.</li>
                <li>Agree who decides whether something is reportable, and how fast, including at weekends.</li>
                <li>Do a timed dry run on a made-up exploited vulnerability, from alert to a finished early warning.</li>
              </UL>

              <H2>Common mistakes</H2>
              <UL>
                <li>Sharing one EU Login account among several people. Accounts are personal.</li>
                <li>Leaving the Primary AR as the only person who can submit.</li>
                <li>Assuming the clock starts when a fix is ready. It starts at awareness.</li>
                <li>Writing the first draft inside the platform when colleagues need to approve it. Nobody else can see it.</li>
              </UL>

              <div className="mt-14 rounded-2xl border border-stone-200 bg-stone-50 p-6">
                <h2 className="font-display text-xl font-bold text-ink">How Fenwright helps</h2>
                <p className="mt-3 text-[0.98rem] leading-relaxed text-stone-600">
                  We watch the components in your firmware against the exploited-vulnerability
                  lists, decide with you whether something is reportable, and have the 24-hour,
                  72-hour and final reports drafted for your approval. We also help you set up
                  your platform accounts. Nothing is submitted without your approval.
                </p>
                <Link
                  href="/"
                  className="mt-4 inline-block text-sm font-semibold text-accent-700 underline underline-offset-4"
                >
                  See how it works
                </Link>
              </div>

              <H2>Sources</H2>
              <ul className="mt-4 space-y-2 text-[0.95rem] leading-relaxed">
                {sources.map((s) => (
                  <li key={s.href}>
                    <a
                      href={s.href}
                      className="text-ink underline underline-offset-4"
                      rel="noopener noreferrer"
                      target="_blank"
                    >
                      {s.label}
                    </a>
                  </li>
                ))}
              </ul>
              <p className="mt-6 text-sm text-stone-500">
                This guide explains how the platform works. It isn&rsquo;t legal advice.
                ENISA updates the platform regularly (version 1.4 arrived on 17 November 2026),
                so check its pages for the latest.
              </p>
            </div>
          </div>
        </article>
      </main>
      <Footer />
    </>
  );
}

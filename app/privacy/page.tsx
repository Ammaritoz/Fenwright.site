import type { Metadata } from "next";
import Link from "next/link";
import { Nav } from "@/components/Nav";
import { Footer } from "@/components/Footer";
import { site } from "@/config/site";

export const metadata: Metadata = {
  title: "Privacy Policy",
  description:
    "How Fenwright collects, uses, and protects personal data from this website, our business emails and our quote forms, and your rights under GDPR.",
  alternates: { canonical: "/privacy" },
  robots: { index: true, follow: true },
};

const l = site.legal;

function H2({ children }: { children: React.ReactNode }) {
  return <h2 className="mt-12 font-display text-2xl font-bold text-ink">{children}</h2>;
}

function P({ children }: { children: React.ReactNode }) {
  return <p className="mt-4 text-[0.98rem] leading-relaxed text-stone-600">{children}</p>;
}

export default function PrivacyPage() {
  return (
    <>
      <Nav />
      <main id="main">
        <section className="section pt-32 pb-24 sm:pt-40">
          <div className="container-px">
            <div className="mx-auto max-w-3xl">
              <Link
                href="/"
                className="text-sm font-semibold text-accent-700 underline-offset-4 hover:underline"
              >
                &larr; Back to home
              </Link>

              <h1 className="mt-6 font-display text-[2.4rem] font-bold leading-[1.05] text-ink sm:text-[3rem]">
                Privacy Policy
              </h1>
              <p className="mt-4 text-sm text-stone-500">
                Last updated: {l.privacyLastUpdated}
              </p>

              <P>
                This policy explains how {l.tradingName} (&ldquo;we&rdquo;,
                &ldquo;us&rdquo;) collects and uses your personal data when you
                use this website, when we email your business, when you buy
                leads from us, and when you ask for a quote through one of our
                quote forms. It also explains your rights under the EU General
                Data Protection Regulation (GDPR) and, for UK visitors, the UK
                GDPR.
              </P>

              <H2>Who we are</H2>
              <P>
                The data controller is {l.entityName}
                {l.registrationNumber ? `, registered in Ireland under company number ${l.registrationNumber}` : ""}
                {l.vatNumber ? ` (VAT ${l.vatNumber})` : ""}
                {l.address ? `, of ${l.address}` : ""}. You can contact us at{" "}
                <a
                  href={`mailto:${l.contactEmail}`}
                  className="font-medium text-ink underline underline-offset-4"
                >
                  {l.contactEmail}
                </a>
                .
              </P>

              <H2>What we collect on this site, and why</H2>
              <P>
                Through this site, we only collect what you choose to give us:
              </P>
              <ul className="mt-4 list-disc space-y-2 pl-5 text-[0.98rem] leading-relaxed text-stone-600">
                <li>
                  <strong className="text-ink">Live demo (&ldquo;text this to my phone&rdquo;):</strong>{" "}
                  the mobile number you enter, the industry you pick, and any
                  enquiry text you type. We use these to send you one sample
                  reply by SMS so you can experience the product. Lawful basis:{" "}
                  <em>consent</em> (you tick a box before we text you).
                </li>
                <li>
                  <strong className="text-ink">Contact form:</strong> your name,
                  mobile number, and message. We use these to send you one reply
                  by SMS and to follow up about your enquiry. Lawful basis:{" "}
                  <em>consent</em> for the SMS reply, and our{" "}
                  <em>legitimate interest</em> in responding to a business
                  enquiry you initiated.
                </li>
                <li>
                  <strong className="text-ink">Voice demo (&ldquo;talk to the receptionist&rdquo;, or ringing our demo line):</strong>{" "}
                  your voice, a recording and transcript of the call, and
                  anything you say during it, such as a name or number. We use
                  these to run the call and to review how the system performed.
                  Calls last up to five minutes. Lawful basis:{" "}
                  <em>consent</em> (you start the call after being told it is
                  recorded).
                </li>
              </ul>
              <P>
                We do not use the data you give us on this site for unrelated
                marketing, and we do not sell it. You can opt out of any further
                texts at any time by replying STOP or emailing us.
              </P>

              <H2>If we emailed your business</H2>
              <P>
                We find businesses that may want our services from their public
                listings, such as Google Maps, and from their own websites. For
                each one we keep the business name, website, phone number,
                address, rating and review count shown on the listing, and the
                business email address published on its website. We use these
                to send a short business offer and, if there is no reply, one
                follow-up. Lawful basis: our <em>legitimate interest</em> in
                offering our services to businesses.
              </P>
              <P>
                Every email says who we are and has a link to stop hearing from
                us. If you use it, or reply asking us to stop, we stop at once
                and keep only your email address on a do-not-contact list, so we
                never email you again.
              </P>

              <H2>If you buy leads from us</H2>
              <P>
                We keep your business name and contact details, the areas and
                jobs you chose, the leads we send you, and your payments. We use
                these to deliver your leads and run our agreement with you.
                Lawful basis: <em>contract</em>, and <em>legal obligation</em>{" "}
                for accounting records.
              </P>

              <H2>If you ask for a quote through one of our quote forms</H2>
              <P>
                Some of our quote forms help homeowners find a local
                tradesperson, such as a roofer. If you fill one in, we collect
                your name, phone number, email, the area of the property and
                your answers about the job. We check the details, then pass
                them to one local business that covers your area, which will
                contact you about the job. That business pays us for the
                enquiries we send it, and uses your details under its own
                privacy terms. Lawful basis: <em>consent</em>, given on the
                form. You can withdraw it at any time by emailing us.
              </P>

              <H2>Who we share it with</H2>
              <P>
                We use a small number of trusted service providers (processors)
                to run the site. They only process your data on our instructions:
              </P>
              <div className="mt-4 overflow-x-auto">
                <table className="w-full text-left text-sm text-stone-600">
                  <thead>
                    <tr className="border-b border-stone-300 text-ink">
                      <th className="py-2 pr-4 font-semibold">Provider</th>
                      <th className="py-2 pr-4 font-semibold">Purpose</th>
                      <th className="py-2 font-semibold">Data location &amp; safeguard</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-stone-200">
                    <tr>
                      <td className="py-3 pr-4 font-medium text-ink">Anthropic (Claude)</td>
                      <td className="py-3 pr-4">Generates the demo reply text</td>
                      <td className="py-3">United States. Data Processing Agreement with EU Standard Contractual Clauses; inputs are not used to train models.</td>
                    </tr>
                    <tr>
                      <td className="py-3 pr-4 font-medium text-ink">Telnyx</td>
                      <td className="py-3 pr-4">Delivers the SMS</td>
                      <td className="py-3">United States, with EU infrastructure for European messaging. Data Processing Addendum with Standard Contractual Clauses.</td>
                    </tr>
                    <tr>
                      <td className="py-3 pr-4 font-medium text-ink">Airtable</td>
                      <td className="py-3 pr-4">Stores your enquiry as a lead</td>
                      <td className="py-3">United States by default. Data Processing Agreement with Standard Contractual Clauses.</td>
                    </tr>
                    <tr>
                      <td className="py-3 pr-4 font-medium text-ink">Vapi</td>
                      <td className="py-3 pr-4">Runs the voice demo call, its recording and transcript</td>
                      <td className="py-3">United States. Data Processing Agreement with Standard Contractual Clauses.</td>
                    </tr>
                    <tr>
                      <td className="py-3 pr-4 font-medium text-ink">Zoho Mail</td>
                      <td className="py-3 pr-4">Sends and stores our email, including the business emails described above</td>
                      <td className="py-3">United States. Data Processing Agreement with Standard Contractual Clauses.</td>
                    </tr>
                    <tr>
                      <td className="py-3 pr-4 font-medium text-ink">Base44</td>
                      <td className="py-3 pr-4">Hosts our quote forms and stores the quote requests</td>
                      <td className="py-3">United States. Data Processing Agreement with Standard Contractual Clauses.</td>
                    </tr>
                    <tr>
                      <td className="py-3 pr-4 font-medium text-ink">Cal.com</td>
                      <td className="py-3 pr-4">Powers the booking calendar</td>
                      <td className="py-3">United States. Data Processing Agreement with Standard Contractual Clauses.</td>
                    </tr>
                  </tbody>
                </table>
              </div>

              <H2>International transfers</H2>
              <P>
                Some providers process data in the United States. Where they do,
                the transfer is protected by the European Commission&rsquo;s
                Standard Contractual Clauses (and, for UK data, the UK
                International Data Transfer Addendum), which require them to
                protect your data to a standard equivalent to that in the EEA.
              </P>

              <H2>How long we keep it</H2>
              <P>
                We keep enquiry, lead and business contact data for{" "}
                {l.dataRetention}, after which it is deleted, unless we need to
                keep it longer to meet a legal obligation. Email addresses on
                our do-not-contact list are kept for as long as we send business
                emails, so a request to stop is never forgotten.
              </P>

              <H2>Your rights</H2>
              <P>
                You have the right to access, correct, delete, or restrict the
                use of your personal data, to object to processing, and to data
                portability. You can object to direct marketing at any time, and
                we will stop. To exercise any of these, email us at{" "}
                <a
                  href={`mailto:${l.contactEmail}`}
                  className="font-medium text-ink underline underline-offset-4"
                >
                  {l.contactEmail}
                </a>
                . You also have the right to complain to your data protection
                authority: in Ireland, the{" "}
                <a
                  href="https://www.dataprotection.ie"
                  className="font-medium text-ink underline underline-offset-4"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  Data Protection Commission
                </a>
                ; in the UK, the{" "}
                <a
                  href="https://ico.org.uk"
                  className="font-medium text-ink underline underline-offset-4"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  Information Commissioner&rsquo;s Office
                </a>
                .
              </P>

              <H2>Cookies</H2>
              <P>
                We do not set advertising or analytics cookies unless you say yes
                to the cookie banner shown on your first visit. If you accept, we
                use Google Analytics to see how the site is doing; if you decline
                or don&rsquo;t respond, no analytics cookies are set. You can
                change your mind at any time by clearing your browser&rsquo;s
                site data for fenwright.ie, which shows the banner again. The
                embedded Cal.com booking calendar may set storage that is
                necessary for it to function when you interact with it,
                independent of this choice.
              </P>

              <H2>Changes</H2>
              <P>
                We may update this policy from time to time. The date at the top
                shows when it was last changed.
              </P>
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}

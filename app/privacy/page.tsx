import type { Metadata } from "next";
import Link from "next/link";
import { Nav } from "@/components/Nav";
import { Footer } from "@/components/Footer";
import { site } from "@/config/site";

export const metadata: Metadata = {
  title: "Privacy Policy",
  description:
    "How Fenwright collects, uses, and protects your personal data, and your rights under GDPR.",
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
                use this website, and your rights under the EU General Data
                Protection Regulation (GDPR) and, for UK visitors, the UK GDPR.
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

              <H2>What we collect and why</H2>
              <P>
                We only collect what you choose to give us through this site:
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
              </ul>
              <P>
                We do not use your data for unrelated marketing, and we do not
                sell it. You can opt out of any further texts at any time by
                replying STOP or emailing us.
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
                      <td className="py-3 pr-4 font-medium text-ink">Twilio</td>
                      <td className="py-3 pr-4">Delivers the SMS</td>
                      <td className="py-3">United States (with an EU data-residency option for messaging). Data Processing Addendum with Standard Contractual Clauses.</td>
                    </tr>
                    <tr>
                      <td className="py-3 pr-4 font-medium text-ink">Airtable</td>
                      <td className="py-3 pr-4">Stores your enquiry as a lead</td>
                      <td className="py-3">United States by default. Data Processing Agreement with Standard Contractual Clauses.</td>
                    </tr>
                    <tr>
                      <td className="py-3 pr-4 font-medium text-ink">Cal.com (EU)</td>
                      <td className="py-3 pr-4">Powers the booking calendar</td>
                      <td className="py-3">European Union (EU-hosted infrastructure).</td>
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
                We keep enquiry and lead data for {l.dataRetention}, after which
                it is deleted, unless we need to keep it longer to meet a legal
                obligation.
              </P>

              <H2>Your rights</H2>
              <P>
                You have the right to access, correct, delete, or restrict the
                use of your personal data, to object to processing, and to data
                portability. To exercise any of these, email us at{" "}
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

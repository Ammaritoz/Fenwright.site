import type { Metadata } from "next";
import Link from "next/link";
import { Nav } from "@/components/Nav";
import { Footer } from "@/components/Footer";
import { site } from "@/config/site";

export const metadata: Metadata = {
  title: "Privacy Policy",
  description:
    "How Fenwright collects, uses, and protects personal data from this website, our business emails and the product files clients send us, and your rights under GDPR.",
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
                &ldquo;us&rdquo;) collects and uses personal data when you use
                this website, when we contact your business, and when your
                company sends us product files for a first look or as a client.
                It also explains your rights under the EU General Data
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

              <H2>What we collect on this site, and why</H2>
              <P>
                Through this site, we only collect what you choose to give us:
              </P>
              <ul className="mt-4 list-disc space-y-2 pl-5 text-[0.98rem] leading-relaxed text-stone-600">
                <li>
                  <strong className="text-ink">Booking a call:</strong> your
                  name, email and anything you add to the booking. We use these
                  to hold the call and follow up. Lawful basis: our{" "}
                  <em>legitimate interest</em> in responding to a business
                  enquiry you started.
                </li>
                <li>
                  <strong className="text-ink">Emailing or messaging us:</strong>{" "}
                  your contact details and whatever you write. We use these to
                  reply. Lawful basis: <em>legitimate interest</em>.
                </li>
              </ul>
              <P>
                We do not use the data you give us on this site for unrelated
                marketing, and we do not sell it.
              </P>

              <H2>If we contacted your business</H2>
              <P>
                We find companies that may need our services from public
                sources, such as company websites, trade association member
                lists and professional networks. For each one we keep the
                company name and website, and the work email address or phone
                number of the person we contact. We use these to send a short
                business message and, if there is no reply, one follow-up.
                Lawful basis: our <em>legitimate interest</em> in offering our
                services to businesses.
              </P>
              <P>
                Every email says who we are and has a link to stop hearing from
                us. If you use it, or reply asking us to stop, we stop at once
                and keep only your email address on a do-not-contact list, so we
                never email you again.
              </P>

              <H2>If you send us product files</H2>
              <P>
                For a free first look, or as a client, your company may send us
                firmware images, software parts lists (SBOMs) and product
                details. These are mainly technical, not personal, data, but
                they can contain names or email addresses of your staff. We
                handle them under the non-disclosure agreement we sign with
                you, and that agreement takes priority over this policy:
              </P>
              <ul className="mt-4 list-disc space-y-2 pl-5 text-[0.98rem] leading-relaxed text-stone-600">
                <li>Files are stored encrypted and used only to produce your report or run your service.</li>
                <li>
                  For a first look, the files are deleted once the scan is
                  done. We keep the report and the list of components found,
                  so we can talk it through with you, unless you ask us to
                  delete those too.
                </li>
                <li>
                  For clients, we keep files and decision records for as long
                  as the service runs, then return or delete them as the
                  contract says.
                </li>
              </ul>
              <P>
                Lawful basis for any personal data in them: <em>contract</em>,
                and our <em>legitimate interest</em> in delivering the work you
                asked for.
              </P>

              <H2>Our earlier services</H2>
              <P>
                Until November 2026 we also sold local leads to tradespeople
                and ran quote forms for homeowners. Those services have closed.
                Data collected through them is being deleted, except invoices
                and records we must keep by law. To ask about data we hold from
                that time, email us.
              </P>

              <H2>Who we share it with</H2>
              <P>
                We use a small number of trusted service providers (processors)
                to run our business. They only process your data on our instructions:
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
                      <td className="py-3 pr-4">Helps analyse security advisories against product component lists, and draft reports</td>
                      <td className="py-3">United States. Data Processing Agreement with EU Standard Contractual Clauses; inputs are not used to train models.</td>
                    </tr>
                    <tr>
                      <td className="py-3 pr-4 font-medium text-ink">Vercel</td>
                      <td className="py-3 pr-4">Hosts this website</td>
                      <td className="py-3">United States, with EU regions. Data Processing Addendum with Standard Contractual Clauses.</td>
                    </tr>
                    <tr>
                      <td className="py-3 pr-4 font-medium text-ink">Airtable</td>
                      <td className="py-3 pr-4">Stores business contacts and call notes</td>
                      <td className="py-3">United States by default. Data Processing Agreement with Standard Contractual Clauses.</td>
                    </tr>
                    <tr>
                      <td className="py-3 pr-4 font-medium text-ink">Zoho Mail</td>
                      <td className="py-3 pr-4">Sends and stores our email</td>
                      <td className="py-3">Data Processing Agreement with Standard Contractual Clauses where data leaves the EEA.</td>
                    </tr>
                    <tr>
                      <td className="py-3 pr-4 font-medium text-ink">Cal.com</td>
                      <td className="py-3 pr-4">Powers the booking calendar</td>
                      <td className="py-3">United States. Data Processing Agreement with Standard Contractual Clauses.</td>
                    </tr>
                    <tr>
                      <td className="py-3 pr-4 font-medium text-ink">Base44</td>
                      <td className="py-3 pr-4">Hosted our former quote forms; that data is being deleted</td>
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
                We keep enquiry and business contact data for{" "}
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

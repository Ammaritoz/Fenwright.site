import type { Metadata } from "next";
import Link from "next/link";
import { Nav } from "@/components/Nav";
import { Footer } from "@/components/Footer";
import { site } from "@/config/site";

export const metadata: Metadata = {
  title: "Security and vulnerability disclosure",
  description:
    "How to report a security vulnerability in Fenwright's website or services, and what happens after you do.",
  alternates: { canonical: "/security" },
  robots: { index: true, follow: true },
};

const l = site.legal;

function H2({ children }: { children: React.ReactNode }) {
  return <h2 className="mt-12 font-display text-2xl font-bold text-ink">{children}</h2>;
}

function P({ children }: { children: React.ReactNode }) {
  return <p className="mt-4 text-[0.98rem] leading-relaxed text-stone-600">{children}</p>;
}

function Mail() {
  return (
    <a href={`mailto:${l.contactEmail}`} className="font-medium text-ink underline underline-offset-4">
      {l.contactEmail}
    </a>
  );
}

// We ask clients to publish a disclosure policy and a security contact, so we
// publish our own. Keep it in step with public/.well-known/security.txt.
export default function SecurityPage() {
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
                Security and vulnerability disclosure
              </h1>

              <P>
                We ask the manufacturers we work with to give security
                researchers a clear way to report problems. This is ours. If
                you think you have found a security vulnerability in this
                website or in any of our services, we want to hear about it.
              </P>

              <H2>How to report</H2>
              <P>
                Email <Mail /> with &ldquo;Security&rdquo; in the subject line.
                Please include what you found, where, the steps to reproduce
                it, and what an attacker could do with it. Screenshots or a
                short proof of concept help.
              </P>
              <P>
                If your report is about a product made by one of our clients,
                please report it to that manufacturer directly, using the
                security contact it publishes.
              </P>

              <H2>What happens next</H2>
              <ul className="mt-4 list-disc space-y-2 pl-5 text-[0.98rem] leading-relaxed text-stone-600">
                <li>We aim to confirm we have your report within three working days.</li>
                <li>We will tell you whether we can reproduce it, and keep you updated while we fix it.</li>
                <li>Once it is fixed, we are happy to credit you publicly, if you would like that.</li>
              </ul>

              <H2>Please</H2>
              <ul className="mt-4 list-disc space-y-2 pl-5 text-[0.98rem] leading-relaxed text-stone-600">
                <li>Give us a reasonable time to fix the problem before you share it with anyone else.</li>
                <li>Do not access, change or delete data that is not yours, and stop as soon as you have shown the problem exists.</li>
                <li>Do not run denial-of-service tests, spam, or social engineering against us or our clients.</li>
              </ul>
              <P>
                If you act in good faith and follow these points, we will not
                take legal action against you over your research. We do not
                run a paid bug bounty.
              </P>

              <H2>Machine-readable contact</H2>
              <P>
                Our contact details are also published at{" "}
                <a
                  href="/.well-known/security.txt"
                  className="font-medium text-ink underline underline-offset-4"
                >
                  /.well-known/security.txt
                </a>
                , following RFC 9116.
              </P>
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}

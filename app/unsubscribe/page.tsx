import type { Metadata } from "next";
import Link from "next/link";
import { Nav } from "@/components/Nav";
import { Footer } from "@/components/Footer";
import { UnsubscribeForm } from "@/components/UnsubscribeForm";

export const metadata: Metadata = {
  title: "Unsubscribe",
  description: "Stop receiving emails from Fenwright.",
  robots: { index: false, follow: false },
};

export default function UnsubscribePage({
  searchParams,
}: {
  searchParams: { email?: string };
}) {
  const email = (searchParams.email || "").trim();

  return (
    <>
      <Nav />
      <main id="main">
        <section className="section pt-32 pb-24 sm:pt-40">
          <div className="container-px">
            <div className="mx-auto max-w-lg">
              <Link
                href="/"
                className="text-sm font-semibold text-accent-700 underline-offset-4 hover:underline"
              >
                &larr; Back to home
              </Link>

              <h1 className="mt-6 font-display text-[2.4rem] font-bold leading-[1.05] text-ink sm:text-[3rem]">
                Unsubscribe
              </h1>
              <p className="mt-4 text-[0.98rem] leading-relaxed text-stone-600">
                Confirm below and we will stop emailing this address. No
                account, no login, no questions asked.
              </p>

              <UnsubscribeForm email={email} />
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}

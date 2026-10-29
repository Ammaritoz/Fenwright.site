import type { Metadata } from "next";
import { Nav } from "@/components/Nav";
import { Footer } from "@/components/Footer";
import { RoiCalculator } from "@/components/roi/RoiCalculator";
import { roi } from "@/config/roi";
import { parseRoiParams } from "@/lib/roi";

/**
 * The ROI calculator we share on pipeline calls.
 *
 * Unlisted on purpose: noindex here, and absent from app/sitemap.ts and the
 * nav. It is not disallowed in app/robots.ts, because a crawler that cannot
 * fetch the page never sees the noindex and may list the bare URL anyway.
 */
export const metadata: Metadata = {
  title: roi.meta.title,
  description: roi.meta.description,
  alternates: { canonical: "/roi" },
  robots: { index: false, follow: false },
};

export default function RoiPage({
  searchParams,
}: {
  searchParams: Record<string, string | string[] | undefined>;
}) {
  // Parsed on the server so the first paint already shows the shared link's
  // numbers, with no flash of defaults and no hydration mismatch.
  const initial = parseRoiParams(searchParams);

  return (
    <>
      <Nav />
      <main id="main">
        <section className="section pt-32 pb-24 sm:pt-40">
          <div className="container-px">
            <div className="max-w-2xl">
              <h1 className="font-display text-[2.4rem] font-bold leading-[1.02] text-ink sm:text-[3.4rem]">
                {roi.intro.headline} <em className="font-semibold text-accent">{roi.intro.headlineEmphasis}</em>
              </h1>
              <p className="mt-5 max-w-xl text-lg leading-relaxed text-stone-600 print:hidden">{roi.intro.lead}</p>
            </div>

            <div className="mt-12">
              <RoiCalculator initial={initial} />
            </div>

            <div className="mt-24 rounded-xl2 bg-ink px-6 py-10 text-paper sm:px-10 print:hidden">
              <h2 className="max-w-xl font-display text-[1.8rem] font-bold leading-[1.1] sm:text-[2.2rem]">
                {roi.cta.headline}
              </h2>
              <p className="mt-4 max-w-xl leading-relaxed text-stone-300">{roi.cta.body}</p>
              <a href={roi.cta.href} className="btn-onink mt-7">
                {roi.cta.label}
              </a>
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}

import type { Metadata } from "next";
import { Nav } from "@/components/Nav";
import { Footer } from "@/components/Footer";
import { BookCall } from "@/components/BookCall";
import { Reveal } from "@/components/Reveal";
import { SectionHead } from "@/components/SectionHead";
import { SampleLead } from "@/components/SampleLead";
import { Backdrop } from "@/components/Backdrop";
import { Arrow } from "@/components/Arrow";
import { media } from "@/config/media";
import { roofing } from "@/config/roofing";
import { site } from "@/config/site";
import { Roll } from "@/components/Roll";
import { Deck } from "@/components/Deck";

/**
 * The page every US roofer cold email links to (outreach/us_roofing.py). Copy
 * lives in config/roofing.ts.
 */
export const metadata: Metadata = {
  title: roofing.meta.title,
  description: roofing.meta.description,
  alternates: { canonical: "/roofing-leads" },
  openGraph: {
    title: `${roofing.meta.title} | ${site.brand.name}`,
    description: roofing.meta.description,
    url: "https://www.fenwright.ie/roofing-leads",
    siteName: site.brand.name,
    type: "website",
    images: [{ url: "/og-image.png", width: 1200, height: 630, alt: site.brand.name }],
  },
};

function Check({ className = "" }: { className?: string }) {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden="true" className={`shrink-0 ${className}`}>
      <path d="M4 12.5l5 5L20 6.5" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function Cross({ className = "" }: { className?: string }) {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden="true" className={`shrink-0 ${className}`}>
      <path d="M7 7l10 10M17 7L7 17" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" />
    </svg>
  );
}

function Dot({ className = "" }: { className?: string }) {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden="true" className={`shrink-0 ${className}`}>
      <circle cx="12" cy="12" r="3.5" fill="currentColor" />
    </svg>
  );
}

export default function RoofingLeadsPage() {
  const r = roofing;
  return (
    <>
      <Nav overlay cta={{ label: "Book a call", href: "#book" }} />
      <main id="main">
        {/* Hero, with the lead itself beside the pitch */}
        <section id="top" className="relative isolate overflow-hidden bg-ink text-white">
          <Backdrop slot={media.roofingHero} wash="heavy" drift />
          <div className="container-px grid items-center gap-14 pb-20 pt-32 lg:grid-cols-[1.05fr_0.95fr] lg:gap-20 lg:pb-28 lg:pt-44">
            <div>
              <h1 className="animate-fade-up font-display text-[clamp(2.6rem,6vw,4.75rem)] leading-[1.04] tracking-[-0.02em]">
                {r.hero.headline} {r.hero.headlineEmphasis}
              </h1>
              <p className="animate-fade-up mt-7 max-w-[34rem] text-lg font-light leading-relaxed text-white/85 [animation-delay:80ms] sm:text-xl">
                {r.hero.lead}
              </p>
              <p className="animate-fade-up mt-6 max-w-[34rem] border-l border-accent-300 pl-5 leading-relaxed text-white [animation-delay:120ms]">
                {r.hero.offer}
              </p>

              <div className="animate-fade-up mt-9 flex flex-col gap-3 [animation-delay:160ms] sm:flex-row">
                <a href={r.hero.primaryCta.href} className="btn-cta">
                  <Roll>
                    {r.hero.primaryCta.label}
                    <Arrow />
                  </Roll>
                </a>
                <a href={r.hero.secondaryCta.href} className="btn-ghost-onink">
                  <Roll>{r.hero.secondaryCta.label}</Roll>
                </a>
              </div>

              <p className="animate-fade-up mt-10 text-sm text-white/65 [animation-delay:240ms]">{r.hero.note}</p>
            </div>

            <Reveal delay={120}>
              <SampleLead tone="dark" />
            </Reveal>
          </div>
        </section>

        {/* Shared lead sites vs us */}
        <section id="compare" className="section bg-ink py-24 text-paper sm:py-28">
          <div className="container-px">
            <Reveal>
              <SectionHead tone="dark" size="lg" title={r.compare.headline} />
            </Reveal>
            <div className="mt-12">
              <div className="hidden grid-cols-2 gap-x-10 pb-4 text-xs font-semibold uppercase tracking-[0.14em] sm:grid">
                <span className="text-stone-400">{r.compare.themLabel}</span>
                <span className="text-accent-300">{r.compare.usLabel}</span>
              </div>
              <ul>
                {r.compare.rows.map((row, i) => (
                  <Reveal
                    as="li"
                    key={row.us}
                    delay={i * 70}
                    className="grid gap-x-10 gap-y-2 border-t border-white/10 py-6 sm:grid-cols-2"
                  >
                    <p className="flex items-start gap-3 text-stone-400">
                      <Cross className="mt-0.5 text-stone-500" />
                      <span>
                        <span className="sr-only">{r.compare.themLabel}: </span>
                        {row.them}
                      </span>
                    </p>
                    <p className="flex items-start gap-3 text-[1.05rem] font-medium text-paper">
                      <Check className="mt-0.5 text-accent-300" />
                      <span>
                        <span className="sr-only">{r.compare.usLabel}: </span>
                        {row.us}
                      </span>
                    </p>
                  </Reveal>
                ))}
              </ul>
            </div>
          </div>
        </section>

        {/* The lead definition */}
        <section id="checks" className="section py-24 sm:py-32">
          <div className="container-px grid gap-12 lg:grid-cols-[0.9fr_1.1fr] lg:gap-16">
            <Reveal>
              <SectionHead title={r.checks.headline} lead={r.checks.lead} />
              <p className="mt-6 max-w-md text-sm leading-relaxed text-stone-500">{r.checks.note}</p>
            </Reveal>
            <Reveal className="flex flex-wrap content-start gap-3">
              {r.checks.items.map((item) => (
                <span
                  key={item}
                  className="inline-flex items-center gap-2.5 rounded-full border border-stone-300 bg-paper px-5 py-3 text-[1.02rem] leading-snug text-ink"
                >
                  <Check className="text-accent" />
                  {item}
                </span>
              ))}
            </Reveal>
          </div>
        </section>

        {/* How it starts */}
        <section id="how-it-starts" className="section bg-paper-alt py-24 sm:py-32">
          <div className="container-px">
            <Reveal>
              <SectionHead title={r.steps.headline} />
            </Reveal>
            <Reveal className="mt-14">
              <Deck
                tone="light"
                label={r.steps.headline}
                cards={[
                  ...r.steps.items.map((s) => ({ kind: "text" as const, title: s.title, body: s.body })),
                  { kind: "photo" as const, image: media.roofing.image, caption: r.steps.photoCaption },
                ]}
              />
            </Reveal>
          </div>
        </section>

        {/* Replacement rules */}
        <section id="rules" className="section py-24 sm:py-32">
          <div className="container-px">
            <Reveal>
              <SectionHead title={r.rules.headline} lead={r.rules.lead} />
            </Reveal>
            <div className="mt-14 grid gap-6 lg:grid-cols-3">
              {r.rules.columns.map((col, i) => (
                <Reveal
                  key={col.title}
                  delay={i * 100}
                  className={`rounded-[2rem] border p-8 ${
                    col.tone === "neutral" ? "border-ink bg-ink text-paper" : "border-stone-200 bg-paper"
                  }`}
                >
                  <h3 className={`font-display text-2xl ${col.tone === "neutral" ? "text-paper" : "text-ink"}`}>
                    {col.title}
                  </h3>
                  <ul className="mt-5 space-y-3.5">
                    {col.items.map((item) => (
                      <li
                        key={item}
                        className={`flex items-start gap-3 text-[0.98rem] leading-snug ${
                          col.tone === "neutral" ? "text-stone-200" : "text-stone-600"
                        }`}
                      >
                        {col.tone === "yes" && <Check className="text-accent" />}
                        {col.tone === "no" && <Cross className="text-stone-400" />}
                        {col.tone === "neutral" && <Dot className="text-accent-300" />}
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                </Reveal>
              ))}
            </div>
          </div>
        </section>

        {/* Process, not outcome */}
        <section id="promise" className="section pb-24 sm:pb-32">
          <div className="container-px">
            <Reveal className="rounded-[2rem] bg-ink px-6 py-12 text-paper sm:px-14 sm:py-16">
              <h2 className="h-card max-w-2xl">
                {r.promise.headline}
              </h2>
              <p className="mt-5 max-w-2xl text-lg leading-relaxed text-stone-300">{r.promise.body}</p>
              <a href={r.promise.cta.href} className="btn-onink mt-8">
                <Roll>{r.promise.cta.label}</Roll>
              </a>
            </Reveal>
          </div>
        </section>

        {/* FAQ */}
        <section id="faq" className="section bg-paper-alt py-24 sm:py-32">
          <div className="container-px grid gap-12 lg:grid-cols-[0.8fr_1.2fr] lg:gap-16">
            <Reveal>
              <SectionHead title={r.faq.headline} />
            </Reveal>
            <div className="divide-y divide-stone-300 border-y border-stone-300">
              {r.faq.items.map((item) => (
                <details key={item.q} className="group py-1">
                  <summary className="flex cursor-pointer list-none items-center justify-between gap-6 py-5 font-display text-xl text-ink [&::-webkit-details-marker]:hidden">
                    {item.q}
                    <svg
                      width="18"
                      height="18"
                      viewBox="0 0 24 24"
                      fill="none"
                      aria-hidden="true"
                      className="shrink-0 text-stone-500 transition-transform duration-200 group-open:rotate-45"
                    >
                      <path d="M12 5v14M5 12h14" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
                    </svg>
                  </summary>
                  <p className="max-w-2xl pb-6 text-[1rem] leading-relaxed text-stone-600">{item.a}</p>
                </details>
              ))}
            </div>
          </div>
        </section>

        <BookCall headline={r.book.headline} subhead={r.book.subhead} />
      </main>
      <Footer />
    </>
  );
}

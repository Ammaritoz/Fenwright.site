import { site } from "@/config/site";
import { SectionHead } from "@/components/SectionHead";
import { Reveal } from "@/components/Reveal";

export function WhatYouGet() {
  const w = site.whatYouGet;
  return (
    <section id="what-you-get" className="section bg-ink py-24 text-paper sm:py-32">
      <div className="container-px">
        <Reveal>
          <SectionHead tone="dark" size="lg" title={w.headline} />
        </Reveal>

        <div className="mt-14 grid gap-x-14 sm:grid-cols-2">
          {w.bullets.map((b, i) => (
            <Reveal
              as="div"
              key={i}
              delay={(i % 2) * 90}
              className="border-t border-white/10 py-8"
            >
              <div className="flex items-start gap-4">
                <svg
                  width="26"
                  height="26"
                  viewBox="0 0 24 24"
                  fill="none"
                  aria-hidden="true"
                  className="mt-0.5 shrink-0"
                >
                  <path d="M4 12.5l5 5L20 6.5" stroke="#A7C9B6" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
                <div>
                  <h3 className="font-display text-xl font-bold text-paper">{b.title}</h3>
                  <p className="mt-2 text-[0.98rem] leading-relaxed text-stone-300">{b.body}</p>
                </div>
              </div>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}

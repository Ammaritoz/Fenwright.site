import { site } from "@/config/site";
import { SectionHead } from "@/components/SectionHead";
import { Reveal } from "@/components/Reveal";

/**
 * The offer in two equal halves: leads in ("Get") and the systems that win
 * them. Side by side on wide screens so neither reads as the add-on.
 */
export function Services() {
  const w = site.services;
  return (
    <section id="services" className="section border-t border-white/10 bg-ink py-24 text-paper sm:py-32">
      <div className="container-px">
        <Reveal>
          <SectionHead tone="dark" size="lg" title={w.headline} />
        </Reveal>

        <div className="mt-14 grid gap-x-14 gap-y-14 lg:grid-cols-2">
          {w.groups.map((g, gi) => (
            <Reveal as="div" key={g.title} delay={gi * 110}>
              <div className="border-t-2 border-accent-300/70 pt-6">
                <h3 className="font-display text-[1.7rem] font-bold leading-tight text-paper">{g.title}</h3>
                <p className="mt-2 text-[0.98rem] text-stone-300">{g.lead}</p>
              </div>
              <ul className="mt-4">
                {g.bullets.map((b) => (
                  <li key={b.title} className="flex items-start gap-4 border-t border-white/10 py-6">
                    <svg
                      width="24"
                      height="24"
                      viewBox="0 0 24 24"
                      fill="none"
                      aria-hidden="true"
                      className="mt-0.5 shrink-0"
                    >
                      <path d="M4 12.5l5 5L20 6.5" stroke="#A7C9B6" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                    <div>
                      <h4 className="font-display text-lg font-bold text-paper">{b.title}</h4>
                      <p className="mt-1.5 text-[0.98rem] leading-relaxed text-stone-300">{b.body}</p>
                    </div>
                  </li>
                ))}
              </ul>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}

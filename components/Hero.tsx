import { site } from "@/config/site";
import { WeekLedger } from "@/components/WeekLedger";
import { Reveal } from "@/components/Reveal";

export function Hero() {
  const h = site.hero;
  const founders = site.about.people;
  return (
    <section id="top" className="relative overflow-hidden">
      <div className="container-px grid items-center gap-14 pt-28 pb-20 sm:pt-32 lg:grid-cols-[1.05fr_0.95fr] lg:gap-16 lg:pt-36 lg:pb-28">
        <div>
          <h1 className="animate-fade-up font-display text-[clamp(3rem,8.5vw,6rem)] font-semibold leading-[0.95] tracking-[-0.035em] text-ink">
            {h.headline} <em className="font-medium italic text-accent">{h.headlineEmphasis}</em>
          </h1>

          <p className="animate-fade-up [animation-delay:80ms] mt-7 max-w-[34rem] text-lg leading-relaxed text-stone-600 sm:text-[1.2rem]">
            {h.subhead}
          </p>

          <div className="animate-fade-up [animation-delay:160ms] mt-9 flex flex-col gap-3 sm:flex-row">
            <a href={h.primaryCta.href} className="btn-primary">
              {h.primaryCta.label}
              <svg width="17" height="17" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                <path d="M5 12h14M13 6l6 6-6 6" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </a>
            <a href={h.secondaryCta.href} className="btn-secondary">
              {h.secondaryCta.label}
            </a>
          </div>

          <div className="animate-fade-up [animation-delay:240ms] mt-10 flex items-center gap-3.5">
            <div className="flex -space-x-1" aria-hidden="true">
              {founders.map((p) => (
                <span
                  key={p.initials}
                  className="flex h-9 w-9 items-center justify-center rounded-full bg-ink font-display text-[0.8rem] font-semibold text-paper ring-2 ring-paper"
                >
                  {p.initials}
                </span>
              ))}
            </div>
            <p className="text-[0.95rem] font-medium text-stone-600">{h.note}</p>
          </div>
        </div>

        {/* Reveal, not a load animation: on phones the sheet sits below the
            fold, and its strike-throughs should play when it is seen. */}
        <Reveal delay={120}>
          <WeekLedger />
        </Reveal>
      </div>
    </section>
  );
}

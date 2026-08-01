import { site } from "@/config/site";
import { PhoneMock } from "@/components/PhoneMock";

export function Hero() {
  const h = site.hero;
  return (
    <section id="top" className="relative overflow-hidden">
      <div className="container-px grid items-center gap-12 pt-32 pb-16 lg:grid-cols-[1.05fr_0.95fr] lg:gap-12 lg:pt-40 lg:pb-24">
        <div>
          <p className="animate-fade-up inline-flex items-center rounded-full bg-ink/[0.04] px-4 py-2 text-sm font-semibold text-ink">
            {h.kicker}
          </p>

          <h1 className="animate-fade-up [animation-delay:80ms] mt-6 font-display text-[clamp(2.6rem,7vw,4.6rem)] font-extrabold leading-[0.98] tracking-[-0.03em] text-ink">
            {h.headline}
          </h1>

          <p className="animate-fade-up [animation-delay:160ms] mt-7 max-w-xl text-lg leading-relaxed text-stone-600 sm:text-xl">
            {h.subhead}
          </p>

          <div className="animate-fade-up [animation-delay:240ms] mt-9 flex flex-col gap-3 sm:flex-row">
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

          <p className="animate-fade-up [animation-delay:320ms] mt-8 text-[0.95rem] font-medium text-stone-500">
            {h.note}
          </p>
        </div>

        <div className="animate-fade-up [animation-delay:200ms]">
          <PhoneMock />
        </div>
      </div>
    </section>
  );
}

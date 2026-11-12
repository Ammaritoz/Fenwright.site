import { site } from "@/config/site";
import { media } from "@/config/media";
import { Backdrop } from "@/components/Backdrop";
import { Arrow } from "@/components/Arrow";
import { Roll } from "@/components/Roll";

export function Hero() {
  const h = site.hero;
  return (
    <section id="top" className="relative isolate flex min-h-[100svh] flex-col overflow-hidden bg-ink text-white">
      <Backdrop slot={media.hero} drift />

      <div className="container-px flex flex-1 flex-col items-center justify-center pb-16 pt-32 text-center">
        <h1 className="h-display animate-fade-up max-w-5xl">
          <span className="block">{h.headline}</span>
          <span className="block">{h.headlineEmphasis}</span>
        </h1>

        <p className="animate-fade-up mt-8 max-w-2xl text-xl font-light leading-snug text-white/85 [animation-delay:90ms] sm:text-2xl">
          {h.lede}
        </p>

        <div className="animate-fade-up mt-10 flex flex-col gap-3 [animation-delay:180ms] sm:flex-row">
          <a href={h.primaryCta.href} className="btn-cta">
            <Roll>
              {h.primaryCta.label}
              <Arrow />
            </Roll>
          </a>
          <a href={h.secondaryCta.href} className="btn-ghost-onink">
            <Roll>{h.secondaryCta.label}</Roll>
          </a>
        </div>
      </div>

      <dl className="container-px animate-fade-up grid border-t border-white/20 [animation-delay:270ms] sm:grid-cols-3">
        {h.facts.map((f, i) => (
          <div
            key={f.value}
            className={`py-5 sm:py-7 ${i > 0 ? "border-t border-white/20 sm:border-l sm:border-t-0 sm:pl-8" : ""}`}
          >
            <dt className="font-display text-xl sm:text-2xl">{f.value}</dt>
            <dd className="mt-1 text-sm text-white/70">{f.label}</dd>
          </div>
        ))}
      </dl>
    </section>
  );
}

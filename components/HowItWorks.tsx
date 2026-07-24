import { site } from "@/config/site";
import { SectionHead } from "@/components/SectionHead";
import { Reveal } from "@/components/Reveal";

export function HowItWorks() {
  const h = site.howItWorks;
  return (
    <section id="how-it-works" className="section py-24 sm:py-32">
      <div className="container-px">
        <Reveal>
          <SectionHead title={h.headline} />
        </Reveal>

        <ol className="mt-16 grid gap-x-8 gap-y-12 md:grid-cols-3">
          {h.steps.map((step, i) => (
            <Reveal as="li" key={i} delay={i * 110} className="relative">
              <div className="flex items-center gap-4">
                <span className="font-display text-6xl font-extrabold leading-none tabular-nums text-accent">
                  {i + 1}
                </span>
                <span className="h-px flex-1 bg-stone-200" aria-hidden="true" />
              </div>
              <h3 className="mt-6 font-display text-xl font-bold text-ink">{step.title}</h3>
              <p className="mt-3 text-[0.98rem] leading-relaxed text-stone-600">{step.body}</p>
            </Reveal>
          ))}
        </ol>
      </div>
    </section>
  );
}

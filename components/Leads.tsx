import { site } from "@/config/site";
import { SectionHead } from "@/components/SectionHead";
import { Reveal } from "@/components/Reveal";
import { SampleLead } from "@/components/SampleLead";

/** The homepage's "Get" half in detail: how a lead reaches you, beside one. */
export function Leads() {
  const l = site.leads;
  return (
    <section id="leads" className="section py-24 sm:py-32">
      <div className="container-px grid items-start gap-14 lg:grid-cols-[1.05fr_0.95fr] lg:gap-16">
        <div>
          <Reveal>
            <SectionHead title={l.headline} lead={l.lead} />
          </Reveal>

          <ol className="mt-12 grid gap-x-8 gap-y-9 sm:grid-cols-2">
            {l.steps.map((step, i) => (
              <Reveal as="li" key={step.title} delay={(i % 2) * 90}>
                <div className="flex items-center gap-3">
                  <span className="font-display text-3xl font-extrabold leading-none tabular-nums text-accent">{i + 1}</span>
                  <span className="h-px flex-1 bg-stone-200" aria-hidden="true" />
                </div>
                <h3 className="mt-4 font-display text-lg font-bold text-ink">{step.title}</h3>
                <p className="mt-2 text-[0.98rem] leading-relaxed text-stone-600">{step.body}</p>
              </Reveal>
            ))}
          </ol>

          <Reveal className="mt-12">
            <a href={l.cta.href} className="btn-primary">
              {l.cta.label}
              <svg width="17" height="17" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                <path d="M5 12h14M13 6l6 6-6 6" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </a>
            <p className="mt-4 max-w-md text-sm leading-relaxed text-stone-500">{l.note}</p>
          </Reveal>
        </div>

        <Reveal delay={120} className="lg:sticky lg:top-28">
          <SampleLead />
        </Reveal>
      </div>
    </section>
  );
}

import { site } from "@/config/site";
import { Reveal } from "@/components/Reveal";

/** Why speed and exclusivity matter, with the two sourced figures set large. */
export function Problem() {
  const p = site.problem;
  return (
    <section id="problem" className="section bg-paper pt-24 text-ink sm:pt-36">
      <div className="container-px">
        <Reveal className="mx-auto max-w-4xl text-center">
          <p className="kicker text-accent">{p.kicker}</p>
          <h2 className="h-section mt-6">{p.headline}</h2>
          <p className="mx-auto mt-8 max-w-2xl text-lg leading-relaxed text-stone-600">{p.body}</p>
        </Reveal>

        <div className="mt-16 grid gap-5 md:grid-cols-2">
          {p.stats.map((s, i) => (
            <Reveal key={s.value} delay={i * 110} className="rounded-[2rem] bg-paper-alt p-8 sm:p-12">
              <p className="font-display text-[clamp(4.5rem,10vw,8rem)] leading-none tracking-[-0.03em] text-ink">
                {s.value}
              </p>
              <p className="mt-8 max-w-sm text-lg leading-snug text-stone-600">{s.label}</p>
            </Reveal>
          ))}
        </div>

        <p className="mt-6 max-w-3xl text-xs leading-relaxed text-stone-500">{p.source}</p>
      </div>
    </section>
  );
}

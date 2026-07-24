import { site } from "@/config/site";
import { SectionHead } from "@/components/SectionHead";
import { Reveal } from "@/components/Reveal";

export function Problem() {
  const p = site.problem;
  const [big, ...rest] = p.stats;
  return (
    <section id="problem" className="section bg-ink py-24 text-paper sm:py-32">
      <div className="container-px">
        <div className="grid items-end gap-12 lg:grid-cols-[1fr_0.9fr]">
          <Reveal>
            <SectionHead tone="dark" size="lg" title={p.headline} lead={p.body} />
          </Reveal>

          {/* The stat as a statement, not a card. */}
          <Reveal delay={120}>
            <p className="text-2xl font-medium leading-snug text-stone-200 sm:text-[1.6rem]">
              <span className="block font-display text-[clamp(4.5rem,15vw,9rem)] font-extrabold leading-[0.85] tracking-[-0.04em] text-accent">
                {big.value}
              </span>
              <span className="mt-3 block max-w-md">{big.label}</span>
            </p>
          </Reveal>
        </div>

        <div className="mt-16 grid gap-10 border-t border-white/10 pt-10 sm:grid-cols-2">
          {rest.map((s, i) => (
            <Reveal key={i} delay={i * 100} className="flex items-baseline gap-5">
              <span
                className={`font-display text-4xl font-extrabold tabular-nums tracking-tight sm:text-5xl ${
                  i === rest.length - 1 ? "text-accent" : "text-paper"
                }`}
              >
                {s.value}
              </span>
              <span className="text-[0.95rem] leading-relaxed text-stone-300">{s.label}</span>
            </Reveal>
          ))}
        </div>

        <p className="mt-12 max-w-3xl text-xs leading-relaxed text-stone-400">{p.source}</p>
      </div>
    </section>
  );
}

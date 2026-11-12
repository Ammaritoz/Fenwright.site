import { site } from "@/config/site";
import { media, type MediaKey, type MediaSlot } from "@/config/media";
import { Reveal } from "@/components/Reveal";
import { StackPins } from "@/components/StackPins";

/**
 * The offer in two equal halves: leads in, and the systems that win them. Two
 * full-width panels that stack as you scroll, so neither reads as the add-on.
 */
export function Services() {
  const w = site.services;
  return (
    <section id="services" className="section bg-ink pb-24 pt-28 text-white sm:pb-36 sm:pt-36">
      <div className="container-px">
        <Reveal className="mx-auto max-w-4xl text-center">
          <h2 className="h-section">{w.headline}</h2>
        </Reveal>

        <StackPins containerId="services-stack" />
        <div id="services-stack" className="mt-16 space-y-6 sm:mt-20">
          {w.groups.map((g, i) => {
            const slot: MediaSlot = media[g.image as MediaKey];
            const flip = i % 2 === 1;
            return (
              <article
                key={g.title}
                // Sticky on every screen size; StackPins sets each panel's top.
                data-stack=""
                style={{ top: `calc(5.5rem + ${i * 1.5}rem)` }}
                className={`sticky overflow-hidden rounded-[2rem] ${flip ? "bg-ink-600" : "bg-ink-700"}`}
              >
                <div className="grid items-stretch gap-10 p-6 sm:p-10 lg:grid-cols-2 lg:gap-16 lg:p-14">
                  <div className={flip ? "lg:order-2" : ""}>
                    <p className="text-lg text-white/70">{g.kicker}</p>
                    <h3 className="h-card mt-4">{g.title}</h3>
                    <p className="mt-4 max-w-md text-lg font-light text-white/80">{g.lead}</p>

                    <ul className="mt-10">
                      {g.bullets.map((b) => (
                        <li key={b.title} className="border-t border-white/15 py-5">
                          <h4 className="font-sans text-base font-medium tracking-normal text-white">{b.title}</h4>
                          <p className="mt-1.5 text-[0.98rem] leading-relaxed text-white/70">{b.body}</p>
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div className={`relative min-h-[16rem] overflow-hidden rounded-2xl bg-ink ${flip ? "lg:order-1" : ""}`}>
                    <img
                      src={slot.image}
                      alt=""
                      loading="lazy"
                      className="absolute inset-0 h-full w-full object-cover"
                      style={{ objectPosition: slot.focus ?? "50% 50%" }}
                    />
                    <div className="absolute inset-0 bg-[#0C2F5E] opacity-30 mix-blend-color" aria-hidden="true" />
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      </div>
    </section>
  );
}

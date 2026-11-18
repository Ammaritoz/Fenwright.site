import { site } from "@/config/site";
import { media } from "@/config/media";
import { Reveal } from "@/components/Reveal";
import { SampleReport } from "@/components/SampleReport";
import { Backdrop } from "@/components/Backdrop";
import { Arrow } from "@/components/Arrow";
import { Roll } from "@/components/Roll";
import { Deck, type DeckCard } from "@/components/Deck";

/** The free first look: what you send and get, beside an example report, then the call to act. */
export function FirstLook() {
  const f = site.firstLook;
  const cards: DeckCard[] = [
    ...f.steps.map((s) => ({ kind: "text" as const, title: s.title, body: s.body })),
    { kind: "photo", image: media.firmware.image, caption: f.photoCaption },
  ];
  return (
    <section id="first-look" className="section bg-ink py-24 text-white sm:py-36">
      <div className="container-px">
        <div className="grid items-center gap-14 lg:grid-cols-[1.1fr_0.9fr] lg:gap-20">
          <Reveal>
            <h2 className="h-section">{f.headline}</h2>
            <p className="mt-6 max-w-xl text-lg font-light leading-relaxed text-white/80">{f.lead}</p>
            <div className="mt-8 flex flex-wrap items-center gap-4">
              <a href={f.sample.href} target="_blank" rel="noopener" className="btn-ghost-onink">
                <Roll>
                  {f.sample.label}
                  <Arrow />
                </Roll>
              </a>
              <span className="text-sm text-white/60">{f.sample.note}</span>
            </div>
          </Reveal>
          <Reveal delay={120}>
            <SampleReport tone="dark" />
          </Reveal>
        </div>

        <Reveal className="mt-20 sm:mt-28">
          <Deck cards={cards} label={f.headline} />
        </Reveal>

        <Reveal className="relative isolate mt-20 flex min-h-[24rem] flex-col justify-end overflow-hidden rounded-[2rem] p-8 sm:mt-28 sm:p-12 lg:p-14">
          <Backdrop slot={media.field} fade />
          <h3 className="h-card max-w-xl">{f.banner.headline}</h3>
          <p className="mt-4 max-w-md text-white/80">{f.banner.note}</p>
          <div className="mt-8">
            <a href={f.cta.href} className="btn-onink">
              <Roll>
                {f.cta.label}
                <Arrow />
              </Roll>
            </a>
          </div>
        </Reveal>
      </div>
    </section>
  );
}

import { site } from "@/config/site";
import { media } from "@/config/media";
import { Reveal } from "@/components/Reveal";
import { Arrow } from "@/components/Arrow";
import { Roll } from "@/components/Roll";
import { Deck, type DeckCard } from "@/components/Deck";

export function HowItWorks() {
  const h = site.howItWorks;
  const cards: DeckCard[] = [
    { kind: "photo", image: media.process.image, caption: h.photoCaption },
    ...h.steps.map((s) => ({ kind: "text" as const, title: s.title, body: s.body })),
  ];
  return (
    <section id="how-it-works" className="section bg-paper-alt py-24 text-ink sm:py-36">
      <div className="container-px">
        <Reveal className="flex flex-col justify-between gap-8 lg:flex-row lg:items-end">
          <div className="max-w-2xl">
            <p className="kicker text-accent">{h.kicker}</p>
            <h2 className="h-section mt-6">{h.headline}</h2>
          </div>
          <a href={site.nav.cta.href} className="btn-cta !border-ink shrink-0 self-start lg:self-auto">
            <Roll>
              {site.nav.cta.label}
              <Arrow />
            </Roll>
          </a>
        </Reveal>

        <Reveal className="mt-14 sm:mt-16">
          <Deck cards={cards} tone="light" label={h.headline} />
        </Reveal>
      </div>
    </section>
  );
}

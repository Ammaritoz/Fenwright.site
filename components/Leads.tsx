import { site } from "@/config/site";
import { roofing } from "@/config/roofing";
import { media } from "@/config/media";
import { Reveal } from "@/components/Reveal";
import { SampleLead } from "@/components/SampleLead";
import { Backdrop } from "@/components/Backdrop";
import { Arrow } from "@/components/Arrow";
import { Roll } from "@/components/Roll";
import { Deck, type DeckCard } from "@/components/Deck";

/** The "Get" half in detail: how a lead reaches you, beside one, then the trade we run it for. */
export function Leads() {
  const l = site.leads;
  const cards: DeckCard[] = [
    ...l.steps.map((s) => ({ kind: "text" as const, title: s.title, body: s.body })),
    { kind: "photo", image: media.enquiries.image, caption: l.photoCaption },
  ];
  return (
    <section id="leads" className="section bg-ink py-24 text-white sm:py-36">
      <div className="container-px">
        <div className="grid items-center gap-14 lg:grid-cols-[1.1fr_0.9fr] lg:gap-20">
          <Reveal>
            <h2 className="h-section">{l.headline}</h2>
            <p className="mt-6 max-w-xl text-lg font-light leading-relaxed text-white/80">{l.lead}</p>
          </Reveal>
          <Reveal delay={120}>
            <SampleLead tone="dark" />
          </Reveal>
        </div>

        <Reveal className="mt-20 sm:mt-28">
          <Deck cards={cards} label={l.headline} />
        </Reveal>

        <Reveal className="relative isolate mt-20 flex min-h-[24rem] flex-col justify-end overflow-hidden rounded-[2rem] p-8 sm:mt-28 sm:p-12 lg:p-14">
          <Backdrop slot={media.roofing} fade />
          <h3 className="h-card max-w-xl">{roofing.meta.title}</h3>
          <p className="mt-4 max-w-md text-white/80">{l.note}</p>
          <div className="mt-8">
            <a href={l.cta.href} className="btn-onink">
              <Roll>
                {l.cta.label}
                <Arrow />
              </Roll>
            </a>
          </div>
        </Reveal>
      </div>
    </section>
  );
}

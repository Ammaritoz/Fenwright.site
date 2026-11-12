import { site } from "@/config/site";
import { ScrollText } from "@/components/ScrollText";

/** The opening paragraph, set large and light, lit word by word on scroll. */
export function Statement() {
  return (
    <section className="bg-ink pt-28 text-white sm:pt-40">
      <div className="container-px">
        <div className="mx-auto max-w-5xl text-center">
          <p className="kicker text-accent-300">{site.statement.kicker}</p>
          <ScrollText text={site.hero.subhead} className="lead-xl mt-8" />
        </div>
      </div>
    </section>
  );
}

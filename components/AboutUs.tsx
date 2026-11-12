import { site } from "@/config/site";
import { Reveal } from "@/components/Reveal";

const a = site.about;

function waLink(number: string, preset: string) {
  return `https://wa.me/${number.replace(/[^\d]/g, "")}?text=${encodeURIComponent(preset)}`;
}

const linkClass =
  "inline-flex items-center gap-1.5 border-b border-ink/30 pb-0.5 text-sm font-medium text-ink transition-colors hover:border-accent hover:text-accent";

function External() {
  return (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M7 17 17 7M9 7h8v8" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

/**
 * Leadership, set as a typographic roster: name, role, what they do, how to
 * reach them. No portraits until there are real ones to show.
 */
export function AboutUs() {
  return (
    <section id="about" className="section bg-paper py-24 text-ink sm:py-36">
      <div className="container-px">
        <Reveal className="max-w-3xl">
          <p className="kicker text-accent">{a.kicker}</p>
          <h2 className="h-section mt-6">{a.headline}</h2>
          <p className="mt-6 max-w-xl text-lg leading-relaxed text-stone-600">{a.subhead}</p>
        </Reveal>

        <ul className="mt-16 border-b border-stone-300">
          {a.people.map((p, i) => (
            <Reveal
              as="li"
              key={p.name}
              delay={i * 100}
              className="grid gap-x-12 gap-y-4 border-t border-stone-300 py-10 lg:grid-cols-[1fr_1.3fr_auto] lg:items-start"
            >
              <div>
                <h3 className="font-display text-3xl sm:text-4xl">{p.name}</h3>
                <p className="kicker mt-3 text-stone-500">{p.role}</p>
              </div>
              <p className="max-w-xl text-lg leading-relaxed text-stone-600">{p.bio}</p>
              <div className="flex gap-6 lg:flex-col lg:items-end lg:gap-3">
                {p.linkedin && (
                  <a href={p.linkedin} target="_blank" rel="noopener noreferrer" className={linkClass}>
                    LinkedIn
                    <External />
                    <span className="sr-only">, {p.name}</span>
                  </a>
                )}
                {a.whatsapp && (
                  <a
                    href={waLink(a.whatsapp, a.whatsappPreset)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={linkClass}
                  >
                    WhatsApp
                    <External />
                    <span className="sr-only">, message {p.name.split(" ")[0]}</span>
                  </a>
                )}
              </div>
            </Reveal>
          ))}
        </ul>
      </div>
    </section>
  );
}

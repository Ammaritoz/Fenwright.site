import { site } from "@/config/site";
import { Reveal } from "@/components/Reveal";
import { WaveRule } from "@/components/Logo";

const a = site.about;

function waLink(number: string, preset: string) {
  return `https://wa.me/${number.replace(/[^\d]/g, "")}?text=${encodeURIComponent(preset)}`;
}

/** Simple inline brand glyphs so no icon package is added. */
function LinkedInIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M4.98 3.5C4.98 4.88 3.87 6 2.5 6S0 4.88 0 3.5 1.12 1 2.5 1s2.48 1.12 2.48 2.5zM.22 8.1h4.56V23H.22zM8.4 8.1h4.37v2.03h.06c.61-1.15 2.1-2.37 4.32-2.37 4.62 0 5.47 3.04 5.47 6.99V23h-4.56v-7.24c0-1.73-.03-3.95-2.41-3.95-2.41 0-2.78 1.88-2.78 3.82V23H8.4z" />
    </svg>
  );
}

function WhatsAppIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M12.04 2a9.9 9.9 0 0 0-8.5 14.98L2 22l5.16-1.5A9.9 9.9 0 1 0 12.04 2zm0 18.02a8.1 8.1 0 0 1-4.13-1.13l-.3-.18-3.06.89.9-2.98-.2-.31a8.12 8.12 0 1 1 6.79 3.71zm4.45-6.08c-.24-.12-1.44-.71-1.66-.79-.22-.08-.39-.12-.55.12-.16.24-.63.79-.77.95-.14.16-.28.18-.53.06-.24-.12-1.03-.38-1.96-1.21-.72-.64-1.21-1.44-1.35-1.68-.14-.24-.02-.37.1-.5.11-.11.24-.28.37-.42.12-.14.16-.24.24-.4.08-.16.04-.31-.02-.43-.06-.12-.55-1.32-.75-1.81-.2-.48-.4-.41-.55-.42h-.47c-.16 0-.43.06-.65.31-.22.24-.85.83-.85 2.03s.87 2.36 1 2.52c.12.16 1.72 2.62 4.16 3.68.58.25 1.04.4 1.39.51.58.19 1.12.16 1.54.1.47-.07 1.44-.59 1.64-1.16.2-.57.2-1.05.14-1.16-.06-.1-.22-.16-.46-.28z" />
    </svg>
  );
}

/**
 * SectionHead has no kicker slot (title + optional lead only), and this section
 * needs kicker + headline + subhead, so the head is hand-rolled here, mirroring
 * the kicker/headline/body pattern used across config (e.g. site.services,
 * site.howItWorks) and the type scale SectionHead uses elsewhere.
 */
export function AboutUs() {
  return (
    <section id="about" className="section bg-paper-alt">
      <div className="container-px py-20 sm:py-28">
        <Reveal>
          <p className="text-sm font-semibold uppercase tracking-[0.14em] text-stone-500">{a.kicker}</p>
          <h2 className="mt-4 max-w-2xl text-4xl text-ink sm:text-5xl">{a.headline}</h2>
          <p className="mt-5 max-w-xl text-lg leading-relaxed text-stone-600">{a.subhead}</p>
        </Reveal>

        <div className="mt-14 grid gap-6 sm:grid-cols-2">
          {a.people.map((p, i) => (
            <Reveal key={p.name} delay={i * 110}>
              <article className="flex h-full flex-col rounded-xl2 border border-stone-200 bg-paper p-8 shadow-card">
                <div className="flex h-20 w-20 items-center justify-center rounded-full bg-ink">
                  <span className="font-display text-2xl font-semibold text-paper">{p.initials}</span>
                </div>
                <h3 className="mt-6 text-2xl text-ink">{p.name}</h3>
                <p className="mt-1 text-sm font-semibold uppercase tracking-[0.12em] text-accent">{p.role}</p>
                <WaveRule className="mt-4 h-2 w-24 self-start" />
                <p className="mt-4 flex-1 leading-relaxed text-stone-600">{p.bio}</p>
                <div className="mt-6 flex gap-3">
                  {p.linkedin && (
                    <a
                      href={p.linkedin}
                      target="_blank"
                      rel="noopener noreferrer"
                      aria-label={`${p.name} on LinkedIn`}
                      className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-stone-300 text-ink transition hover:border-ink hover:bg-ink hover:text-paper"
                    >
                      <LinkedInIcon />
                    </a>
                  )}
                  {a.whatsapp && (
                    <a
                      href={waLink(a.whatsapp, a.whatsappPreset)}
                      target="_blank"
                      rel="noopener noreferrer"
                      aria-label={`Message ${p.name.split(" ")[0]} on WhatsApp`}
                      className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-stone-300 text-ink transition hover:border-ink hover:bg-ink hover:text-paper"
                    >
                      <WhatsAppIcon />
                    </a>
                  )}
                </div>
              </article>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}

import Link from "next/link";
import { notFound } from "next/navigation";
import { getClient, visibleDocs } from "@/content/clients";
import { PortalNav } from "@/components/portal/PortalNav";
import { WaveRule } from "@/components/Logo";
import { site } from "@/config/site";

/**
 * The client's own index.
 *
 * Split into what they can read now and what is still to come. An engagement
 * runs over months, so a client who signed on Monday would otherwise be looking
 * at a Delivery Guide and a Monthly Report for work that has not happened. The
 * upcoming list is not just an omission: it tells them what they are getting.
 */
export default function PortalIndexPage({ params }: { params: { client: string } }) {
  const client = getClient(params.client);
  if (!client) notFound();

  const { live, upcoming } = visibleDocs(client);

  return (
    <>
      <PortalNav clientName={client.business.name} clientSlug={client.slug} />
      <main id="main" className="flex-1 py-12 sm:py-16">
        <div className="container-px">
          <div className="mx-auto max-w-3xl">
            <header>
              <p className="text-[0.7rem] uppercase tracking-[0.18em] text-stone-400">
                Client documents
              </p>
              <h1 className="mt-3 font-display text-[2rem] font-bold leading-[1.05] text-ink sm:text-[2.6rem]">
                {client.business.name}
              </h1>
              <p className="mt-4 max-w-xl text-lg leading-relaxed text-stone-600">
                Everything we have prepared for you, in one place. Each document opens in
                your browser and saves as a PDF if you need a copy for your records.
              </p>
              <WaveRule className="mt-8 h-2 w-32 opacity-60" />
            </header>

            {upcoming.length > 0 && (
              <h2 className="mt-10 text-[0.7rem] font-semibold uppercase tracking-[0.16em] text-stone-400">
                Available now
              </h2>
            )}

            <ul className={`space-y-3 ${upcoming.length > 0 ? "mt-4" : "mt-10"}`}>
              {live.map((doc) => (
                <li key={doc.slug}>
                  <Link
                    href={`/portal/${client.slug}/${doc.slug}`}
                    className="group flex items-center justify-between gap-5 rounded-xl border border-stone-200 bg-white px-5 py-4 shadow-tight transition hover:-translate-y-0.5 hover:border-stone-300 hover:shadow-card"
                  >
                    <span className="min-w-0">
                      <span className="block font-display text-lg font-semibold text-ink">
                        {doc.title}
                      </span>
                      <span className="mt-0.5 block text-sm leading-relaxed text-stone-500">
                        {doc.blurb}
                      </span>
                    </span>
                    <svg
                      width="20"
                      height="20"
                      viewBox="0 0 24 24"
                      fill="none"
                      aria-hidden="true"
                      className="shrink-0 text-stone-400 transition group-hover:translate-x-0.5 group-hover:text-accent"
                    >
                      <path
                        d="M9 6l6 6-6 6"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                  </Link>
                </li>
              ))}
            </ul>

            {upcoming.length > 0 && (
              <>
                <h2 className="mt-12 text-[0.7rem] font-semibold uppercase tracking-[0.16em] text-stone-400">
                  Coming later
                </h2>
                <ul className="mt-4 space-y-3">
                  {upcoming.map((doc) => (
                    <li
                      key={doc.slug}
                      className="flex items-center justify-between gap-5 rounded-xl border border-dashed border-stone-300 px-5 py-4"
                    >
                      <span className="min-w-0">
                        <span className="block font-display text-lg font-semibold text-stone-500">
                          {doc.title}
                        </span>
                        <span className="mt-0.5 block text-sm leading-relaxed text-stone-400">
                          {doc.blurb}
                        </span>
                      </span>
                      {doc.expected && (
                        <span className="shrink-0 rounded-full bg-stone-100 px-3 py-1 text-[0.7rem] font-medium text-stone-500">
                          {doc.expected}
                        </span>
                      )}
                    </li>
                  ))}
                </ul>
              </>
            )}

            <p className="mt-10 text-sm leading-relaxed text-stone-500">
              Something missing or wrong? Email{" "}
              <a
                href={`mailto:${site.legal.contactEmail}`}
                className="font-medium text-accent-700 underline-offset-4 hover:underline"
              >
                {site.legal.contactEmail}
              </a>
              .
            </p>
          </div>
        </div>
      </main>
    </>
  );
}

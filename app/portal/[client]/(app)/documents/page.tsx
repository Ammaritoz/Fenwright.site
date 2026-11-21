import Link from "next/link";
import { notFound } from "next/navigation";
import { getClient, visibleDocs } from "@/content/clients";
import { night } from "@/components/portal/night";
import { site } from "@/config/site";

/**
 * Every document prepared for the client. The dashboard (../page.tsx) is
 * the landing page; this is the filing cabinet behind it.
 *
 * Split into what they can read now and what is still to come. An engagement
 * runs over months, so a client who signed on Monday would otherwise be looking
 * at a Delivery Guide and a Monthly Report for work that has not happened. The
 * upcoming list is not just an omission: it tells them what they are getting.
 */

function DocIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M7 3.5h6.5l4.5 4.5v11.5a1 1 0 01-1 1H7a1 1 0 01-1-1v-15a1 1 0 011-1z" stroke="currentColor" strokeWidth="1.7" strokeLinejoin="round" />
      <path d="M13 3.5V8h5" stroke="currentColor" strokeWidth="1.7" strokeLinejoin="round" />
    </svg>
  );
}

export default function DocumentsPage({ params }: { params: { client: string } }) {
  const client = getClient(params.client);
  if (!client) notFound();

  const { live, upcoming } = visibleDocs(client);

  return (
    <div className="mx-auto max-w-[52rem]">
      <header className="mb-7">
        <h1 className={night.h1}>Documents</h1>
        <p className="mt-3 max-w-xl text-[0.86rem] leading-relaxed text-night-dim">
          Everything we have prepared for you. Each document opens in your browser and saves as a PDF if you need a
          copy for your records.
        </p>
      </header>

      <section className={`${night.panel} overflow-hidden`} aria-labelledby="docs-now">
        <div className="flex items-baseline justify-between px-5 pb-3 pt-4 sm:px-6">
          <h2 id="docs-now" className={night.h2}>
            Available now
          </h2>
          <span className="font-mono text-[0.75rem] text-night-mute">{live.length}</span>
        </div>
        <ul>
          {live.map((doc) => (
            <li key={doc.slug} className="border-t border-night-rule">
              <Link
                href={`/portal/${client.slug}/${doc.slug}`}
                className="group flex items-center gap-4 px-5 py-3.5 transition-colors hover:bg-night-raised/50 sm:px-6"
              >
                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-night-edge bg-night-raised text-night-dim">
                  <DocIcon />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block text-[0.9rem] text-night-text">{doc.title}</span>
                  <span className="mt-0.5 block truncate text-[0.8rem] text-night-mute">{doc.blurb}</span>
                </span>
                <svg
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  aria-hidden="true"
                  className="shrink-0 text-night-faint transition-[color,transform] group-hover:translate-x-0.5 group-hover:text-night-text"
                >
                  <path d="M9 6l6 6-6 6" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </Link>
            </li>
          ))}
        </ul>
      </section>

      {upcoming.length > 0 && (
        <section className="mt-4 overflow-hidden rounded-xl border border-dashed border-night-edge" aria-labelledby="docs-later">
          <div className="flex items-baseline justify-between px-5 pb-3 pt-4 sm:px-6">
            <h2 id="docs-later" className={night.h2}>
              Coming later
            </h2>
            <span className="font-mono text-[0.75rem] text-night-mute">{upcoming.length}</span>
          </div>
          <ul>
            {upcoming.map((doc) => (
              <li key={doc.slug} className="flex items-center gap-4 border-t border-night-rule px-5 py-3.5 sm:px-6">
                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-dashed border-night-edge text-night-faint">
                  <DocIcon />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block text-[0.9rem] text-night-dim">{doc.title}</span>
                  <span className="mt-0.5 block truncate text-[0.8rem] text-night-mute">{doc.blurb}</span>
                </span>
                {doc.expected && <span className="shrink-0 font-mono text-[0.72rem] text-night-mute">{doc.expected}</span>}
              </li>
            ))}
          </ul>
        </section>
      )}

      <p className="mt-6 text-[0.8rem] text-night-mute">
        Something missing or wrong? Email{" "}
        <a href={`mailto:${site.legal.contactEmail}`} className="text-night-dim underline-offset-4 hover:text-night-text hover:underline">
          {site.legal.contactEmail}
        </a>
        .
      </p>
    </div>
  );
}

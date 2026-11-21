import { notFound } from "next/navigation";
import { getClient } from "@/content/clients";
import { Logo } from "@/components/Logo";
import { PortalMobileMenu, PortalNavLinks } from "@/components/portal/PortalNavLinks";
import { site } from "@/config/site";

/**
 * The portal app shell: a sidebar and top bar around every unlocked page
 * (dashboard, findings, documents and each document).
 *
 * Quiet chrome on purpose: plain white surfaces and hairlines, so the colour
 * on the page belongs to the content (the headline figure, the things that
 * need the client). Same rule as the marketing site's "flat by design".
 *
 * In a route group so the unlock page, which sits beside it, never renders
 * the client's name or navigation. Access is still decided by middleware.ts,
 * not here: a layout is not a security boundary.
 *
 * Print: the chrome disappears and documents print as before.
 */
export default function PortalAppLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: { client: string };
}) {
  const client = getClient(params.client);
  if (!client) notFound();
  const email = site.legal.contactEmail;

  return (
    <div className="flex min-h-screen flex-1">
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-64 flex-col border-r border-stone-200 bg-white px-4 pb-6 pt-5 print:hidden lg:flex">
        <div className="px-2">
          <Logo className="h-7" />
        </div>
        <div className="mt-6 px-2">
          <p className="text-xs text-stone-400">Client</p>
          <p className="mt-0.5 truncate text-sm font-medium text-ink">{client.business.name}</p>
        </div>
        <nav aria-label="Portal" className="mt-6">
          <PortalNavLinks slug={client.slug} />
        </nav>
        <div className="mt-auto px-2 text-xs leading-relaxed text-stone-500">
          <p>Questions, or something looks wrong?</p>
          <a href={`mailto:${email}`} className="font-medium text-accent-700 underline-offset-4 hover:underline">
            {email}
          </a>
        </div>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col lg:pl-64 print:pl-0">
        <header className="sticky top-0 z-20 flex h-14 items-center justify-between gap-3 border-b border-stone-200 bg-white px-4 print:hidden sm:px-6 lg:px-8">
          <div className="flex min-w-0 items-center gap-3">
            <span className="lg:hidden">
              <Logo className="h-6" />
            </span>
            <span aria-hidden="true" className="h-5 w-px shrink-0 bg-stone-200 lg:hidden" />
            <span className="truncate text-sm font-medium text-stone-600 lg:hidden">{client.business.name}</span>
            <span className="hidden text-sm text-stone-500 lg:inline">CRA vulnerability response</span>
          </div>
          <PortalMobileMenu slug={client.slug} contactEmail={email} />
        </header>

        <main id="main" className="flex-1 px-4 pb-16 pt-8 print:p-0 sm:px-6 lg:px-8">
          {children}
        </main>
      </div>
    </div>
  );
}

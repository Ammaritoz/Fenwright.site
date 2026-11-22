import { notFound } from "next/navigation";
import { getClient, visibleDocs } from "@/content/clients";
import { Logo } from "@/components/Logo";
import { PortalCrumb, PortalMobileMenu, PortalNavLinks } from "@/components/portal/PortalNavLinks";
import { getDashboard } from "@/lib/portal/dashboard";
import { getMessages } from "@/lib/portal/message-data";
import { freshReplies, threadsByTopic } from "@/lib/portal/messages";
import { formatAgo, formatDateTime } from "@/lib/portal/format";
import { productColor, productLabel } from "@/lib/portal/product-colors";
import { site } from "@/config/site";

/**
 * The portal app shell: a sidebar and top bar around every unlocked page
 * (dashboard, findings, documents and each document).
 *
 * "Night shift": a near-black workspace with quiet chrome, so colour on the
 * page belongs to the content (a running deadline, a status). Documents still
 * render on a white sheet inside it, because they get printed and filed.
 *
 * The sidebar's product list and open count come from the same getDashboard()
 * call the page makes (React cache() dedupes it within the request). If Neon
 * cannot be read the sidebar simply leaves them out.
 *
 * In a route group so the unlock page, which sits beside it, never renders
 * the client's name or navigation. Access is still decided by middleware.ts,
 * not here: a layout is not a security boundary.
 *
 * Print: the chrome disappears and documents print as before.
 */
export default async function PortalAppLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: { client: string };
}) {
  const client = getClient(params.client);
  if (!client) notFound();
  const email = site.legal.contactEmail;
  const [result, messages] = await Promise.all([getDashboard(client.slug), getMessages(client.slug)]);
  const replies = freshReplies(threadsByTopic(messages), new Date()).length;
  const data = result.ok ? result.data : null;
  const open = data ? Math.max(0, data.totals.underInvestigation + data.totals.unassessed) : null;
  const { live, upcoming } = visibleDocs(client);
  // Titles for the breadcrumb; the client sees all of these in Documents anyway.
  const docTitles = Object.fromEntries([...live, ...upcoming].map((d) => [d.slug, d.title]));
  const now = new Date();

  return (
    <div className="flex min-h-screen flex-1">
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-64 flex-col gap-7 overflow-y-auto border-r border-night-rule bg-night-side px-3.5 pb-5 pt-5 print:hidden lg:flex">
        <div className="px-2">
          <Logo variant="paper" className="h-6" />
        </div>

        <nav aria-label="Portal">
          <p className="mb-1.5 px-2.5 text-[0.78rem] text-night-mute">Workspace</p>
          <PortalNavLinks slug={client.slug} openFindings={open} documents={live.length} replies={replies} />
        </nav>

        {data && data.products.length > 0 && (
          <div>
            <p className="mb-1.5 px-2.5 text-[0.78rem] text-night-mute">Products</p>
            <ul className="space-y-0.5">
              {data.products.map((p, i) => (
                <li
                  key={productLabel(p)}
                  className="flex h-8 items-center gap-2.5 px-2.5 text-[0.84rem] text-night-dim"
                  title={`${productLabel(p)}: ${p.components.toLocaleString("en-IE")} components, last scanned ${formatDateTime(p.lastScanned)}`}
                >
                  <span aria-hidden="true" className="h-[7px] w-[7px] shrink-0 rounded-full" style={{ background: productColor(i) }} />
                  {/* The name truncates; the version never does, since it is what tells two rows apart. */}
                  <span className="min-w-0 flex-1 truncate">{p.name}</span>
                  <span className="font-mono text-[0.72rem] text-night-mute">{p.version}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        <div className="mt-auto rounded-[10px] border border-night-rule p-3">
          <p className="truncate text-[0.84rem] font-medium text-night-text">{client.business.name}</p>
          <p className="mt-1 text-xs leading-relaxed text-night-mute">Questions, or something looks wrong?</p>
          <a href={`mailto:${email}`} className="mt-0.5 block truncate text-xs text-night-dim underline-offset-4 hover:text-night-text hover:underline">
            {email}
          </a>
        </div>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col lg:pl-64 print:pl-0">
        <header className="sticky top-0 z-20 flex h-14 items-center justify-between gap-3 border-b border-night-rule bg-night/90 px-4 backdrop-blur print:hidden sm:px-6 lg:px-8">
          <div className="flex min-w-0 items-center gap-3">
            <span className="lg:hidden">
              <Logo variant="paper" className="h-5" />
            </span>
            <span className="hidden lg:inline">
              <PortalCrumb slug={client.slug} docTitles={docTitles} />
            </span>
          </div>
          <div className="flex items-center gap-3">
            {data && (
              <p className="hidden items-center gap-2 text-[0.8rem] text-night-dim sm:flex">
                <span
                  aria-hidden="true"
                  className={`h-[7px] w-[7px] rounded-full ${data.monitoring ? "bg-signal-mint shadow-[0_0_0_3px_rgba(111,214,168,0.15)]" : "bg-night-faint"}`}
                />
                {data.monitoring ? "Monitoring live" : "Onboarding"}
                <span className="font-mono text-[0.75rem] text-night-mute" title={formatDateTime(data.generatedAt)}>
                  · synced {formatAgo(data.generatedAt, now)}
                </span>
              </p>
            )}
            <PortalMobileMenu slug={client.slug} contactEmail={email} openFindings={open} documents={live.length} replies={replies} />
          </div>
        </header>

        <main id="main" className="flex-1 px-4 pb-16 pt-8 print:p-0 sm:px-6 lg:px-8">
          {children}
        </main>
      </div>
    </div>
  );
}

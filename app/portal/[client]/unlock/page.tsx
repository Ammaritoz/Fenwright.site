import { Logo } from "@/components/Logo";
import { UnlockForm } from "@/components/portal/UnlockForm";
import { site } from "@/config/site";

/**
 * The way in.
 *
 * Deliberately says nothing about who this portal belongs to. Anyone who has
 * the link but not the passcode should not learn which business it is for, so
 * there is no client name, no document list and no logo beyond our own.
 */
export default function UnlockPage({
  params,
  searchParams,
}: {
  params: { client: string };
  searchParams: { next?: string };
}) {
  return (
    <main id="main" className="flex flex-1 items-center justify-center px-5 py-16">
      <div className="w-full max-w-sm">
        <div className="flex justify-center">
          <Logo className="h-9" />
        </div>

        <div className="mt-8 rounded-xl2 border border-stone-200 bg-white p-7 shadow-card">
          <h1 className="font-display text-xl font-bold text-ink">Client documents</h1>
          <p className="mt-2 text-sm leading-relaxed text-stone-600">
            Enter the passcode we sent you. It keeps your agreement, invoices and reports
            private to your business.
          </p>

          <UnlockForm slug={params.client} next={searchParams.next ?? null} />
        </div>

        <p className="mt-6 text-center text-xs leading-relaxed text-stone-500">
          Lost your passcode? Email{" "}
          <a
            href={`mailto:${site.legal.contactEmail}`}
            className="font-medium text-accent-700 underline-offset-4 hover:underline"
          >
            {site.legal.contactEmail}
          </a>{" "}
          and we will send a new one.
        </p>
      </div>
    </main>
  );
}

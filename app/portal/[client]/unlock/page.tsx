import { Logo } from "@/components/Logo";
import { UnlockForm } from "@/components/portal/UnlockForm";
import { site } from "@/config/site";
import { night } from "@/components/portal/night";

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
          <Logo variant="paper" className="h-8" />
        </div>

        <div className={`${night.panel} mt-8 p-7`}>
          <h1 className="font-ui text-[1.15rem] font-normal tracking-[-0.01em] text-night-text">Client portal</h1>
          <p className="mt-2 text-[0.86rem] leading-relaxed text-night-dim">
            Enter the passcode we sent you. It keeps your agreement, invoices and reports private to your business.
          </p>

          <UnlockForm slug={params.client} next={searchParams.next ?? null} />
        </div>

        <p className="mt-6 text-center text-xs leading-relaxed text-night-mute">
          Lost your passcode? Email{" "}
          <a href={`mailto:${site.legal.contactEmail}`} className="text-night-dim underline-offset-4 hover:text-night-text hover:underline">
            {site.legal.contactEmail}
          </a>{" "}
          and we will send a new one.
        </p>
      </div>
    </main>
  );
}

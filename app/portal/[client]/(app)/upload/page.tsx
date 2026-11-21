import { notFound } from "next/navigation";
import { getClient } from "@/content/clients";
import { UploadForm } from "@/components/upload/UploadForm";
import { signIntakeToken } from "@/lib/intake/token";
import { r2Configured } from "@/lib/intake/r2";
import { intake } from "@/config/intake";
import { site } from "@/config/site";
import { listUploads } from "@/lib/airtable";
import { formatDateTime } from "@/lib/portal/format";

/**
 * Firmware upload, from inside the client's own portal.
 *
 * Before this, every client needed an operator to run `npm run intake:link` and
 * send them a one-off URL. Here the portal does it: the middleware has already
 * checked this client's session, so the server mints a short-lived upload token
 * for this client's slug on the spot. Nothing to run, nothing to send, and the
 * token cannot be used for anyone else's folder (the slug is baked into the
 * signature, and uploads land under intake/<slug>/ in the bucket).
 *
 * The token reaches the browser (the upload form sends it back to the API), so
 * it is deliberately short-lived: long enough for a large upload, no longer.
 */

export const dynamic = "force-dynamic";

const TOKEN_LIFETIME_SECONDS = 6 * 60 * 60;

function mintToken(slug: string): string | null {
  if (!intake.publicKeyPem || !r2Configured()) return null;
  try {
    return signIntakeToken(slug, Math.floor(Date.now() / 1000) + TOKEN_LIFETIME_SECONDS);
  } catch {
    // INTAKE_LINK_SECRET missing or the slug is not a valid folder name.
    return null;
  }
}

export default async function PortalUploadPage({ params }: { params: { client: string } }) {
  const client = getClient(params.client);
  if (!client) notFound();

  const token = mintToken(client.slug);
  const received = await listUploads(client.slug);
  const email = site.legal.contactEmail;

  return (
    <div className="mx-auto max-w-2xl py-2 sm:py-4">
      <header className="mb-8">
        <p className="text-sm text-stone-500">{client.business.name}</p>
        <h1 className="mt-2 font-display text-[2rem] font-semibold leading-[1.05] text-ink sm:text-[2.4rem]">
          Send your firmware
        </h1>
        <p className="mt-3 text-stone-600">
          Upload the firmware image or build files for each product and version we are watching.
          We need them to build your ingredients lists.
        </p>
      </header>

      {received.length > 0 && (
        <section className="mb-5 rounded-2xl border border-accent/40 bg-accent-soft/60 p-5 sm:p-6">
          <p className="font-display text-base font-semibold text-ink">
            We have received {received.length} {received.length === 1 ? "file" : "files"} from you
          </p>
          <ul className="mt-2 space-y-1 text-sm text-stone-600">
            {received.slice(0, 5).map((u, i) => (
              <li key={`${u.at}-${i}`} className="tabular-nums">
                {u.at ? formatDateTime(u.at) : "Received"}
                {u.bytes > 0 && <span className="text-stone-400">{" · "}{(u.bytes / 1048576).toFixed(1)} MB</span>}
              </li>
            ))}
          </ul>
          <p className="mt-2 text-sm text-stone-600">
            Send more below if you have other products or firmware versions for us to watch.
          </p>
        </section>
      )}

      <section className="rounded-2xl border border-stone-200 bg-white p-6 shadow-card sm:p-7">
        {token ? (
          <>
            <p className="text-sm leading-relaxed text-stone-600">
              Your file is encrypted in this browser before it is sent. Only Fenwright can open it,
              and we handle it as set out in your agreement.
            </p>
            <UploadForm token={token} publicKeyPem={intake.publicKeyPem} maxBytes={intake.maxFileBytes} />
          </>
        ) : (
          <p className="text-sm leading-relaxed text-stone-600">
            Uploads are not available just now. Email{" "}
            <a href={`mailto:${email}`} className="font-medium text-accent-700 hover:underline">
              {email}
            </a>{" "}
            and we will arrange another way to send it.
          </p>
        )}
      </section>
    </div>
  );
}

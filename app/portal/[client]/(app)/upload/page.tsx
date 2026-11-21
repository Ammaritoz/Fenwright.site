import { notFound } from "next/navigation";
import { getClient } from "@/content/clients";
import { UploadForm } from "@/components/upload/UploadForm";
import { signIntakeToken } from "@/lib/intake/token";
import { r2Configured } from "@/lib/intake/r2";
import { intake } from "@/config/intake";
import { site } from "@/config/site";
import { listUploads } from "@/lib/airtable";
import { formatDateTime } from "@/lib/portal/format";
import { night } from "@/components/portal/night";

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

/** Small files in KB, so a 5 KB test file is not shown as "0.0 MB". */
function formatSize(bytes: number): string {
  if (bytes < 1024 * 1024) return `${Math.max(1, Math.round(bytes / 1024))} KB`;
  return `${(bytes / 1048576).toFixed(1)} MB`;
}

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
    <div className="mx-auto max-w-[44rem]">
      <header className="mb-7">
        <h1 className={night.h1}>Send your firmware</h1>
        <p className="mt-3 text-[0.86rem] leading-relaxed text-night-dim">
          Upload the firmware image or build files for each product and version we are watching. We need them to
          build your ingredients lists.
        </p>
      </header>

      <section className={`${night.panel} px-5 py-5 sm:px-6`} aria-labelledby="upload-title">
        <h2 id="upload-title" className={night.h2}>
          New upload
        </h2>
        {token ? (
          <>
            <p className="mt-2 text-[0.84rem] leading-relaxed text-night-mute">
              Your file is encrypted in this browser before it is sent. Only Fenwright can open it, and we handle it as
              set out in your agreement.
            </p>
            <UploadForm token={token} publicKeyPem={intake.publicKeyPem} maxBytes={intake.maxFileBytes} tone="night" />
          </>
        ) : (
          <p className="mt-2 text-[0.84rem] leading-relaxed text-night-dim">
            Uploads are not available just now. Email{" "}
            <a href={`mailto:${email}`} className="text-night-text underline-offset-4 hover:underline">
              {email}
            </a>{" "}
            and we will arrange another way to send it.
          </p>
        )}
      </section>

      {received.length > 0 && (
        <section className={`${night.panel} mt-4 overflow-hidden`} aria-labelledby="received-title">
          <div className="flex items-baseline justify-between px-5 pb-3 pt-4 sm:px-6">
            <h2 id="received-title" className={night.h2}>
              Received from you
            </h2>
            <span className="font-mono text-[0.75rem] text-night-mute">{received.length}</span>
          </div>
          <ul>
            {received.slice(0, 5).map((u, i) => (
              <li
                key={`${u.at}-${i}`}
                className="flex items-center justify-between gap-4 border-t border-night-rule px-5 py-3 font-mono text-[0.78rem] sm:px-6"
              >
                <span className="inline-flex items-center gap-2 text-night-text">
                  <span aria-hidden="true" className="h-[7px] w-[7px] rounded-full bg-signal-mint" />
                  {u.at ? formatDateTime(u.at) : "Received"}
                </span>
                {u.bytes > 0 && <span className="text-night-mute">{formatSize(u.bytes)}</span>}
              </li>
            ))}
          </ul>
          <p className="border-t border-night-rule px-5 py-3 text-[0.8rem] text-night-mute sm:px-6">
            Send more above if you have other products or firmware versions for us to watch.
          </p>
        </section>
      )}
    </div>
  );
}

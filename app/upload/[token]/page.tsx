import type { Metadata } from "next";
import { Logo } from "@/components/Logo";
import { UploadForm } from "@/components/upload/UploadForm";
import { verifyIntakeToken } from "@/lib/intake/token";
import { r2Configured } from "@/lib/intake/r2";
import { intake } from "@/config/intake";
import { site } from "@/config/site";

/**
 * Where a prospect sends firmware for a First Look.
 *
 * The URL is the credential (a signed, expiring token), so this page is kept
 * out of search and analytics the same way the portal is. It names nobody: a
 * stranger holding a link learns nothing about which business it is for.
 */

export const metadata: Metadata = {
  title: "Secure upload",
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";

function linkState(token: string): "ok" | "expired" | "off" {
  if (!intake.publicKeyPem || !r2Configured()) return "off";
  try {
    return verifyIntakeToken(decodeURIComponent(token)) ? "ok" : "expired";
  } catch {
    return "off";
  }
}

export default function UploadPage({ params }: { params: { token: string } }) {
  const state = linkState(params.token);
  const email = site.legal.contactEmail;

  return (
    <main id="main" className="flex flex-1 items-center justify-center px-5 py-16">
      <div className="w-full max-w-md">
        <div className="flex justify-center">
          <Logo className="h-9" />
        </div>

        <div className="mt-8 rounded-xl2 border border-stone-200 bg-white p-7 shadow-card">
          <h1 className="font-display text-xl font-bold text-ink">Send your firmware</h1>

          {state === "ok" && (
            <>
              <p className="mt-2 text-sm leading-relaxed text-stone-600">
                Your file is encrypted in this browser before it is sent. Only Fenwright can open it,
                and we delete it after your First Look, as set out in our agreement.
              </p>
              <UploadForm
                token={decodeURIComponent(params.token)}
                publicKeyPem={intake.publicKeyPem}
                maxBytes={intake.maxFileBytes}
              />
            </>
          )}
          {state === "expired" && (
            <p className="mt-2 text-sm leading-relaxed text-stone-600">
              This upload link has expired or is not valid. Email us and we will send a new one.
            </p>
          )}
          {state === "off" && (
            <p className="mt-2 text-sm leading-relaxed text-stone-600">
              Uploads are not available right now. Please email us and we will arrange another way to send it.
            </p>
          )}
        </div>

        <p className="mt-6 text-center text-xs leading-relaxed text-stone-500">
          Questions? Email{" "}
          <a href={`mailto:${email}`} className="font-medium text-accent-700 underline-offset-4 hover:underline">
            {email}
          </a>
          .
        </p>
      </div>
    </main>
  );
}

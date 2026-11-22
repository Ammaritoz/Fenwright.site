import { notFound } from "next/navigation";
import { getClient } from "@/content/clients";
import { BookSupportCall } from "@/components/portal/BookSupportCall";
import { night } from "@/components/portal/night";
import { site } from "@/config/site";

/**
 * Book a call with Fenwright from inside the portal, for when something looks
 * wrong or needs talking through. The reason is asked first and travels into
 * the Cal.com booking, so the call is prepared before it starts.
 */
export default function CallPage({ params }: { params: { client: string } }) {
  const client = getClient(params.client);
  if (!client) notFound();
  const { name, email } = client.business.contact;

  return (
    <div className="mx-auto max-w-[52rem]">
      <header className="mb-7">
        <h1 className={night.h1}>Book a call</h1>
        <p className="mt-3 max-w-xl text-[0.86rem] leading-relaxed text-night-dim">
          Tell us what it is about, then pick a time. If a report deadline is running, say so: we treat those first. For
          anything that can wait, email{" "}
          <a href={`mailto:${site.legal.contactEmail}`} className="text-night-text underline-offset-4 hover:underline">
            {site.legal.contactEmail}
          </a>
          .
        </p>
      </header>
      <BookSupportCall name={name} email={email} />
    </div>
  );
}

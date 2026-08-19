import { notFound } from "next/navigation";
import { getClient, getDoc } from "@/content/clients";
import { PortalNav } from "@/components/portal/PortalNav";
import { Agreement } from "@/components/portal/docs/Agreement";
import { Welcome } from "@/components/portal/docs/Welcome";
import { Invoice } from "@/components/portal/docs/Invoice";
import { Brief } from "@/components/portal/docs/Brief";
import { Delivery } from "@/components/portal/docs/Delivery";
import { Report } from "@/components/portal/docs/Report";
import { PaymentDetails } from "@/components/portal/docs/PaymentDetails";
import { ThankYou } from "@/components/portal/docs/ThankYou";
import { Feedback } from "@/components/portal/docs/Feedback";
import { Packages } from "@/components/portal/docs/Packages";

/**
 * One route for every document.
 *
 * The slug comes from the client's own data rather than the filesystem, which
 * is what lets invoices and reports recur (invoice-001, report-2026-10) without
 * a route per instance. The switch below is exhaustive over DocPayload, so
 * adding a document type is a type error here until it is handled.
 */
export default function DocPage({
  params,
}: {
  params: { client: string; doc: string };
}) {
  const client = getClient(params.client);
  if (!client) notFound();

  const doc = getDoc(client, params.doc);
  if (!doc) notFound();

  const payload = doc.payload;

  return (
    <>
      <PortalNav clientName={client.business.name} clientSlug={client.slug} showBack />
      <main id="main" className="flex-1 py-10 print:py-0 sm:py-14">
        <div className="container-px print:px-0">
          {(() => {
            switch (payload.type) {
              case "agreement":
                return <Agreement client={client} doc={doc} payload={payload} />;
              case "welcome":
                return <Welcome client={client} payload={payload} />;
              case "invoice":
                return <Invoice client={client} payload={payload} />;
              case "brief":
                return <Brief client={client} payload={payload} />;
              case "delivery":
                return <Delivery client={client} payload={payload} />;
              case "report":
                return <Report client={client} payload={payload} />;
              case "payment":
                return <PaymentDetails client={client} payload={payload} />;
              case "thank-you":
                return <ThankYou client={client} payload={payload} />;
              case "feedback":
                return <Feedback client={client} doc={doc} payload={payload} />;
              case "packages":
                return <Packages client={client} payload={payload} />;
              default: {
                // Exhaustiveness check: a new DocPayload variant fails to
                // compile here rather than rendering a blank page in front of
                // a client.
                const unhandled: never = payload;
                throw new Error(`Unhandled document type: ${JSON.stringify(unhandled)}`);
              }
            }
          })()}
        </div>
      </main>
    </>
  );
}

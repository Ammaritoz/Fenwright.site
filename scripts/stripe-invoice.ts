/**
 * Create a Stripe invoice for a portal client and print its "Pay online" link.
 *
 *   npm run stripe:invoice -- <client-slug> sprint
 *   npm run stripe:invoice -- <client-slug> core "January to March 2027" [--credit 2000]
 *   add --send to have Stripe email the invoice; add --live to use a live key.
 *
 * Runs on your machine only. Needs STRIPE_SECRET_KEY in .env.local (a test key,
 * sk_test_... or a restricted rk_test_..., until you deliberately pass --live).
 * The key never goes to Vercel: the website only shows the link this prints.
 *
 * Amounts come from config/documents.ts invoiceLines, the same lines the portal
 * invoice shows, so the Stripe invoice and the portal invoice always agree.
 * Payment methods (card, bank transfer, SEPA Direct Debit) are whatever is
 * switched on in Stripe's Dashboard invoice settings. No VAT is added: the
 * company is not VAT registered (see components/portal/docs/Invoice.tsx).
 */
import Stripe from "stripe";
import { getClient } from "../content/clients";
import { documents } from "../config/documents";
import { site } from "../config/site";
import type { LineItem } from "../content/clients/types";

function fail(msg: string): never {
  console.error(msg);
  process.exit(1);
}

const flags = new Set<string>();
const positional: string[] = [];
let creditIdx = -1;
let creditEuro = 0;
const argv = process.argv.slice(2);
for (let i = 0; i < argv.length; i++) {
  if (argv[i] === "--credit") {
    creditIdx = i;
    creditEuro = Number(argv[++i]);
  } else if (argv[i].startsWith("--")) flags.add(argv[i]);
  else positional.push(argv[i]);
}
const [slug, kind, period] = positional;

if (!slug || (kind !== "sprint" && kind !== "core")) {
  fail('Usage: npm run stripe:invoice -- <client-slug> sprint | core "<period>" [--credit <euro>] [--send] [--live]');
}
if (kind === "core" && !period) fail('Core needs the period, e.g. "January to March 2027".');
if (creditIdx >= 0 && !(creditEuro > 0)) fail("--credit needs an amount in euro, e.g. --credit 2000");

const key = process.env.STRIPE_SECRET_KEY;
if (!key) fail("STRIPE_SECRET_KEY is not set in .env.local.");
const live = /^(sk|rk)_live_/.test(key);
if (live && !flags.has("--live")) fail("That is a LIVE key. Re-run with --live if you really mean to bill a real client.");
if (!/^(sk|rk)_(test|live)_/.test(key)) fail("STRIPE_SECRET_KEY doesn't look like a Stripe secret or restricted key.");

const client = getClient(slug) ?? fail(`No portal client with slug ${slug}. Check content/clients/index.ts.`);
if (client.currency !== "EUR") fail(`This script bills in euro; ${slug} is set to ${client.currency}.`);

const lines: LineItem[] =
  kind === "sprint"
    ? [documents.invoiceLines.sprint]
    : [
        documents.invoiceLines.coreQuarter(period!),
        ...(creditEuro ? [documents.invoiceLines.sprintCredit(Math.round(creditEuro * 100))] : []),
      ];
const total = lines.reduce((s, l) => s + l.quantity * l.unitPrice, 0);
if (total <= 0) fail("The credit is larger than the quarter. Use a smaller --credit and carry the rest to next quarter.");

const stripe = new Stripe(key);

async function findOrCreateCustomer(): Promise<string> {
  const found = await stripe.customers.search({ query: `metadata['fenwright_client']:'${slug}'` });
  if (found.data[0]) return found.data[0].id;
  // Search can lag new customers by up to a minute; check by email too so a
  // second invoice straight after the first doesn't create a duplicate.
  const email = client!.business.contact.email;
  if (email) {
    const byEmail = await stripe.customers.list({ email, limit: 10 });
    const match = byEmail.data.find((c) => c.metadata?.fenwright_client === slug);
    if (match) return match.id;
  }
  const c = await stripe.customers.create({
    name: client!.business.name,
    email: client!.business.contact.email,
    address: client!.business.address ? { line1: client!.business.address } : undefined,
    metadata: { fenwright_client: slug },
  });
  return c.id;
}

async function main() {
  const customer = await findOrCreateCustomer();
  const invoice = await stripe.invoices.create({
    customer,
    collection_method: "send_invoice",
    days_until_due: documents.agreement.paymentTermDays,
    auto_advance: false,
    currency: "eur",
    description: kind === "sprint" ? "CRA Readiness Sprint" : `Founding Core, ${period}`,
    footer: site.legal.vatNumber ? undefined : `No VAT charged. ${site.legal.entityName} is not registered for VAT.`,
    metadata: { fenwright_client: slug, fenwright_kind: kind },
  });
  for (const l of lines) {
    await stripe.invoiceItems.create({
      customer,
      invoice: invoice.id,
      currency: "eur",
      amount: l.quantity * l.unitPrice,
      description: l.quantity > 1 ? `${l.description} (${l.quantity} x €${(l.unitPrice / 100).toFixed(2)})` : l.description,
    });
  }
  const final = await stripe.invoices.finalizeInvoice(invoice.id!);
  if (flags.has("--send")) await stripe.invoices.sendInvoice(final.id!);

  console.log(`${live ? "LIVE" : "TEST"} invoice ${final.number} for ${client!.business.name}: €${(total / 100).toFixed(2)}`);
  console.log(`Pay online: ${final.hosted_invoice_url}`);
  console.log(flags.has("--send") ? "Stripe has emailed it to the client." : "Not emailed (add --send to have Stripe email it).");
  console.log("\nAdd to the client's invoice doc in content/clients/<client>.ts:");
  console.log(`  payUrl: "${final.hosted_invoice_url}",`);
}

main().catch((e: unknown) => {
  const err = e as { type?: string; message?: string };
  fail(`Stripe error${err.type ? ` (${err.type})` : ""}: ${err.message ?? String(e)}`);
});

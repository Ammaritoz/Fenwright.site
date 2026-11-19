/**
 * Make a firmware upload link for one prospect.
 *
 *   npm run intake:link -- lowmoor-controls [days]
 *
 * Needs INTAKE_LINK_SECRET in .env.local (the same value as in Vercel).
 * Send the link only after the prospect has signed the NDA.
 */
import { signIntakeToken } from "../lib/intake/token";
import { intake } from "../config/intake";

const [prospect, daysArg] = process.argv.slice(2);
if (!prospect) {
  console.error("Usage: npm run intake:link -- <prospect-slug> [days]");
  process.exit(1);
}
const days = Number(daysArg ?? intake.defaultLinkDays);
const expires = Math.floor(Date.now() / 1000) + days * 86400;
const base = process.env.SITE_URL ?? "https://www.fenwright.ie";
console.log(`${base}/upload/${signIntakeToken(prospect, expires)}`);
console.log(`Valid until ${new Date(expires * 1000).toISOString().slice(0, 16).replace("T", " ")} UTC (${days} days).`);

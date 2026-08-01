import Link from "next/link";
import { Logo } from "@/components/Logo";
import { site } from "@/config/site";

export function Footer() {
  const f = site.footer;
  const l = site.legal;

  // Build the imprint line (name · address · reg no · VAT), skipping blanks.
  const imprint = [
    l.entityName,
    l.address,
    l.registrationNumber ? `Company no. ${l.registrationNumber}` : "",
    l.vatNumber ? `VAT ${l.vatNumber}` : "",
  ]
    .filter(Boolean)
    .join("  ·  ");

  return (
    <footer className="bg-ink text-paper">
      <div className="container-px flex flex-col gap-8 py-14 sm:flex-row sm:items-start sm:justify-between">
        <div className="max-w-sm">
          <Logo variant="paper" />
          <p className="mt-4 text-sm leading-relaxed text-stone-400">{f.blurb}</p>
        </div>
        <div className="flex flex-col gap-3 text-sm">
          <a
            href={`mailto:${f.email}`}
            className="font-medium text-paper underline-offset-4 hover:text-accent hover:underline"
          >
            {f.email}
          </a>
          <div className="flex flex-wrap gap-x-6 gap-y-2 text-stone-400">
            {[...site.nav.links, site.nav.cta].map((link) => (
              <a key={link.href} href={link.href} className="hover:text-paper">
                {link.label}
              </a>
            ))}
            <Link href="/privacy" className="hover:text-paper">
              Privacy
            </Link>
          </div>
        </div>
      </div>
      <div className="border-t border-white/10">
        <div className="container-px flex flex-col gap-2 py-6 text-xs text-stone-500">
          <p>{imprint}</p>
          <p>{f.copyright}</p>
        </div>
      </div>
    </footer>
  );
}

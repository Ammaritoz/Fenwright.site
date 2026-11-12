"use client";

import { useEffect } from "react";
import Cal, { getCalApi } from "@calcom/embed-react";
import { site } from "@/config/site";
import { media } from "@/config/media";
import { Backdrop } from "@/components/Backdrop";

/** `headline` and `subhead` override the homepage copy for another page's booking section. */
export function BookCall({ headline, subhead }: { headline?: string; subhead?: string } = {}) {
  const b = { headline: headline ?? site.book.headline, subhead: subhead ?? site.book.subhead };
  const calLink = site.calcom.link;
  const calOrigin = site.calcom.origin;
  const embedJsUrl = `${calOrigin}/embed/embed.js`;

  useEffect(() => {
    (async () => {
      // Load the embed from the configured instance (site.calcom.origin), which
      // must be the one the account lives on.
      const cal = await getCalApi({ embedJsUrl });
      cal("ui", {
        theme: "light",
        hideEventTypeDetails: false,
        cssVarsPerTheme: {
          light: { "cal-brand": "#07182A" },
          dark: { "cal-brand": "#7FD1AE" },
        },
        layout: "month_view",
      });
    })();
  }, [embedJsUrl]);

  return (
    <section id="book" className="section bg-paper-alt pb-24 sm:pb-36">
      {/* The headline sits on the picture; the calendar overlaps its lower edge. */}
      <div className="relative isolate overflow-hidden bg-ink pb-56 pt-24 text-white sm:pb-64 sm:pt-36">
        <Backdrop slot={media.closing} wash="heavy" fade={false} />
        <div className="container-px">
          <div className="mx-auto max-w-4xl text-center">
            <h2 className="h-section">{b.headline}</h2>
            <p className="mx-auto mt-6 max-w-xl text-lg font-light leading-relaxed text-white/80">{b.subhead}</p>
          </div>
        </div>
      </div>

      <div className="container-px relative -mt-40 sm:-mt-44">
        <div className="mx-auto max-w-4xl overflow-hidden rounded-[2rem] border border-stone-200 bg-white shadow-lift">
          <Cal
            calLink={calLink}
            calOrigin={calOrigin}
            embedJsUrl={embedJsUrl}
            style={{ width: "100%", height: "100%", minHeight: "640px", overflow: "scroll" }}
            config={{ layout: "month_view" }}
          />
        </div>
      </div>
    </section>
  );
}

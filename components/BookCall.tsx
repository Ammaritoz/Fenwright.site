"use client";

import { useEffect } from "react";
import Cal, { getCalApi } from "@calcom/embed-react";
import { site } from "@/config/site";
import { SectionHead } from "@/components/SectionHead";

export function BookCall() {
  const b = site.book;
  const calLink = site.calcom.link;
  const calOrigin = site.calcom.origin;
  const embedJsUrl = `${calOrigin}/embed/embed.js`;

  useEffect(() => {
    (async () => {
      // Load the embed from the EU instance so it resolves the cal.eu account.
      const cal = await getCalApi({ embedJsUrl });
      cal("ui", {
        theme: "light",
        hideEventTypeDetails: false,
        cssVarsPerTheme: {
          light: { "cal-brand": "#12C784" },
          dark: { "cal-brand": "#1F6B4E" },
        },
        layout: "month_view",
      });
    })();
  }, [embedJsUrl]);

  return (
    <section id="book" className="section py-24 sm:py-32">
      <div className="container-px">
        <SectionHead size="lg" align="center" title={b.headline} lead={b.subhead} />

        <div className="mx-auto mt-12 max-w-3xl overflow-hidden rounded-xl2 border border-stone-200 bg-paper shadow-card">
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

import { site } from "@/config/site";

/**
 * A bold message-thread visual: a customer text arriving and Fenwright's instant
 * reply, with a live-speed indicator. Purely presentational, no stock imagery.
 */
export function PhoneMock() {
  const p = site.hero.phone;
  return (
    <div className="relative mx-auto w-full max-w-[360px]">
      {/* soft deep-green depth behind the device */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -inset-6 -z-10 rounded-[3rem] opacity-70 blur-2xl"
        style={{ background: "radial-gradient(60% 55% at 70% 25%, rgba(31,107,78,0.28), transparent 70%)" }}
      />

      <div className="rounded-[2.75rem] border border-ink/10 bg-ink p-2.5 shadow-lift">
        <div className="overflow-hidden rounded-[2.25rem] bg-paper">
          {/* status bar */}
          <div className="flex items-center justify-between px-6 pt-3.5 text-[11px] font-semibold text-stone-500">
            <span>9:41</span>
            <span className="h-1 w-14 rounded-full bg-stone-300" />
            <span>5G</span>
          </div>

          {/* header */}
          <div className="flex items-center gap-3 border-b border-stone-200 px-5 py-3.5">
            <span className="flex h-9 w-9 items-center justify-center rounded-full bg-ink text-sm font-bold text-accent-300">
              {p.businessName.charAt(0)}
            </span>
            <div className="leading-tight">
              <p className="text-sm font-bold text-ink">{p.businessName}</p>
              <p className="text-[11px] font-medium text-accent-700">Answering now</p>
            </div>
          </div>

          {/* thread */}
          <div className="space-y-2.5 px-4 py-5">
            <div className="flex justify-start">
              <div className="max-w-[82%] rounded-2xl rounded-tl-md bg-stone-100 px-3.5 py-2.5 text-[13.5px] leading-snug text-ink">
                {p.incoming}
              </div>
            </div>
            <div className="flex justify-end">
              <div className="max-w-[86%] rounded-2xl rounded-tr-md bg-accent px-3.5 py-2.5 text-[13.5px] font-medium leading-snug text-paper">
                {p.reply}
              </div>
            </div>
          </div>

          {/* speed footer */}
          <div className="flex items-center justify-between border-t border-stone-200 px-5 py-3">
            <span className="text-[12px] font-medium text-stone-500">Replied automatically</span>
            <span className="inline-flex items-baseline gap-1 rounded-full bg-ink px-3 py-1 text-paper">
              <span className="text-sm font-extrabold tabular-nums text-accent-300">{p.badge}</span>
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

"use client";

import { PACK_SIZES, roi } from "@/config/roi";
import { formatEuro, formatEuroCents, formatJobs, formatPct, leadPacks, type LeadPackResult, type RoiState } from "@/lib/roi";
import { NumberField } from "@/components/roi/NumberField";
import { Sheet, SheetHeadline, SheetNote, SheetRow, SheetRows } from "@/components/roi/Sheet";

type Props = {
  state: RoiState;
  set: (patch: Partial<RoiState>) => void;
};

const l = roi.leads;
const lim = roi.limits;

function result(state: RoiState): LeadPackResult | null {
  return leadPacks({
    packSize: state.packSize,
    pricePerLead: state.pricePerLead,
    closePct: state.closePct,
    jobValue: state.leadsJobValue,
    marginPct: state.leadsMarginPct,
  });
}

export function LeadPacksInputs({ state, set }: Props) {
  const f = l.fields;
  return (
    <div className="grid gap-6 sm:grid-cols-2">
      <fieldset className="sm:col-span-2">
        <legend className="text-sm font-semibold text-ink">{l.packLabel}</legend>
        <div className="mt-2 grid grid-cols-3 gap-2">
          {PACK_SIZES.map((size) => {
            const on = state.packSize === size;
            return (
              <button
                key={size}
                type="button"
                aria-pressed={on}
                onClick={() => set({ packSize: size })}
                className={`rounded-xl border px-3 py-3 text-sm font-semibold tabular-nums transition ${
                  on ? "border-ink bg-ink text-paper" : "border-stone-300 bg-white text-ink hover:border-ink"
                }`}
              >
                {size} {l.packUnit}
              </button>
            );
          })}
        </div>
        <p className="mt-1.5 text-xs leading-relaxed text-stone-500">{l.packHint}</p>
      </fieldset>
      <NumberField {...f.pricePerLead} value={state.pricePerLead} limit={lim.pricePerLead} prefix="€" onChange={(v) => set({ pricePerLead: v })} />
      <NumberField {...f.closePct} value={state.closePct} limit={lim.percent} suffix="%" onChange={(v) => set({ closePct: v })} />
      <NumberField {...f.jobValue} value={state.leadsJobValue} limit={lim.jobValue} prefix="€" onChange={(v) => set({ leadsJobValue: v })} />
      <NumberField {...f.marginPct} value={state.leadsMarginPct} limit={lim.percent} suffix="%" onChange={(v) => set({ leadsMarginPct: v })} />
    </div>
  );
}

function breakEvenLine(r: LeadPackResult): string {
  const s = l.sheet;
  const be = r.breakEvenClosePct;
  if (be === null) return s.noBreakEven;
  if (be >= 100) return s.breakEvenImpossible;
  // Closing 1 in n covers the pack, so round n down: rounding up would quote a rate just short of break-even.
  return s.breakEvenLine.replace("{pct}", formatPct(be)).replace("{n}", String(Math.floor(100 / be)));
}

export function LeadPacksSheet({ state }: { state: RoiState }) {
  const s = l.sheet;
  const r = result(state);
  const range = `${state.packSize} ${l.packUnit}`;

  if (!r) {
    return (
      <Sheet label={s.label} range={range}>
        <SheetNote>{state.pricePerLead ? s.incomplete : s.blank}</SheetNote>
      </Sheet>
    );
  }

  const b = r.atBuyerRate;
  const close = formatPct(b.closePct);
  return (
    <Sheet label={s.label} range={range}>
      <SheetHeadline before={s.headlinePrefix} figure={formatEuroCents(b.returnPerEuro)} after={s.headlineSuffix} />
      <SheetRows>
        <SheetRow label={s.rows.packPrice} value={formatEuro(b.packPrice)} tone="muted" />
        <SheetRow label={s.rows.expectedJobs.replace("{pct}", close)} value={formatJobs(b.expectedJobs)} />
        <SheetRow label={s.rows.revenue} value={formatEuro(b.revenue)} />
        <SheetRow label={s.rows.grossProfit.replace("{pct}", formatPct(state.leadsMarginPct ?? 0))} value={formatEuro(b.grossProfit)} />
        <SheetRow label={s.rows.afterPack} value={formatEuro(b.profitAfterPack)} tone={b.profitAfterPack < 0 ? "loss" : "gain"} />
        <SheetRow
          label={s.rows.breakEven}
          value={r.breakEvenClosePct === null ? s.noBreakEvenValue : formatPct(r.breakEvenClosePct)}
        />
      </SheetRows>
      <SheetNote>{breakEvenLine(r)}</SheetNote>
    </Sheet>
  );
}

export function LeadPacksTable({ state }: { state: RoiState }) {
  const r = result(state);
  if (!r) return null;
  const t = l.table;
  const cols = t.columns;

  return (
    <section className="break-inside-avoid" aria-labelledby="close-rate-table">
      <h2 id="close-rate-table" className="font-display text-2xl font-bold text-ink">
        {t.heading}
      </h2>
      <p className="mt-2 text-sm leading-relaxed text-stone-600">{t.lead}</p>
      <div className="mt-5 overflow-x-auto rounded-xl border border-stone-200 bg-white">
        <table className="w-full sm:min-w-[34rem] text-left text-sm tabular-nums text-stone-600">
          <thead>
            <tr className="border-b border-stone-200 text-ink">
              <th scope="col" className="px-4 py-3 font-semibold">{cols.closePct}</th>
              <th scope="col" className="px-4 py-3 text-right font-semibold">{cols.jobs}</th>
              <th scope="col" className="hidden px-4 py-3 text-right font-semibold sm:table-cell">{cols.revenue}</th>
              <th scope="col" className="hidden px-4 py-3 text-right font-semibold sm:table-cell">{cols.grossProfit}</th>
              <th scope="col" className="px-4 py-3 text-right font-semibold">{cols.afterPack}</th>
              <th scope="col" className="px-4 py-3 text-right font-semibold">{cols.perEuro}</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-stone-200">
            {r.table.map((row) => (
              <tr key={row.closePct} className={row.isBuyerRate ? "bg-accent-soft/60 print:bg-transparent" : undefined}>
                <th scope="row" className="whitespace-nowrap px-4 py-3 font-semibold text-ink">
                  {formatPct(row.closePct)}
                  {row.isBuyerRate && (
                    <span className="block text-[0.68rem] font-semibold uppercase tracking-[0.1em] text-accent-700 sm:ml-2 sm:inline">
                      {t.yourRate}
                    </span>
                  )}
                </th>
                <td className="px-4 py-3 text-right">{formatJobs(row.expectedJobs)}</td>
                <td className="hidden px-4 py-3 text-right sm:table-cell">{formatEuro(row.revenue)}</td>
                <td className="hidden px-4 py-3 text-right sm:table-cell">{formatEuro(row.grossProfit)}</td>
                <td className={`whitespace-nowrap px-4 py-3 text-right font-semibold ${row.losesMoney ? "text-red-700" : "text-accent-700"}`}>
                  {formatEuro(row.profitAfterPack)}
                  {row.losesMoney && <span className="sr-only"> ({t.loss})</span>}
                </td>
                <td className="px-4 py-3 text-right">{formatEuroCents(row.returnPerEuro)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}

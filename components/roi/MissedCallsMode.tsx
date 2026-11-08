"use client";

import { roi } from "@/config/roi";
import { formatJobs, formatMoney, formatMoneyCents, formatPct, missedCalls, moneyUnit, type RoiState } from "@/lib/roi";
import { NumberField } from "@/components/roi/NumberField";
import { Sheet, SheetHeadline, SheetNote, SheetRow, SheetRows } from "@/components/roi/Sheet";

type Props = {
  state: RoiState;
  set: (patch: Partial<RoiState>) => void;
};

const c = roi.calls;
const lim = roi.limits;

export function MissedCallsInputs({ state, set }: Props) {
  const f = c.fields;
  const sym = roi.currency.options[state.currency];
  return (
    <div className="grid gap-6 sm:grid-cols-2">
      <NumberField {...f.callsPerWeek} value={state.callsPerWeek} limit={lim.callsPerWeek} onChange={(v) => set({ callsPerWeek: v })} />
      <NumberField {...f.jobPct} value={state.jobPct} limit={lim.percent} suffix="%" onChange={(v) => set({ jobPct: v })} />
      <NumberField {...f.jobValue} value={state.callsJobValue} limit={lim.jobValue} prefix={sym} onChange={(v) => set({ callsJobValue: v })} />
      <NumberField {...f.marginPct} value={state.callsMarginPct} limit={lim.percent} suffix="%" onChange={(v) => set({ callsMarginPct: v })} />
      <NumberField {...f.recoveryPct} value={state.recoveryPct} limit={lim.percent} suffix="%" onChange={(v) => set({ recoveryPct: v })} />
      <NumberField {...f.monthlyFee} value={state.monthlyFee} limit={lim.monthlyFee} prefix={sym} suffix="/month" onChange={(v) => set({ monthlyFee: v })} />
    </div>
  );
}

export function MissedCallsSheet({ state }: { state: RoiState }) {
  const s = c.sheet;
  const r = missedCalls({
    callsPerWeek: state.callsPerWeek,
    jobPct: state.jobPct,
    jobValue: state.callsJobValue,
    marginPct: state.callsMarginPct,
    recoveryPct: state.recoveryPct,
    monthlyFee: state.monthlyFee,
  });

  if (!r) {
    return (
      <Sheet label={s.label} range={s.range}>
        <SheetNote>{s.incomplete}</SheetNote>
      </Sheet>
    );
  }

  const fee = r.fee;
  const cur = state.currency;
  const money = (n: number) => formatMoney(n, cur);
  return (
    <Sheet label={s.label} range={s.range}>
      <SheetHeadline
        figure={money(r.revenueLostPerMonth)}
        after={s.headlineSuffix}
        note={s.perYear.replace("{amount}", money(r.revenueLostPerYear))}
      />
      <SheetRows>
        <SheetRow label={s.rows.jobsLost} value={formatJobs(r.jobsLostPerMonth)} />
        <SheetRow label={s.rows.revenueLost} value={money(r.revenueLostPerMonth)} />
        <SheetRow label={s.rows.profitLost} value={money(r.profitLostPerMonth)} />
        <SheetRow
          label={s.rows.recovered.replace("{pct}", formatPct(state.recoveryPct ?? 0))}
          value={money(r.recoveredProfitPerMonth)}
          tone="gain"
        />
      </SheetRows>
      {fee ? (
        <SheetRows>
          <SheetRow label={s.fee.fee} value={money(state.monthlyFee ?? 0)} tone="muted" />
          <SheetRow label={s.fee.netGain} value={money(fee.netGain)} tone={fee.netGain < 0 ? "loss" : "gain"} />
          <SheetRow label={s.fee.multiple.replace("{unit}", moneyUnit(cur).name)} value={formatMoneyCents(fee.multiple, cur)} />
          <SheetRow
            label={s.fee.breakEven}
            value={
              fee.breakEvenCallsPerMonth === null
                ? s.fee.noBreakEven
                : `${formatJobs(fee.breakEvenCallsPerMonth)} ${s.fee.breakEvenUnit}`
            }
          />
        </SheetRows>
      ) : (
        <SheetNote>{s.feeBlank}</SheetNote>
      )}
    </Sheet>
  );
}

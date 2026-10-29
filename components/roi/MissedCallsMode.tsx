"use client";

import { roi } from "@/config/roi";
import { formatEuro, formatEuroCents, formatJobs, formatPct, missedCalls, type RoiState } from "@/lib/roi";
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
  return (
    <div className="grid gap-6 sm:grid-cols-2">
      <NumberField {...f.callsPerWeek} value={state.callsPerWeek} limit={lim.callsPerWeek} onChange={(v) => set({ callsPerWeek: v })} />
      <NumberField {...f.jobPct} value={state.jobPct} limit={lim.percent} suffix="%" onChange={(v) => set({ jobPct: v })} />
      <NumberField {...f.jobValue} value={state.callsJobValue} limit={lim.jobValue} prefix="€" onChange={(v) => set({ callsJobValue: v })} />
      <NumberField {...f.marginPct} value={state.callsMarginPct} limit={lim.percent} suffix="%" onChange={(v) => set({ callsMarginPct: v })} />
      <NumberField {...f.recoveryPct} value={state.recoveryPct} limit={lim.percent} suffix="%" onChange={(v) => set({ recoveryPct: v })} />
      <NumberField {...f.monthlyFee} value={state.monthlyFee} limit={lim.monthlyFee} prefix="€" suffix="/month" onChange={(v) => set({ monthlyFee: v })} />
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
  return (
    <Sheet label={s.label} range={s.range}>
      <SheetHeadline
        figure={formatEuro(r.revenueLostPerMonth)}
        after={s.headlineSuffix}
        note={s.perYear.replace("{amount}", formatEuro(r.revenueLostPerYear))}
      />
      <SheetRows>
        <SheetRow label={s.rows.jobsLost} value={formatJobs(r.jobsLostPerMonth)} />
        <SheetRow label={s.rows.revenueLost} value={formatEuro(r.revenueLostPerMonth)} />
        <SheetRow label={s.rows.profitLost} value={formatEuro(r.profitLostPerMonth)} />
        <SheetRow
          label={s.rows.recovered.replace("{pct}", formatPct(state.recoveryPct ?? 0))}
          value={formatEuro(r.recoveredProfitPerMonth)}
          tone="gain"
        />
      </SheetRows>
      {fee ? (
        <SheetRows>
          <SheetRow label={s.fee.fee} value={formatEuro(state.monthlyFee ?? 0)} tone="muted" />
          <SheetRow label={s.fee.netGain} value={formatEuro(fee.netGain)} tone={fee.netGain < 0 ? "loss" : "gain"} />
          <SheetRow label={s.fee.multiple} value={formatEuroCents(fee.multiple)} />
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

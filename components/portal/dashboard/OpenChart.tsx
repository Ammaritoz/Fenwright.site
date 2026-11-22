"use client";

import { useId, useRef, useState, type KeyboardEvent, type PointerEvent } from "react";
import { buildOpenChart, type DailyPoint } from "@/lib/portal/chart";

/**
 * The open-matches chart: plain SVG, drawn from day points the server already
 * chose, with a hover/keyboard readout and a short entrance.
 *
 * A client component only for the readout. It receives dates and counts and
 * nothing else about the client, so no client record reaches the browser
 * bundle (see tests/portal-bundle-leak.test.ts).
 *
 * Entrance: the line and its fill are revealed left to right and the daily
 * bars rise in sequence (globals.css, `chart-*`). The global reduced-motion
 * rule shortens all of it to nothing. The parent keys this component by month,
 * so switching months replays it.
 */

function dayLabel(iso: string, style: "short" | "long"): string {
  return new Intl.DateTimeFormat("en-IE", {
    ...(style === "long" ? { weekday: "short" } : {}),
    day: "numeric",
    month: "short",
    timeZone: "UTC",
  }).format(new Date(`${iso}T00:00:00Z`));
}

export function OpenChart({ points, todayIso, caption }: { points: DailyPoint[]; todayIso: string; caption: string }) {
  const chart = buildOpenChart(points);
  const [active, setActive] = useState<number | null>(null);
  const plotRef = useRef<HTMLDivElement>(null);
  const clipId = useId().replace(/:/g, "");
  if (!chart) return null;

  const n = points.length;
  const last = points[n - 1];
  const labels = [0, 0.25, 0.5, 0.75, 1].map((f) => {
    const p = points[Math.round(f * (n - 1))];
    return p.date === todayIso ? "Today" : dayLabel(p.date, "short");
  });

  const fromPointer = (e: PointerEvent<HTMLDivElement>) => {
    const box = plotRef.current?.getBoundingClientRect();
    if (!box || box.width === 0) return;
    const f = Math.min(1, Math.max(0, (e.clientX - box.left) / box.width));
    setActive(Math.round(f * (n - 1)));
  };
  const onKey = (e: KeyboardEvent<HTMLDivElement>) => {
    const step = { ArrowLeft: -1, ArrowRight: 1, Home: -n, End: n } as Record<string, number>;
    if (e.key === "Escape") return setActive(null);
    if (!(e.key in step)) return;
    e.preventDefault();
    setActive((i) => Math.min(n - 1, Math.max(0, (i ?? n - 1) + step[e.key])));
  };

  const p = active === null ? null : points[active];
  const xPct = active === null ? 0 : (active / (n - 1)) * 100;
  const yPct = p ? (chart.yFor(p.open) / chart.height) * 100 : 0;
  const readout = p
    ? `${dayLabel(p.date, "long")}: ${p.open} open, ${p.matched === 0 ? "no" : p.matched} new ${p.matched === 1 ? "match" : "matches"}`
    : "";

  return (
    <div className="mt-5 grid grid-cols-[1.5rem_minmax(0,1fr)] gap-2.5">
      <div aria-hidden="true" className="relative h-44 font-mono text-[0.66rem] text-night-faint">
        {chart.ticks.map((t) => (
          <span key={t} className="absolute right-0 -translate-y-1/2" style={{ top: `${(chart.yFor(t) / chart.height) * 100}%` }}>
            {t}
          </span>
        ))}
      </div>
      <div className="min-w-0">
        <div
          ref={plotRef}
          role="img"
          tabIndex={0}
          aria-label={`${caption}. Ends at ${last.open} open. Use the arrow keys to read each day.`}
          onPointerMove={fromPointer}
          onPointerDown={fromPointer}
          onPointerLeave={() => setActive(null)}
          onFocus={() => setActive((i) => i ?? n - 1)}
          onBlur={() => setActive(null)}
          onKeyDown={onKey}
          className="relative h-44 cursor-crosshair touch-pan-y rounded-sm outline-none focus-visible:ring-1 focus-visible:ring-signal-mint/60"
        >
          <svg
            viewBox={`0 0 ${chart.width} ${chart.height}`}
            preserveAspectRatio="none"
            aria-hidden="true"
            className="block h-full w-full overflow-visible"
          >
            <defs>
              <linearGradient id={`${clipId}-fill`} x1="0" y1="0" x2="0" y2="1">
                <stop offset="0" stopColor="#6FD6A8" stopOpacity="0.22" />
                <stop offset="1" stopColor="#6FD6A8" stopOpacity="0" />
              </linearGradient>
              <clipPath id={`${clipId}-reveal`}>
                {/* Taller than the plot so the line's stroke is never cut at the top or bottom. */}
                <rect className="chart-reveal" x="0" y="-20" width={chart.width} height={chart.height + 40} />
              </clipPath>
            </defs>
            {chart.ticks.map((t) => (
              <line
                key={t}
                x1="0"
                x2={chart.width}
                y1={chart.yFor(t)}
                y2={chart.yFor(t)}
                stroke={t === 0 ? "#2A2C32" : "#1F2125"}
                strokeWidth="1"
                vectorEffect="non-scaling-stroke"
              />
            ))}
            <g fill="#3A3D44">
              {chart.bars.map((b) => (
                <rect
                  key={b.x}
                  className="chart-bar"
                  style={{ animationDelay: `${150 + (b.x / chart.width) * 700}ms` }}
                  x={b.x}
                  y={b.y}
                  width="4"
                  height={b.h}
                  rx="1"
                  fill={active !== null && Math.abs(b.x + 2 - (active / (n - 1)) * chart.width) < 3 ? "#6B7079" : undefined}
                />
              ))}
            </g>
            <g clipPath={`url(#${clipId}-reveal)`}>
              <path className="chart-area" d={chart.area} fill={`url(#${clipId}-fill)`} />
              <path d={chart.line} fill="none" stroke="#6FD6A8" strokeWidth="1.75" vectorEffect="non-scaling-stroke" />
            </g>
          </svg>

          {p && (
            <>
              <div aria-hidden="true" className="pointer-events-none absolute inset-y-0 w-px bg-night-dim/40" style={{ left: `${xPct}%` }} />
              <div
                aria-hidden="true"
                className="pointer-events-none absolute h-2.5 w-2.5 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-night-panel bg-signal-mint shadow-[0_0_0_3px_rgba(111,214,168,0.2)]"
                style={{ left: `${xPct}%`, top: `${yPct}%` }}
              />
              <div
                aria-hidden="true"
                className={`pointer-events-none absolute top-0 z-10 min-w-[8.5rem] rounded-lg border border-night-edge bg-night-raised/95 px-3 py-2 shadow-[0_12px_32px_-12px_rgba(0,0,0,0.8)] backdrop-blur ${
                  xPct > 60 ? "-translate-x-[calc(100%+10px)]" : "translate-x-[10px]"
                }`}
                style={{ left: `${xPct}%` }}
              >
                <p className="font-mono text-[0.7rem] text-night-mute">{dayLabel(p.date, "long")}</p>
                <p className="mt-1.5 flex items-center gap-2 text-[0.8rem] text-night-text">
                  <span className="h-0.5 w-3 rounded-full bg-signal-mint" />
                  <span className="font-mono">{p.open}</span> open
                </p>
                <p className="mt-0.5 flex items-center gap-2 text-[0.8rem] text-night-dim">
                  <span className="ml-1 h-2.5 w-1 rounded-sm bg-[#4A4E57]" />
                  <span className="ml-1 font-mono">{p.matched}</span> new
                </p>
              </div>
            </>
          )}
        </div>
        <p className="sr-only" aria-live="polite">
          {readout}
        </p>
        <div aria-hidden="true" className="mt-2 flex justify-between font-mono text-[0.66rem] text-night-faint">
          {labels.map((l, i) => (
            <span key={`${l}-${i}`}>{l}</span>
          ))}
        </div>
      </div>
    </div>
  );
}

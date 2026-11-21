/**
 * Geometry for the dashboard's 30-day chart, kept pure so it renders on the
 * server as plain SVG (no chart library, nothing shipped to the browser) and
 * can be tested.
 */

export type DailyPoint = { date: string; matched: number; open: number };

export type OpenChart = {
  width: number;
  height: number;
  /** The open-matches line, smoothed. */
  line: string;
  /** The same line closed down to the baseline, for the soft fill under it. */
  area: string;
  /** One thin bar per day that had new matches. */
  bars: { x: number; y: number; h: number }[];
  /** Gridline values, top to bottom, ending at 0. */
  ticks: number[];
  yFor: (v: number) => number;
};

/**
 * A smooth line through every point that never overshoots them (monotone cubic,
 * the same idea as d3's curveMonotoneX). A plain spline would dip below zero
 * before a sudden jump and spike above the peak after it, drawing counts that
 * never happened.
 */
export function smoothPath(points: readonly (readonly [number, number])[]): string {
  if (points.length === 0) return "";
  const r = (n: number) => Math.round(n * 10) / 10;
  const n = points.length;
  let d = `M${r(points[0][0])},${r(points[0][1])}`;
  if (n === 1) return d;

  const slope = (i: number) => (points[i + 1][1] - points[i][1]) / (points[i + 1][0] - points[i][0]);
  const tangents = points.map((_, i) => {
    if (i === 0) return slope(0);
    if (i === n - 1) return slope(n - 2);
    const s0 = slope(i - 1);
    const s1 = slope(i);
    // A local peak, trough or flat run gets a flat tangent: no overshoot.
    if (s0 * s1 <= 0) return 0;
    return Math.sign(s0) * Math.min(Math.abs(s0), Math.abs(s1), Math.abs((s0 + s1) / 2));
  });

  for (let i = 0; i < n - 1; i++) {
    const [x0, y0] = points[i];
    const [x1, y1] = points[i + 1];
    const h = (x1 - x0) / 3;
    d += ` C${r(x0 + h)},${r(y0 + tangents[i] * h)} ${r(x1 - h)},${r(y1 - tangents[i + 1] * h)} ${r(x1)},${r(y1)}`;
  }
  return d;
}

export function buildOpenChart(daily: readonly DailyPoint[], width = 720, height = 176): OpenChart | null {
  if (daily.length < 2) return null;
  const peak = Math.max(4, ...daily.map((d) => Math.max(d.open, d.matched)));
  // Round the scale up to an even number so the three gridlines land on whole numbers.
  const yMax = Math.ceil(peak / 2) * 2;
  const top = 12; // headroom so the line never touches the frame
  const yFor = (v: number) => height - (v / yMax) * (height - top);
  const step = width / (daily.length - 1);
  // Bars use their own, shorter scale so they read as texture under the line.
  const barMax = Math.max(1, ...daily.map((d) => d.matched));
  const barH = (v: number) => (v / barMax) * height * 0.32;

  const pts = daily.map((d, i) => [i * step, yFor(d.open)] as const);
  const line = smoothPath(pts);
  const area = `${line} L${width},${height} L0,${height} Z`;
  const bars = daily.flatMap((d, i) =>
    d.matched > 0 ? [{ x: Math.min(width - 4, Math.max(0, i * step - 2)), y: height - barH(d.matched), h: barH(d.matched) }] : []
  );
  const ticks = [yMax, (yMax * 2) / 3, yMax / 3, 0].map((v) => Math.round(v));
  return { width, height, line, area, bars, ticks, yFor };
}

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

/** Catmull-Rom through every point, as cubic Béziers: smooth, and it never overshoots far. */
export function smoothPath(points: readonly (readonly [number, number])[]): string {
  if (points.length === 0) return "";
  const r = (n: number) => Math.round(n * 10) / 10;
  let d = `M${r(points[0][0])},${r(points[0][1])}`;
  for (let i = 0; i < points.length - 1; i++) {
    const p0 = points[i - 1] ?? points[i];
    const p1 = points[i];
    const p2 = points[i + 1];
    const p3 = points[i + 2] ?? p2;
    const c1x = p1[0] + (p2[0] - p0[0]) / 6;
    const c1y = p1[1] + (p2[1] - p0[1]) / 6;
    const c2x = p2[0] - (p3[0] - p1[0]) / 6;
    const c2y = p2[1] - (p3[1] - p1[1]) / 6;
    d += ` C${r(c1x)},${r(c1y)} ${r(c2x)},${r(c2y)} ${r(p2[0])},${r(p2[1])}`;
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

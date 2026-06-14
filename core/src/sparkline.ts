/**
 * Sparkline data + geometry. Pure math only.
 *
 * The demo's `sparkSVG` mixed three concerns: (1) generating the price series,
 * (2) projecting it into path geometry, and (3) emitting an <svg> string with a
 * gradient + CSS draw-animation variable. (1) and (2) are pure and belong in
 * core; (3) is a rendering concern and stays in the UI layer, which can consume
 * `SparkGeometry` to build whatever markup it wants.
 */

/** Deterministic pseudo-price series seeded by `seed`, trending by `change` %. */
export function buildSeries(seed: number, change: number, n = 28): number[] {
  const pts: number[] = [];
  let v = 100;
  let r = seed * 9301 + 49297;
  const rng = () => {
    r = (r * 9301 + 49297) % 233280;
    return r / 233280;
  };
  const trend = change / 100 / n;
  for (let i = 0; i < n; i++) {
    v += (rng() - 0.5) * 6 + v * trend;
    pts.push(v);
  }
  return pts;
}

export interface SparkOptions {
  /** Viewport width (default 100). */
  w?: number;
  /** Viewport height (default 34). */
  h?: number;
  /** Inner padding (default 2). */
  pad?: number;
}

export interface SparkGeometry {
  /** Projected [x, y] points. */
  points: Array<[number, number]>;
  /** SVG path `d` for the line ("M.. L..  L.."). */
  line: string;
  /** SVG path `d` for the closed fill area (ends with "Z"). */
  area: string;
  /** Approximate path length — drives the CSS draw animation. */
  length: number;
  width: number;
  height: number;
}

/** Project a numeric series into sparkline path geometry. */
export function sparklinePath(data: number[], opts: SparkOptions = {}): SparkGeometry {
  const w = opts.w ?? 100;
  const h = opts.h ?? 34;
  const pad = opts.pad ?? 2;
  if (data.length === 0) {
    return { points: [], line: "", area: "", length: 0, width: w, height: h };
  }
  const min = Math.min(...data);
  const max = Math.max(...data);
  const span = max - min || 1;
  const stepX = data.length > 1 ? (w - pad * 2) / (data.length - 1) : 0;
  const points: Array<[number, number]> = data.map((d, i) => {
    const x = pad + i * stepX;
    const y = pad + (h - pad * 2) * (1 - (d - min) / span);
    return [x, y];
  });
  const line = points.map((p, i) => (i ? "L" : "M") + p[0].toFixed(1) + " " + p[1].toFixed(1)).join(" ");
  const first = points[0]!;
  const last = points[points.length - 1]!;
  const area =
    "M" + first[0].toFixed(1) + " " + (h - pad) + " " +
    line.replace(/^M/, "L") +
    " L" + last[0].toFixed(1) + " " + (h - pad) + " Z";
  let length = 0;
  for (let i = 1; i < points.length; i++) {
    length += Math.hypot(points[i]![0] - points[i - 1]![0], points[i]![1] - points[i - 1]![1]);
  }
  return { points, line, area, length: Math.round(length), width: w, height: h };
}

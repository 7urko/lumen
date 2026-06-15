import type { CSSProperties } from "react";
import { buildSeries, sparklinePath } from "@lumen/core";

interface Props { seed: number; change: number; width?: number; height?: number; color?: string }

export function Sparkline({ seed, change, width = 84, height = 34, color }: Props) {
  const data = buildSeries(seed, change);
  const geo = sparklinePath(data, { w: width, h: height });
  const stroke = color ?? (change >= 0 ? "var(--up)" : "var(--down)");
  const id = `spk-${seed}-${Math.round(change * 100)}`;
  return (
    <svg viewBox={`0 0 ${width} ${height}`} preserveAspectRatio="none" style={{ width: "100%", height: "100%", display: "block" }}>
      <defs>
        <linearGradient id={id} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor={stroke} stopOpacity="0.28" />
          <stop offset="1" stopColor={stroke} stopOpacity="0" />
        </linearGradient>
      </defs>
      <path d={geo.area} fill={`url(#${id})`} />
      <path className="spark-draw" d={geo.line} fill="none" stroke={stroke} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ "--len": geo.length } as CSSProperties} />
    </svg>
  );
}

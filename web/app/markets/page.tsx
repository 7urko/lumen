"use client";

import { useEffect, useRef, useState } from "react";
import { isStrict } from "@/lib/privacy";

const MARKETS: Array<{ sym: string; tv: string }> = [
  { sym: "BTC", tv: "BINANCE:BTCUSDT" },
  { sym: "ETH", tv: "BINANCE:ETHUSDT" },
  { sym: "SOL", tv: "BINANCE:SOLUSDT" },
  { sym: "BASE", tv: "BINANCE:ETHUSDT" },
  { sym: "MATIC", tv: "BINANCE:MATICUSDT" },
];

export default function MarketsScreen() {
  const [sym, setSym] = useState("ETH");
  const [strict, setStrict] = useState(false);
  const market = MARKETS.find((m) => m.sym === sym) ?? MARKETS[1]!;
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => { setStrict(isStrict()); }, []);

  useEffect(() => {
    const el = containerRef.current;
    if (!el || strict) return;
    el.innerHTML = "";
    const inner = document.createElement("div");
    inner.className = "tradingview-widget-container__widget";
    inner.style.height = "100%";
    el.appendChild(inner);
    const script = document.createElement("script");
    script.src = "https://s3.tradingview.com/external-embedding/embed-widget-advanced-chart.js";
    script.async = true;
    script.innerHTML = JSON.stringify({
      symbol: market.tv, theme: "dark", style: "1", locale: "en", autosize: true,
      hide_top_toolbar: false, hide_legend: false,
      backgroundColor: "rgba(6,6,12,1)", gridColor: "rgba(255,255,255,0.06)", allow_symbol_change: false,
    });
    el.appendChild(script);
    return () => { el.innerHTML = ""; };
  }, [market.tv, strict]);

  return (
    <div className="view">
      <div className="view-head"><h2>Markets</h2><p className="muted">Live prices, powered by TradingView.</p></div>
      <div className="chip-row">
        {MARKETS.map((m) => (
          <button key={m.sym} className={`chip${m.sym === sym ? " active" : ""}`} onClick={() => setSym(m.sym)}>{m.sym}</button>
        ))}
      </div>
      {strict ? (
        <div className="card glass" style={{ textAlign: "center", padding: 40 }}>
          <p className="muted">Chart hidden in <b>Strict privacy mode</b> (it would load from TradingView). Turn it off on the Privacy screen to show it.</p>
        </div>
      ) : (
        <div className="chart-frame"><div className="tradingview-widget-container" ref={containerRef} style={{ height: "100%", width: "100%" }} /></div>
      )}
    </div>
  );
}

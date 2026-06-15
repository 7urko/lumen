"use client";

import { useEffect, useRef, useState } from "react";
import { useWallet } from "@/components/WalletProvider";
import { isStrict } from "@/lib/privacy";

export default function MarketsScreen() {
  const { tokens } = useWallet();
  const [sym, setSym] = useState(tokens[0]?.sym ?? "BTC");
  const [strict, setStrict] = useState(false);
  const token = tokens.find((t) => t.sym === sym) ?? tokens[0]!;
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
      symbol: token.tv, theme: "dark", style: "1", locale: "en", autosize: true,
      hide_top_toolbar: false, hide_legend: false,
      backgroundColor: "rgba(6,6,12,1)", gridColor: "rgba(255,255,255,0.06)", allow_symbol_change: false,
    });
    el.appendChild(script);
    return () => { el.innerHTML = ""; };
  }, [token.tv, strict]);

  return (
    <div className="view">
      <div className="view-head">
        <h2>Markets</h2>
        <p className="muted">Live prices, powered by TradingView.</p>
      </div>
      <div className="chip-row">
        {tokens.map((t) => (
          <button key={t.sym} className={`chip${t.sym === sym ? " active" : ""}`} onClick={() => setSym(t.sym)}>{t.sym}</button>
        ))}
      </div>
      {strict ? (
        <div className="card glass" style={{ textAlign: "center", padding: 40 }}>
          <p className="muted">Chart hidden in <b>Strict privacy mode</b> (it would load from TradingView). Turn it off on the Privacy screen to show it.</p>
        </div>
      ) : (
        <div className="chart-frame">
          <div className="tradingview-widget-container" ref={containerRef} style={{ height: "100%", width: "100%" }} />
        </div>
      )}
    </div>
  );
}

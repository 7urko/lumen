"use client";

import { useEffect, useMemo, useState } from "react";
import { isStrict } from "@/lib/privacy";

const MARKETS: Array<{ sym: string; tv: string }> = [
  { sym: "BTC", tv: "BINANCE:BTCUSDT" },
  { sym: "ETH", tv: "BINANCE:ETHUSDT" },
  { sym: "SOL", tv: "BINANCE:SOLUSDT" },
  { sym: "BASE", tv: "BINANCE:ETHUSDT" },
  { sym: "MATIC", tv: "BINANCE:MATICUSDT" },
];

/** Build the sandboxed iframe document hosting the TradingView widget.
 *  Security review M5: the third-party chart runs INSIDE a sandboxed iframe with no
 *  `allow-same-origin`, so it's an opaque origin — it cannot read the wallet's DOM,
 *  localStorage (the encrypted vault / passkey credential), or cookies. Its own CSP
 *  (the meta tag) confines it to TradingView. This is what lets the main app drop
 *  `unsafe-inline` from its script-src (nonce CSP in middleware.ts). */
function chartSrcDoc(symbol: string): string {
  const config = JSON.stringify({
    symbol, theme: "dark", style: "1", locale: "en", autosize: true,
    hide_top_toolbar: false, hide_legend: false,
    backgroundColor: "rgba(6,6,12,1)", gridColor: "rgba(255,255,255,0.06)", allow_symbol_change: false,
  });
  return `<!doctype html><html><head><meta charset="utf-8">
<meta http-equiv="Content-Security-Policy" content="default-src 'none'; script-src https://s3.tradingview.com https://*.tradingview.com 'unsafe-inline'; style-src 'unsafe-inline'; img-src https://*.tradingview.com data:; connect-src https://*.tradingview.com; frame-src https://*.tradingview.com https://www.tradingview-widget.com;">
<style>html,body{margin:0;height:100%;background:#06060c;overflow:hidden}</style></head>
<body><div class="tradingview-widget-container" style="height:100%;width:100%">
<div class="tradingview-widget-container__widget" style="height:100%;width:100%"></div>
<script type="text/javascript" src="https://s3.tradingview.com/external-embedding/embed-widget-advanced-chart.js" async>${config}</script>
</div></body></html>`;
}

export default function MarketsScreen() {
  const [sym, setSym] = useState("ETH");
  const [strict, setStrict] = useState(false);
  const market = MARKETS.find((m) => m.sym === sym) ?? MARKETS[1]!;

  useEffect(() => { setStrict(isStrict()); }, []);

  const srcDoc = useMemo(() => chartSrcDoc(market.tv), [market.tv]);

  return (
    <div className="view">
      <div className="view-head"><h2>Markets</h2><p className="muted">Live prices, powered by TradingView (sandboxed).</p></div>
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
        <div className="chart-frame" style={{ overflow: "hidden" }}>
          <iframe
            key={market.tv}
            title={`${sym} price chart`}
            srcDoc={srcDoc}
            sandbox="allow-scripts allow-popups allow-popups-to-escape-sandbox"
            referrerPolicy="no-referrer"
            style={{ border: 0, width: "100%", height: "100%", display: "block" }}
          />
        </div>
      )}
    </div>
  );
}

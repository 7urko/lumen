"use client";

import { fmtUsd } from "@lumen/core";
import { useWallet } from "@/components/WalletProvider";
import { Coin } from "@/components/Coin";
import { ConnectGate } from "@/components/ConnectGate";
import { ACTIVE_LABEL } from "@/lib/config";

export default function InsightsScreen() {
  const { tokens, totalUsd, connected } = useWallet();
  const rows = [...tokens].filter((t) => t.balance > 0).sort((a, b) => b.balance * b.price - a.balance * a.price);

  return (
    <div className="view">
      <div className="view-head"><h2>Insights</h2><p className="muted">Real allocation across your connected wallet ({ACTIVE_LABEL}). (Cost-basis P&amp;L needs a price-history indexer — not shipped.)</p></div>
      <ConnectGate connected={connected}>
        <div className="card glass" style={{ marginBottom: 18 }}>
          <div className="hero-label">Holdings value</div>
          <div className="balance" style={{ fontSize: 32 }}>{fmtUsd(totalUsd)}</div>
        </div>
        <div className="card glass">
          <div className="section-title" style={{ marginTop: 0 }}>Allocation</div>
          {rows.length === 0 && <div className="muted">No assets yet.</div>}
          <div className="alloc">
            {rows.map((t) => {
              const value = t.balance * t.price;
              const pct = totalUsd ? (value / totalUsd) * 100 : 0;
              return (
                <div className="alloc-row" key={t.sym}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}><Coin token={t} size={26} /></div>
                  <div className="alloc-bar"><i style={{ width: `${pct}%`, backgroundImage: `linear-gradient(90deg, ${t.grad[0]}, ${t.grad[1]})` }} /></div>
                  <div style={{ textAlign: "right", fontWeight: 600, fontSize: 13 }}>{pct.toFixed(1)}%</div>
                </div>
              );
            })}
          </div>
        </div>
      </ConnectGate>
    </div>
  );
}

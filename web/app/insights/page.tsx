"use client";

import { computePnl, totalUsd, fmtUsd, fmtSigned, type Token } from "@lumen/core";
import { useWallet } from "@/components/WalletProvider";
import { Coin } from "@/components/Coin";

export default function InsightsScreen() {
  const { tokens } = useWallet();
  const total = totalUsd(tokens);
  const pnl = computePnl(tokens);
  const rows: Token[] = [...tokens].sort((a, b) => (b.balance + b.staked) * b.price - (a.balance + a.staked) * a.price);

  return (
    <div className="view">
      <div className="view-head">
        <h2>Insights</h2>
        <p className="muted">Allocation, profit &amp; loss, and cost basis across your portfolio.</p>
      </div>

      <div className="grid-2" style={{ marginBottom: 18 }}>
        <div className="card glass">
          <div className="lbl muted">Total P&amp;L</div>
          <div className={`balance ${pnl.total >= 0 ? "pos" : "neg"}`} style={{ fontSize: 32 }}>{fmtSigned(pnl.total)}</div>
          <div className="muted">{pnl.totalPct >= 0 ? "+" : ""}{pnl.totalPct.toFixed(1)}% vs cost basis</div>
        </div>
        <div className="card glass">
          <div className="lbl muted">24h P&amp;L</div>
          <div className={`balance ${pnl.day >= 0 ? "pos" : "neg"}`} style={{ fontSize: 32 }}>{fmtSigned(pnl.day)}</div>
          <div className="muted">{pnl.dayPct >= 0 ? "+" : ""}{pnl.dayPct.toFixed(2)}% today</div>
        </div>
      </div>

      <div className="card glass" style={{ marginBottom: 18 }}>
        <div className="section-title" style={{ marginTop: 0 }}>Allocation</div>
        <div className="alloc">
          {rows.map((t) => {
            const value = (t.balance + t.staked) * t.price;
            const pct = total ? (value / total) * 100 : 0;
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

      <div className="card glass">
        <div className="section-title" style={{ marginTop: 0 }}>Cost basis &amp; P&amp;L</div>
        <table className="pnltable">
          <thead>
            <tr><th>Asset</th><th>Value</th><th>Cost basis</th><th>P&amp;L</th></tr>
          </thead>
          <tbody>
            {rows.map((t) => {
              const held = t.balance + t.staked;
              const value = held * t.price;
              const cost = held * t.cost;
              const gain = value - cost;
              const pct = cost ? (gain / cost) * 100 : 0;
              return (
                <tr key={t.sym}>
                  <td>{t.sym}</td>
                  <td>{fmtUsd(value)}</td>
                  <td>{fmtUsd(cost)}</td>
                  <td className={gain >= 0 ? "pos" : "neg"}>{fmtSigned(gain)} ({pct >= 0 ? "+" : ""}{pct.toFixed(0)}%)</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

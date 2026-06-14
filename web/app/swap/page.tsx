"use client";

import { useState } from "react";
import { computeSwap, fmtUsd, fmtAmt } from "@lumen/core";
import { useWallet } from "@/components/WalletProvider";
import { Icon } from "@/components/icons";

const SLIPS = [0.1, 0.5, 1.0];

export default function SwapScreen() {
  const { tokens, swap, showToast } = useWallet();
  const [fromSym, setFromSym] = useState("ETH");
  const [toSym, setToSym] = useState("USDC");
  const [fromAmt, setFromAmt] = useState("");
  const [slippage, setSlippage] = useState(0.5);

  const from = tokens.find((t) => t.sym === fromSym) ?? tokens[0]!;
  const to = tokens.find((t) => t.sym === toSym) ?? tokens[1]!;
  const amt = parseFloat(fromAmt) || 0;
  const q = computeSwap(from, to, amt, slippage);

  const sameToken = from.sym === to.sym;
  const insufficient = amt > from.balance;
  const canSwap = amt > 0 && !sameToken && !insufficient;
  const error = sameToken ? "Choose two different tokens." : insufficient ? `Insufficient ${from.sym} balance.` : "";

  function flip() { setFromSym(toSym); setToSym(fromSym); setFromAmt(""); }
  function onSwap() {
    if (!canSwap) return;
    swap(from.sym, to.sym, amt, q.toAmt);
    showToast(`Swapped ${fmtAmt(amt)} ${from.sym} → ${fmtAmt(q.toAmt)} ${to.sym}`);
    setFromAmt("");
  }

  return (
    <div className="view" style={{ maxWidth: 600 }}>
      <div className="view-head"><h2>Swap</h2><p className="muted">Convert between assets with a live rate and slippage control.</p></div>
      <div className="card glass">
        <div className="field">
          <label>From</label>
          <div style={{ display: "flex", gap: 10 }}>
            <select className="select" style={{ maxWidth: 130 }} value={fromSym} onChange={(e) => setFromSym(e.target.value)}>
              {tokens.map((t) => <option key={t.sym} value={t.sym}>{t.sym}</option>)}
            </select>
            <input className="input" inputMode="decimal" placeholder="0.00" value={fromAmt} onChange={(e) => setFromAmt(e.target.value)} />
          </div>
          <div className="hint" style={{ display: "flex", justifyContent: "space-between" }}>
            <span>≈ {fmtUsd(q.fromUsd)}</span>
            <button className="faint" style={{ fontWeight: 600 }} onClick={() => setFromAmt(String(from.balance))}>Balance {fmtAmt(from.balance)} {from.sym}</button>
          </div>
        </div>

        <div style={{ textAlign: "center", margin: "4px 0" }}>
          <button className="iconbtn" onClick={flip} aria-label="Flip"><Icon name="swap" size={18} /></button>
        </div>

        <div className="field">
          <label>To</label>
          <div style={{ display: "flex", gap: 10 }}>
            <select className="select" style={{ maxWidth: 130 }} value={toSym} onChange={(e) => setToSym(e.target.value)}>
              {tokens.map((t) => <option key={t.sym} value={t.sym}>{t.sym}</option>)}
            </select>
            <input className="input" readOnly placeholder="0.00" value={amt > 0 ? fmtAmt(q.toAmt) : ""} />
          </div>
          <div className="hint">≈ {fmtUsd(q.toUsd)}</div>
        </div>

        <div className="field">
          <label>Slippage tolerance</label>
          <div className="chip-row">
            {SLIPS.map((s) => <button key={s} className={`chip${slippage === s ? " active" : ""}`} onClick={() => setSlippage(s)}>{s}%</button>)}
          </div>
        </div>

        <div className="legs">
          <div className="leg"><span className="muted">Rate</span><span className="v">1 {from.sym} ≈ {fmtAmt(q.rate)} {to.sym}</span></div>
          <div className="leg"><span className="muted">Price impact</span><span className="v">{q.impact.toFixed(2)}%</span></div>
          <div className="leg"><span className="muted">You receive (min)</span><span className="v">{amt > 0 ? `${fmtAmt(q.minReceived)} ${to.sym}` : "—"}</span></div>
        </div>

        {error && <div className="hint bad" style={{ marginBottom: 10 }}>{error}</div>}
        <button className="btn btn-primary btn-block" disabled={!canSwap} onClick={onSwap}>Swap</button>
      </div>
    </div>
  );
}

"use client";

import { useState } from "react";
import { computeBuyQuote, fmtUsd, fmtAmt, type BuyMethod } from "@lumen/core";
import { useWallet } from "@/components/WalletProvider";

const PRESETS = [50, 100, 250, 500];

export default function BuyScreen() {
  const { tokens, buy, showToast } = useWallet();
  const buyable = [...tokens.filter((t) => !t.stable), ...tokens.filter((t) => t.stable)];
  const [sym, setSym] = useState(buyable[0]?.sym ?? "BTC");
  const [fiat, setFiat] = useState("100");
  const [method, setMethod] = useState<BuyMethod>("card");

  const token = tokens.find((t) => t.sym === sym) ?? tokens[0]!;
  const amount = parseFloat(fiat) || 0;
  const q = computeBuyQuote(token, amount, method);

  function onBuy() {
    if (amount <= 0) { showToast("Enter an amount"); return; }
    buy(token.sym, q.tokenAmt, amount);
    showToast(`Bought ${fmtAmt(q.tokenAmt)} ${token.sym}`);
  }

  return (
    <div className="view" style={{ maxWidth: 600 }}>
      <div className="view-head"><h2>Buy</h2><p className="muted">Fund your wallet with card or Apple Pay.</p></div>
      <div className="card glass">
        <div className="field">
          <label>Asset</label>
          <select className="select" value={sym} onChange={(e) => setSym(e.target.value)}>
            {buyable.map((t) => <option key={t.sym} value={t.sym}>{t.sym} — {t.name}</option>)}
          </select>
        </div>
        <div className="field">
          <label>Amount (USD)</label>
          <input className="input" inputMode="decimal" value={fiat} onChange={(e) => setFiat(e.target.value)} placeholder="0.00" />
          <div className="chip-row" style={{ marginTop: 10 }}>
            {PRESETS.map((p) => (
              <button key={p} className={`chip${amount === p ? " active" : ""}`} onClick={() => setFiat(String(p))}>${p}</button>
            ))}
          </div>
        </div>
        <div className="field">
          <label>Pay with</label>
          <div className="chip-row">
            <button className={`chip${method === "card" ? " active" : ""}`} onClick={() => setMethod("card")}>Card · 1.2%</button>
            <button className={`chip${method === "apple" ? " active" : ""}`} onClick={() => setMethod("apple")}>Apple Pay · 0.9%</button>
          </div>
        </div>
        <div className="legs">
          <div className="leg"><span className="muted">Rate</span><span className="v">1 {token.sym} = {fmtUsd(token.price)}</span></div>
          <div className="leg"><span className="muted">{method === "apple" ? "Apple Pay" : "Card"} fee</span><span className="v">{fmtUsd(q.fee)}</span></div>
          <div className="leg"><span className="muted">You receive</span><span className="v">≈ {fmtAmt(q.tokenAmt)} {token.sym}</span></div>
        </div>
        <button className="btn btn-primary btn-block" disabled={amount <= 0} onClick={onBuy}>Buy {token.sym}</button>
      </div>
    </div>
  );
}

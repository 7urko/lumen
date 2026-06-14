"use client";

import { useState } from "react";
import { fmtUsd } from "@lumen/core";
import { useWallet } from "@/components/WalletProvider";
import { Icon } from "@/components/icons";

export default function AlertsScreen() {
  const { tokens, alerts, addAlert, toggleAlert, removeAlert, showToast } = useWallet();
  const [sym, setSym] = useState(tokens[0]?.sym ?? "BTC");
  const [dir, setDir] = useState<"above" | "below">("above");
  const [price, setPrice] = useState("");

  function onAdd() {
    const p = parseFloat(price);
    if (!p || p <= 0) { showToast("Enter a target price"); return; }
    addAlert({ sym, dir, price: p, on: true });
    setPrice("");
    showToast(`Alert set for ${sym}`);
  }

  return (
    <div className="view" style={{ maxWidth: 720 }}>
      <div className="view-head"><h2>Price alerts</h2><p className="muted">Get notified when an asset crosses your target.</p></div>
      <div className="card glass" style={{ marginBottom: 18 }}>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr auto", gap: 10, alignItems: "end" }}>
          <div className="field" style={{ margin: 0 }}>
            <label>Asset</label>
            <select className="select" value={sym} onChange={(e) => setSym(e.target.value)}>
              {tokens.map((t) => <option key={t.sym} value={t.sym}>{t.sym}</option>)}
            </select>
          </div>
          <div className="field" style={{ margin: 0 }}>
            <label>Condition</label>
            <select className="select" value={dir} onChange={(e) => setDir(e.target.value as "above" | "below")}>
              <option value="above">Above</option>
              <option value="below">Below</option>
            </select>
          </div>
          <div className="field" style={{ margin: 0 }}>
            <label>Price (USD)</label>
            <input className="input" inputMode="decimal" value={price} onChange={(e) => setPrice(e.target.value)} placeholder="0.00" />
          </div>
          <button className="btn btn-primary" onClick={onAdd}>Add</button>
        </div>
      </div>

      {alerts.length === 0 && <div className="muted">No alerts yet.</div>}
      {alerts.map((a) => {
        const t = tokens.find((x) => x.sym === a.sym);
        const armed = t ? (a.dir === "above" ? t.price >= a.price : t.price <= a.price) : false;
        const dist = t ? Math.abs(((t.price - a.price) / a.price) * 100) : 0;
        return (
          <div className="tx" key={a.id}>
            <div className="tx-ic in" style={{ background: "rgba(110,99,255,.16)", color: "var(--accent)" }}><Icon name="bell" size={18} /></div>
            <div className="tx-main">
              <div className="tx-title">{a.sym} {a.dir} {fmtUsd(a.price)}</div>
              <div className="tx-sub">{!a.on ? "Paused" : armed ? "● Triggered — condition met" : t ? `● Live · now ${fmtUsd(t.price)} (${dist.toFixed(1)}% away)` : ""}</div>
            </div>
            <button className={`chip${a.on ? " active" : ""}`} onClick={() => toggleAlert(a.id)}>{a.on ? "On" : "Off"}</button>
            <button className="iconbtn" style={{ marginLeft: 8 }} onClick={() => { removeAlert(a.id); showToast("Alert removed"); }} aria-label="Delete"><Icon name="trash" size={16} /></button>
          </div>
        );
      })}
    </div>
  );
}

"use client";

import { useEffect, useState } from "react";
import { EXTERNAL_CALLS, isStrict, setStrict } from "@/lib/privacy";
import { Icon } from "@/components/icons";
import { useWallet } from "@/components/WalletProvider";

const PROMISES = [
  "No analytics, no trackers, no telemetry — Lumen never reports what you do.",
  "No accounts, no email, no KYC — nothing to sign up for.",
  "No cookies and no advertising.",
  "All wallet logic runs in your browser. Your keys are generated and encrypted on your device and never leave it.",
];

export default function PrivacyScreen() {
  const { showToast } = useWallet();
  const [strict, setStrictState] = useState(false);
  useEffect(() => { setStrictState(isStrict()); }, []);

  function toggle() {
    const next = !strict;
    setStrict(next); setStrictState(next);
    showToast(next ? "Strict privacy on" : "Strict privacy off");
  }

  return (
    <div className="view" style={{ maxWidth: 680 }}>
      <div className="view-head">
        <h2>Privacy <span className="chip active" style={{ marginLeft: 8, verticalAlign: "middle" }}>we don&apos;t watch you</span></h2>
        <p className="muted">Most wallets quietly send your addresses to analytics and RPC providers. Lumen doesn&apos;t. Here&apos;s exactly what does and doesn&apos;t leave your device.</p>
      </div>

      <div className="card glass" style={{ marginBottom: 16 }}>
        <div className="section-title" style={{ marginTop: 0 }}>Our promises</div>
        <ul className="reasons">
          {PROMISES.map((p, i) => (
            <li className="reason good" key={i}><span className="dot"><Icon name="check" size={10} /></span><span>{p}</span></li>
          ))}
        </ul>
      </div>

      <div className="card glass" style={{ marginBottom: 16 }}>
        <div className="section-title" style={{ marginTop: 0 }}>The only external requests Lumen makes</div>
        {EXTERNAL_CALLS.map((c) => (
          <div className="tx" key={c.name}>
            <div className={`tx-ic ${c.required ? "in" : "out"}`}><Icon name={c.required ? "globe" : "eye"} size={18} /></div>
            <div className="tx-main"><div className="tx-title">{c.name} {c.required ? <span className="muted">· required</span> : <span className="muted">· cosmetic</span>}</div><div className="tx-sub">{c.purpose}</div></div>
          </div>
        ))}
        <p className="muted" style={{ fontSize: 12, marginTop: 12 }}>The Base RPC node is how any wallet reads the chain — point it at your own node (env var) to share nothing with a public provider.</p>
      </div>

      <div className="card glass" style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div>
          <div style={{ fontWeight: 700 }}>Strict privacy mode</div>
          <div className="muted" style={{ fontSize: 13 }}>Disables the cosmetic external calls (the TradingView chart). Only the RPC remains.</div>
        </div>
        <button className={`chip${strict ? " active" : ""}`} onClick={toggle}>{strict ? "On" : "Off"}</button>
      </div>
    </div>
  );
}

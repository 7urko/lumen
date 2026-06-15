"use client";

import { useEffect, useState } from "react";

const KEY = "lumen.tour.v1";
const STEPS = [
  { title: "Welcome to Lumen", body: "A non-custodial, no-KYC wallet — you hold your keys, we never touch your funds. Here's a 20-second tour." },
  { title: "Your real wallet", body: "“Account” creates a real, password-encrypted wallet on Base Sepolia — real send, real swap, ENS names and QR scan included." },
  { title: "Scam Shield, built in", body: "Before any send, Lumen checks the recipient on-chain — contract or person? first time? unlimited approval? — on by default, no third party." },
  { title: "Approvals & Health", body: "Revoke risky token approvals in one place, and check your Wallet Health security score out of 100." },
  { title: "Private by default", body: "No analytics, no tracking, no accounts. The Privacy screen proves exactly what leaves your device. Tip: press ⌘K / Ctrl-K anywhere to jump around." },
];

export function Tour() {
  const [open, setOpen] = useState(false);
  const [i, setI] = useState(0);

  useEffect(() => {
    if (typeof window !== "undefined" && !localStorage.getItem(KEY)) setOpen(true);
  }, []);

  function done() { localStorage.setItem(KEY, "1"); setOpen(false); }
  if (!open) return null;
  const step = STEPS[i]!;
  const last = i === STEPS.length - 1;

  return (
    <div className="cmd-overlay" style={{ alignItems: "center", paddingTop: 0 }}>
      <div className="cmd glass" style={{ padding: 24, maxWidth: 440 }} onClick={(e) => e.stopPropagation()}>
        <div style={{ display: "flex", gap: 6, marginBottom: 18 }}>
          {STEPS.map((_, n) => <span key={n} style={{ height: 4, flex: 1, borderRadius: 4, background: n <= i ? "var(--accent)" : "var(--line)" }} />)}
        </div>
        <h3 style={{ marginBottom: 8 }}>{step.title}</h3>
        <p className="muted" style={{ marginBottom: 22 }}>{step.body}</p>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <button className="faint" onClick={done}>Skip</button>
          <div style={{ display: "flex", gap: 10 }}>
            {i > 0 && <button className="btn" onClick={() => setI(i - 1)}>Back</button>}
            <button className="btn btn-primary" onClick={() => (last ? done() : setI(i + 1))}>{last ? "Get started" : "Next"}</button>
          </div>
        </div>
      </div>
    </div>
  );
}

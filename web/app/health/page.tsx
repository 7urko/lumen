"use client";

import { useEffect, useState } from "react";
import type { Address } from "viem";
import { hasVault, getAddress } from "@/lib/account";
import { hasSmartWallet } from "@/lib/smart-account";
import { isStrict } from "@/lib/privacy";
import { listApprovals } from "@/lib/approvals";
import { Icon } from "@/components/icons";

interface Check { label: string; ok: boolean; detail: string; weight: number; route: string }

export default function HealthScreen() {
  const [checks, setChecks] = useState<Check[] | null>(null);
  const [score, setScore] = useState(0);

  useEffect(() => {
    (async () => {
      const vault = hasVault();
      const addr = getAddress();
      const strict = isStrict();
      const smart = hasSmartWallet();
      let unlimited = 0, approvalsErr = false;
      if (vault && addr) {
        try { unlimited = (await listApprovals(addr as Address)).filter((r) => r.unlimited).length; }
        catch { approvalsErr = true; }
      }
      const cs: Check[] = [
        { label: "Wallet created & encrypted", ok: vault, weight: 30, route: "/account", detail: vault ? "Your key is stored AES-256 encrypted." : "No wallet yet — create one on the Account screen." },
        { label: "No unlimited token approvals", ok: unlimited === 0, weight: 30, route: "/approvals", detail: approvalsErr ? "Couldn't fully scan (public RPC range limit)." : unlimited === 0 ? "No risky unlimited allowances found." : `${unlimited} unlimited approval(s) — revoke them.` },
        { label: "Passkey smart account", ok: smart, weight: 20, route: "/smart-account", detail: smart ? "A passkey-secured smart account exists." : "Optional: add a passkey smart account." },
        { label: "Strict privacy mode", ok: strict, weight: 20, route: "/privacy", detail: strict ? "Only the RPC is contacted." : "Optional: enable Strict privacy." },
      ];
      setChecks(cs);
      setScore(cs.reduce((s, c) => s + (c.ok ? c.weight : 0), 0));
    })();
  }, []);

  const color = score >= 80 ? "var(--up)" : score >= 50 ? "var(--warn)" : "var(--down)";

  return (
    <div className="view" style={{ maxWidth: 680 }}>
      <div className="view-head">
        <h2>Wallet Health <span className="chip active" style={{ marginLeft: 8, verticalAlign: "middle" }}>self-built score</span></h2>
        <p className="muted">A live security checkup of your wallet — unique to Lumen. No other wallet scores you like this.</p>
      </div>

      <div className="card glass" style={{ textAlign: "center", marginBottom: 18 }}>
        <div className="muted">Security score</div>
        <div className="health-score" style={{ color }}>{checks ? score : "—"}<span style={{ fontSize: 22, color: "var(--muted)" }}>/100</span></div>
      </div>

      {!checks && <div className="muted">Running checks…</div>}
      {checks?.map((c) => (
        <div className="tx" key={c.label}>
          <div className={`tx-ic ${c.ok ? "in" : "out"}`}><Icon name={c.ok ? "check" : "alert"} size={18} /></div>
          <div className="tx-main"><div className="tx-title">{c.label}</div><div className="tx-sub">{c.detail}</div></div>
          {!c.ok && <a className="btn" href={c.route}>Fix →</a>}
        </div>
      ))}
    </div>
  );
}

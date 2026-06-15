"use client";

import { fmtAmt } from "@lumen/core";
import { useWallet } from "@/components/WalletProvider";
import { Coin } from "@/components/Coin";

export default function EarnScreen() {
  const { tokens } = useWallet();
  const stakeable = tokens.filter((t) => t.apy > 0).sort((a, b) => b.apy - a.apy);

  return (
    <div className="view">
      <div className="view-head">
        <h2>Earn <span className="chip active" style={{ marginLeft: 8, verticalAlign: "middle" }}>Non-custodial</span></h2>
        <p className="muted">Lumen doesn&apos;t hold your funds or offer yield itself. Staking happens directly on each protocol — you keep custody the whole time. These are reference rates.</p>
      </div>

      <div className="verdict safe" style={{ marginTop: 0, marginBottom: 18 }}>
        <div className="verdict-head">
          <div className="verdict-badge">i</div>
          <div>
            <div className="verdict-title">You stake on-chain, not with us</div>
            <div className="verdict-sub">Lumen is a non-custodial interface. To stake, you interact with the protocol&apos;s own contracts and keep control of your assets. Rates and lockups are set by the protocol, not Lumen.</div>
          </div>
        </div>
      </div>

      <div className="section-title" style={{ marginTop: 0 }}>Stakeable assets <span className="faint" style={{ float: "right", fontWeight: 600 }}>Reference APYs</span></div>
      {stakeable.map((t) => (
        <div className="tx" key={t.sym}>
          <Coin token={t} />
          <div className="tx-main">
            <div className="tx-title">{t.name}</div>
            <div className="tx-sub">Stake on the protocol · you keep custody{t.staked > 0 ? ` · You hold ${fmtAmt(t.staked)} ${t.sym} staked` : ""}</div>
          </div>
          <div style={{ textAlign: "right" }}>
            <div className="up" style={{ fontWeight: 700 }}>{t.apy.toFixed(1)}%</div>
            <div className="faint" style={{ fontSize: 11 }}>APY ref.</div>
          </div>
        </div>
      ))}
    </div>
  );
}

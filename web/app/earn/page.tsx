"use client";

import { stakeTotals, fmtUsd, fmtAmt } from "@lumen/core";
import { useWallet } from "@/components/WalletProvider";
import { Coin } from "@/components/Coin";

export default function EarnScreen() {
  const { tokens, stake, showToast } = useWallet();
  const { stakedUsd, yearly } = stakeTotals(tokens);
  const stakeable = tokens.filter((t) => t.apy > 0).sort((a, b) => b.apy - a.apy);

  function onStake(sym: string) {
    const t = tokens.find((x) => x.sym === sym)!;
    if (t.balance <= 0) { showToast(`No ${sym} available to stake`); return; }
    let amt = t.balance * 0.5;
    amt = t.price > 1000 ? Math.round(amt * 1000) / 1000 : t.price > 10 ? Math.round(amt * 100) / 100 : Math.round(amt);
    if (amt <= 0) amt = t.balance;
    stake(sym, Math.min(amt, t.balance));
    showToast(`Staked ${fmtAmt(Math.min(amt, t.balance))} ${sym}`);
  }

  return (
    <div className="view">
      <div className="view-head"><h2>Earn</h2><p className="muted">Stake assets to earn yield. Liquid — unstake anytime.</p></div>
      <div className="card glass" style={{ marginBottom: 18 }}>
        <div className="hero-label">Currently staked</div>
        <div className="balance" style={{ fontSize: 38 }}>{fmtUsd(stakedUsd)}</div>
        <div className="up" style={{ fontWeight: 600 }}>Earning ≈ {fmtUsd(yearly)} / yr</div>
      </div>
      <div className="section-title" style={{ marginTop: 0 }}>Stake your assets <span className="faint" style={{ float: "right", fontWeight: 600 }}>Mock APYs</span></div>
      {stakeable.map((t) => (
        <div className="tx" key={t.sym}>
          <Coin token={t} />
          <div className="tx-main">
            <div className="tx-title">{t.name} staking</div>
            <div className="tx-sub">Liquid · unstake anytime{t.staked > 0 ? ` · Staked ${fmtAmt(t.staked)} ${t.sym}` : ""}</div>
          </div>
          <div style={{ textAlign: "right", marginRight: 14 }}>
            <div className="up" style={{ fontWeight: 700 }}>{t.apy.toFixed(1)}%</div>
            <div className="faint" style={{ fontSize: 11 }}>APY</div>
          </div>
          <button className="btn" onClick={() => onStake(t.sym)}>Stake</button>
        </div>
      ))}
    </div>
  );
}

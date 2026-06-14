"use client";

import Link from "next/link";
import { computePnl, totalUsd, fmtUsd, fmtSigned, fmtAmt, type Token } from "@lumen/core";
import { useWallet } from "@/components/WalletProvider";
import { Sparkline } from "@/components/Sparkline";
import { Coin } from "@/components/Coin";
import { Icon } from "@/components/icons";

function seedFor(sym: string): number {
  let h = 0;
  for (let i = 0; i < sym.length; i++) h = (h * 31 + sym.charCodeAt(i)) % 997;
  return h + 3;
}

export default function Dashboard() {
  const { tokens, showToast } = useWallet();
  const total = totalUsd(tokens);
  const pnl = computePnl(tokens);
  const sorted: Token[] = [...tokens].sort((a, b) => (b.balance + b.staked) * b.price - (a.balance + a.staked) * a.price);

  return (
    <div className="view">
      <section className="hero glass">
        <div className="hero-label">Total balance</div>
        <h1 className="balance">{fmtUsd(total)}</h1>
        <div className={`change ${pnl.day >= 0 ? "pos" : "neg"}`}>
          <Icon name={pnl.day >= 0 ? "markets" : "activity"} size={16} />
          {fmtSigned(pnl.day)} ({pnl.dayPct >= 0 ? "+" : ""}{pnl.dayPct.toFixed(2)}%) today
        </div>
        <div className="hero-spark">
          <Sparkline seed={42} change={pnl.dayPct} width={600} height={76} color="var(--accent-2)" />
        </div>
        <div className="pnl-strip">
          <div>
            <div className="lbl">Total P&amp;L</div>
            <div className={`val ${pnl.total >= 0 ? "pos" : "neg"}`}>{fmtSigned(pnl.total)} ({pnl.totalPct >= 0 ? "+" : ""}{pnl.totalPct.toFixed(1)}%)</div>
          </div>
          <div>
            <div className="lbl">24h P&amp;L</div>
            <div className={`val ${pnl.day >= 0 ? "pos" : "neg"}`}>{fmtSigned(pnl.day)} ({pnl.dayPct >= 0 ? "+" : ""}{pnl.dayPct.toFixed(2)}%)</div>
          </div>
        </div>
      </section>

      <div className="quick">
        <Link href="/send" className="quickbtn"><span className="ic"><Icon name="send" size={20} /></span><span>Send</span></Link>
        <Link href="/receive" className="quickbtn"><span className="ic"><Icon name="receive" size={20} /></span><span>Receive</span></Link>
        <button className="quickbtn" onClick={() => showToast("Buy / on-ramp arrives in v1.x")}><span className="ic"><Icon name="buy" size={20} /></span><span>Buy</span></button>
        <button className="quickbtn" onClick={() => showToast("Swap arrives in v1.x")}><span className="ic"><Icon name="swap" size={20} /></span><span>Swap</span></button>
      </div>

      <div className="section-title">Assets</div>
      <div className="tokens">
        {sorted.map((t) => {
          const value = (t.balance + t.staked) * t.price;
          return (
            <div className="token" key={t.sym}>
              <Coin token={t} />
              <div className="token-main">
                <div className="token-name">{t.name}</div>
                <div className="token-sub">{fmtAmt(t.balance + t.staked)} {t.sym}</div>
              </div>
              <div className="token-spark"><Sparkline seed={seedFor(t.sym)} change={t.change} /></div>
              <div className="token-right">
                <div className="token-val">{fmtUsd(value)}</div>
                <div className={`token-chg ${t.change >= 0 ? "pos" : "neg"}`}>{t.change >= 0 ? "+" : ""}{t.change.toFixed(1)}%</div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

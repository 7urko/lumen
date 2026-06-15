"use client";

import Link from "next/link";
import { fmtUsd, fmtAmt } from "@lumen/core";
import { useWallet } from "@/components/WalletProvider";
import { Coin } from "@/components/Coin";
import { Icon } from "@/components/icons";
import { AnimatedNumber } from "@/components/AnimatedNumber";
import { ConnectGate } from "@/components/ConnectGate";

export default function Dashboard() {
  const { tokens, totalUsd, loading, address, connected, refresh } = useWallet();
  const sorted = [...tokens].sort((a, b) => b.balance * b.price - a.balance * a.price).filter((t) => t.balance > 0 || t.sym === "ETH");

  return (
    <div className="view">
      <section className="hero glass">
        <div className="hero-label">Total balance · Base Sepolia (testnet)</div>
        <h1 className="balance"><AnimatedNumber value={totalUsd} format={fmtUsd} /></h1>
        <div className="muted">
          {connected ? `Connected · ${address?.slice(0, 6)}…${address?.slice(-4)}` : "No wallet connected"}{loading ? " · refreshing…" : ""}
        </div>
      </section>

      <div className="quick">
        <Link href="/send" className="quickbtn"><span className="ic"><Icon name="send" size={20} /></span><span>Send</span></Link>
        <Link href="/receive" className="quickbtn"><span className="ic"><Icon name="receive" size={20} /></span><span>Receive</span></Link>
        <Link href="/buy" className="quickbtn"><span className="ic"><Icon name="buy" size={20} /></span><span>Add funds</span></Link>
        <Link href="/swap" className="quickbtn"><span className="ic"><Icon name="swap" size={20} /></span><span>Swap</span></Link>
      </div>

      <ConnectGate connected={connected}>
        <div className="section-title">Assets <button onClick={() => refresh()} className="faint" style={{ float: "right", fontWeight: 600 }}>Refresh</button></div>
        {sorted.length === 0 && <div className="muted">No assets yet — use “Add funds” to receive test ETH from a faucet.</div>}
        <div className="tokens">
          {sorted.map((t) => (
            <div className="token" key={t.sym}>
              <Coin token={t} />
              <div className="token-main"><div className="token-name">{t.name}</div><div className="token-sub">{fmtAmt(t.balance)} {t.sym}</div></div>
              <div className="token-right"><div className="token-val">{fmtUsd(t.balance * t.price)}</div></div>
            </div>
          ))}
        </div>
      </ConnectGate>
    </div>
  );
}

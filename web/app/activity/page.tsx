"use client";

import { useWallet } from "@/components/WalletProvider";
import { ConnectGate } from "@/components/ConnectGate";

export default function ActivityScreen() {
  const { address, connected } = useWallet();
  return (
    <div className="view" style={{ maxWidth: 720 }}>
      <div className="view-head"><h2>Activity</h2><p className="muted">Your real on-chain history.</p></div>
      <ConnectGate connected={connected}>
        <div className="card glass" style={{ textAlign: "center" }}>
          <p className="muted" style={{ marginBottom: 14 }}>
            Full, complete transaction history needs a block explorer or indexer — and Lumen deliberately ships
            no third-party indexer. View your real, complete history for this address on Basescan.
          </p>
          <a className="btn btn-primary" style={{ display: "inline-flex" }} href={`https://sepolia.basescan.org/address/${address}`} target="_blank" rel="noopener noreferrer">Open on Basescan ↗</a>
        </div>
      </ConnectGate>
    </div>
  );
}

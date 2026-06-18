"use client";

import { useWallet } from "@/components/WalletProvider";
import { SwapCard } from "@/components/SwapCard";
import { ConnectGate } from "@/components/ConnectGate";
import { ACTIVE_LABEL } from "@/lib/config";

export default function SwapScreen() {
  const { connected } = useWallet();
  return (
    <div className="view" style={{ maxWidth: 600 }}>
      <div className="view-head"><h2>Swap</h2><p className="muted">A real on-chain swap on {ACTIVE_LABEL}. ETH↔WETH always works; token pairs need pool liquidity.</p></div>
      <ConnectGate connected={connected}><SwapCard /></ConnectGate>
    </div>
  );
}

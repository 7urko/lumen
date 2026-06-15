"use client";

import { useWallet } from "@/components/WalletProvider";
import { SwapCard } from "@/components/SwapCard";
import { ConnectGate } from "@/components/ConnectGate";

export default function SwapScreen() {
  const { connected } = useWallet();
  return (
    <div className="view" style={{ maxWidth: 600 }}>
      <div className="view-head"><h2>Swap</h2><p className="muted">A real on-chain swap on Base Sepolia. ETH↔WETH always works; token pairs need pool liquidity.</p></div>
      <ConnectGate connected={connected}><SwapCard /></ConnectGate>
    </div>
  );
}

"use client";

import type { ReactNode } from "react";
import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { Sidebar } from "./Sidebar";
import { Icon } from "./icons";
import { useWallet } from "./WalletProvider";
import { GasWidget } from "./GasWidget";
import { CommandPalette } from "./CommandPalette";
import { Tour } from "./Tour";
import { applyAccent, getAccentName } from "@/lib/theme";

export function Shell({ children }: { children: ReactNode }) {
  const { username, toast, showToast } = useWallet();
  const router = useRouter();
  useEffect(() => { applyAccent(getAccentName()); }, []);

  return (
    <div className="shell">
      <Sidebar />
      <div className="content">
        <header className="topbar">
          <div>
            <div className="wallet-name">Main Wallet</div>
            <div className="wallet-user">{username}</div>
          </div>
          <div className="topbar-actions" style={{ alignItems: "center" }}>
            <GasWidget />
            <button className="iconbtn" aria-label="Command palette" title="Command palette (Ctrl/⌘ K)"
              onClick={() => window.dispatchEvent(new KeyboardEvent("keydown", { key: "k", ctrlKey: true }))}>
              <span style={{ fontSize: 11, fontWeight: 700 }}>⌘K</span>
            </button>
            <button className="iconbtn" aria-label="Copilot" onClick={() => router.push("/copilot")}><Icon name="spark" size={18} /></button>
            <button className="iconbtn" aria-label="Lock wallet" onClick={() => { showToast("Locking wallet…"); router.push("/unlock"); }}><Icon name="lock" size={18} /></button>
          </div>
        </header>
        <main>{children}</main>
        {toast && <div className="toast">{toast}</div>}
        <div className="demo-banner">Lumen is non-custodial · you hold your keys · no KYC · demo data unless connected to a chain</div>
      </div>
      <CommandPalette />
      <Tour />
    </div>
  );
}

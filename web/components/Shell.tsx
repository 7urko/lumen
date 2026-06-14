"use client";

import type { ReactNode } from "react";
import { Sidebar } from "./Sidebar";
import { Icon } from "./icons";
import { useWallet } from "./WalletProvider";

export function Shell({ children }: { children: ReactNode }) {
  const { username, toast, showToast } = useWallet();
  return (
    <div className="shell">
      <Sidebar />
      <div className="content">
        <header className="topbar">
          <div>
            <div className="wallet-name">Main Wallet</div>
            <div className="wallet-user">{username}</div>
          </div>
          <div className="topbar-actions">
            <button className="iconbtn" aria-label="Scan" onClick={() => showToast("Scanner is a demo control")}>
              <Icon name="scan" size={18} />
            </button>
            <button className="iconbtn" aria-label="Lock" onClick={() => showToast("Wallet would lock here")}>
              <Icon name="lock" size={18} />
            </button>
          </div>
        </header>
        <main>{children}</main>
        {toast && <div className="toast">{toast}</div>}
        <div className="demo-banner">Lumen is a UI demo · balances and addresses are mock · nothing touches a blockchain</div>
      </div>
    </div>
  );
}

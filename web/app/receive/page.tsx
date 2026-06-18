"use client";

import { useEffect, useRef } from "react";
import QRCode from "qrcode";
import { useWallet } from "@/components/WalletProvider";
import { Icon } from "@/components/icons";
import { ConnectGate } from "@/components/ConnectGate";
import { ACTIVE_LABEL } from "@/lib/config";

export default function ReceiveScreen() {
  const { address, connected, showToast } = useWallet();
  const ref = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    if (address && ref.current) QRCode.toCanvas(ref.current, address, { width: 200, margin: 1, color: { dark: "#06060c", light: "#ffffff" } }).catch(() => {});
  }, [address]);

  return (
    <div className="view" style={{ maxWidth: 600 }}>
      <div className="view-head"><h2>Receive</h2><p className="muted">Your real wallet address on {ACTIVE_LABEL}. Share it to get paid.</p></div>
      <ConnectGate connected={connected}>
        <div className="card glass qr-wrap">
          <div className="qr"><canvas ref={ref} /></div>
          <div className="addr-box" style={{ width: "100%" }}>
            <span style={{ flex: 1 }}>{address}</span>
            <button className="iconbtn" onClick={() => { if (address) { navigator.clipboard?.writeText(address); showToast("Address copied"); } }} aria-label="Copy"><Icon name="copy" size={18} /></button>
          </div>
        </div>
      </ConnectGate>
    </div>
  );
}

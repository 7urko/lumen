"use client";

import { useEffect, useRef } from "react";
import QRCode from "qrcode";
import { useWallet } from "@/components/WalletProvider";
import { Icon } from "@/components/icons";

export default function ReceiveScreen() {
  const { address, username, showToast } = useWallet();
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (!canvasRef.current) return;
    QRCode.toCanvas(canvasRef.current, address, {
      width: 196,
      margin: 1,
      color: { dark: "#06060c", light: "#ffffff" },
    }).catch(() => {});
  }, [address]);

  function copy() {
    navigator.clipboard?.writeText(address).then(() => showToast("Address copied")).catch(() => showToast("Copy failed"));
  }

  return (
    <div className="view" style={{ maxWidth: 600 }}>
      <div className="view-head">
        <h2>Receive</h2>
        <p className="muted">Share your username or address to get paid.</p>
      </div>
      <div className="card glass qr-wrap">
        <div className="qr"><canvas ref={canvasRef} /></div>
        <div style={{ textAlign: "center" }}>
          <div style={{ fontWeight: 700, fontSize: 18 }}>{username}</div>
          <div className="muted" style={{ fontSize: 13 }}>Your Lumen username</div>
        </div>
        <div className="addr-box" style={{ width: "100%" }}>
          <span style={{ flex: 1 }}>{address}</span>
          <button className="iconbtn" onClick={copy} aria-label="Copy address"><Icon name="copy" size={18} /></button>
        </div>
      </div>
    </div>
  );
}

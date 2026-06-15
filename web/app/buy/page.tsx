"use client";

import Link from "next/link";
import { shortAddr } from "@lumen/core";
import { useWallet } from "@/components/WalletProvider";
import { Icon } from "@/components/icons";

const ONRAMPS = [
  { name: "Coinbase", url: "https://www.coinbase.com" },
  { name: "Kraken", url: "https://www.kraken.com" },
  { name: "MoonPay", url: "https://www.moonpay.com" },
];

export default function AddFundsScreen() {
  const { address, username, showToast } = useWallet();
  return (
    <div className="view" style={{ maxWidth: 600 }}>
      <div className="view-head">
        <h2>Add funds <span className="chip active" style={{ marginLeft: 8, verticalAlign: "middle" }}>Non-custodial</span></h2>
        <p className="muted">Lumen never holds your money or processes payments — you keep full control of your keys. Fund your wallet one of two ways.</p>
      </div>

      <div className="card glass" style={{ marginBottom: 16 }}>
        <div className="section-title" style={{ marginTop: 0 }}>1 · Receive crypto you already hold</div>
        <p className="muted" style={{ marginBottom: 12 }}>Send any supported asset to your address from another wallet or exchange.</p>
        <div className="addr-box" style={{ marginBottom: 12 }}>
          <span style={{ flex: 1 }}>{username} · {shortAddr(address)}</span>
          <button className="iconbtn" onClick={() => { navigator.clipboard?.writeText(address); showToast("Address copied"); }} aria-label="Copy"><Icon name="copy" size={18} /></button>
        </div>
        <Link href="/receive" className="btn btn-primary btn-block"><Icon name="receive" size={18} /> Show my QR &amp; address</Link>
      </div>

      <div className="card glass">
        <div className="section-title" style={{ marginTop: 0 }}>2 · Buy with an external on-ramp</div>
        <p className="muted" style={{ marginBottom: 12 }}>
          Buy crypto on any exchange or on-ramp you trust, then send it to the address above. These are
          independent services — <b>they handle their own identity checks, not Lumen</b>. Lumen stays out
          of the payment flow entirely.
        </p>
        <div className="chip-row">
          {ONRAMPS.map((o) => (
            <a key={o.name} className="chip" href={o.url} target="_blank" rel="noopener noreferrer">{o.name} ↗</a>
          ))}
        </div>
      </div>

      <p className="muted" style={{ fontSize: 12, marginTop: 16, textAlign: "center" }}>
        Non-custodial · no KYC on Lumen · you hold your keys. Buying with fiat happens entirely on the external provider.
      </p>
    </div>
  );
}

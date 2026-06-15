"use client";

import { Suspense, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import type { Address, Hex } from "viem";
import { fmtAmt } from "@lumen/core";
import { useWallet } from "@/components/WalletProvider";
import { isUnlocked, sendTestEth } from "@/lib/account";
import { recordRecipient } from "@/lib/scam-onchain";
import { RecipientField } from "@/components/RecipientField";
import { ConnectGate } from "@/components/ConnectGate";

function SendInner() {
  const { connected, tokens, showToast, refresh } = useWallet();
  const router = useRouter();
  const params = useSearchParams();
  const eth = tokens.find((t) => t.sym === "ETH");
  const [amount, setAmount] = useState(params.get("amount") ?? "");
  const [to, setTo] = useState(params.get("to") ?? "");
  const [resolvedTo, setResolvedTo] = useState<Address | null>(null);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");
  const [txHash, setTxHash] = useState<Hex | null>(null);
  const unlocked = isUnlocked();
  const amt = parseFloat(amount) || 0;

  async function onSend() {
    setErr(""); setTxHash(null);
    if (!resolvedTo) { setErr("Enter a valid address or .eth name"); return; }
    if (amt <= 0) { setErr("Enter an amount"); return; }
    setBusy(true);
    try {
      const h = await sendTestEth(resolvedTo, amount);
      recordRecipient(resolvedTo);
      setTxHash(h); showToast("Sent"); setAmount(""); setTo("");
      setTimeout(() => refresh(), 4000);
    } catch (e) { setErr(e instanceof Error ? e.message : "Send failed (is the wallet funded?)"); }
    finally { setBusy(false); }
  }

  return (
    <div className="view" style={{ maxWidth: 600 }}>
      <div className="view-head"><h2>Send</h2><p className="muted">A real testnet send of native ETH on Base Sepolia, checked by Scam Shield before it leaves.</p></div>
      <ConnectGate connected={connected}>
        {!unlocked ? (
          <div className="card glass" style={{ textAlign: "center" }}>
            <p className="muted" style={{ marginBottom: 12 }}>Wallet locked. Unlock it to send.</p>
            <Link href="/account" className="btn btn-primary" style={{ display: "inline-flex" }}>Unlock wallet</Link>
          </div>
        ) : (
          <div className="card glass">
            <div className="field">
              <label>Amount (ETH)</label>
              <input className="input" inputMode="decimal" placeholder="0.00" value={amount} onChange={(e) => setAmount(e.target.value)} />
              <div className="hint" style={{ display: "flex", justifyContent: "space-between" }}>
                <span>{eth ? `Balance ${fmtAmt(eth.balance)} ETH` : ""}</span>
                {eth && <button className="faint" style={{ fontWeight: 600 }} onClick={() => setAmount(String(eth.balance))}>Max</button>}
              </div>
            </div>
            <RecipientField value={to} onChange={setTo} onResolved={setResolvedTo} />
            {err && <div className="hint bad" style={{ marginBottom: 10 }}>{err}</div>}
            {txHash && <div className="hint good" style={{ marginBottom: 10 }}>Broadcast ✓ <a href={`https://sepolia.basescan.org/tx/${txHash}`} target="_blank" rel="noopener noreferrer" style={{ color: "var(--accent-2)" }}>view tx →</a></div>}
            <button className="btn btn-primary btn-block" disabled={busy} onClick={onSend}>{busy ? "Signing & broadcasting…" : "Sign & send"}</button>
          </div>
        )}
      </ConnectGate>
    </div>
  );
}

export default function SendScreen() {
  return <Suspense fallback={<div className="view" />}><SendInner /></Suspense>;
}

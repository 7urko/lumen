"use client";

import { Suspense, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import type { Address, Hex } from "viem";
import { fmtAmt } from "@lumen/core";
import { useWallet } from "@/components/WalletProvider";
import { canSign, bundlerReady, sendNative } from "@/lib/wallet";
import { recordRecipient } from "@/lib/scam-onchain";
import { ACTIVE_EXPLORER, ACTIVE_LABEL } from "@/lib/config";
import { RecipientField } from "@/components/RecipientField";
import { ConnectGate } from "@/components/ConnectGate";

function SendInner() {
  const { connected, kind, tokens, showToast, refresh } = useWallet();
  const router = useRouter();
  const params = useSearchParams();
  const eth = tokens.find((t) => t.sym === "ETH");
  const [amount, setAmount] = useState(params.get("amount") ?? "");
  const [to, setTo] = useState(params.get("to") ?? "");
  const [resolvedTo, setResolvedTo] = useState<Address | null>(null);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");
  const [txHash, setTxHash] = useState<Hex | null>(null);

  const amt = parseFloat(amount) || 0;
  const smartNeedsBundler = kind === "smart" && !bundlerReady();
  const locked = kind === "eoa" && !canSign();

  async function onSend() {
    setErr(""); setTxHash(null);
    if (!resolvedTo) { setErr("Enter a valid address or .eth name"); return; }
    if (amt <= 0) { setErr("Enter an amount"); return; }
    setBusy(true);
    try {
      const h = await sendNative(resolvedTo, amount);
      recordRecipient(resolvedTo);
      setTxHash(h); showToast("Sent"); setAmount(""); setTo("");
      setTimeout(() => refresh(), 5000);
    } catch (e) { setErr(e instanceof Error ? e.message : "Send failed (is the wallet funded?)"); }
    finally { setBusy(false); }
  }

  return (
    <div className="view" style={{ maxWidth: 600 }}>
      <div className="view-head">
        <h2>Send</h2>
        <p className="muted">{kind === "smart" ? "Sent from your passkey smart account — your passkey signs, no stored key." : `Sending native ETH on ${ACTIVE_LABEL}.`} Checked by Scam Shield first.</p>
      </div>
      <ConnectGate connected={connected}>
        {smartNeedsBundler ? (
          <div className="verdict caution"><div className="verdict-head"><div className="verdict-badge">i</div><div>
            <div className="verdict-title">Bundler required to send</div>
            <div className="verdict-sub">Your smart account is the secure, no-stored-key wallet — but sending a UserOperation needs your self-hosted bundler running. Set <code>NEXT_PUBLIC_BUNDLER_URL</code> (see BUNDLER.md). Receiving works without it.</div>
          </div></div></div>
        ) : locked ? (
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
            {txHash && <div className="hint good" style={{ marginBottom: 10 }}>Broadcast ✓ <a href={`${ACTIVE_EXPLORER}/tx/${txHash}`} target="_blank" rel="noopener noreferrer" style={{ color: "var(--accent-2)" }}>view tx →</a></div>}
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

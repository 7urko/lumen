"use client";

import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import QRCode from "qrcode";
import { isAddress } from "@/lib/chain";
import type { Address, Hex } from "viem";
import {
  hasVault, getAddress, isUnlocked, lock, createVault, unlock, removeVault, getBalance, sendTestEth,
  passwordStrength, onAutoLock,
} from "@/lib/account";
import { useWallet } from "@/components/WalletProvider";
import { Icon } from "@/components/icons";
import { SwapCard } from "@/components/SwapCard";
import { RecipientField } from "@/components/RecipientField";
import { recordRecipient } from "@/lib/scam-onchain";
import { ACTIVE_EXPLORER as EXPLORER, ACTIVE_LABEL, IS_MAINNET } from "@/lib/config";

type Stage = "loading" | "create" | "locked" | "unlocked";

export default function AccountScreen() {
  const { showToast } = useWallet();
  const [stage, setStage] = useState<Stage>("loading");
  const [address, setAddress] = useState<Address | null>(null);
  const [pw, setPw] = useState("");
  const [pw2, setPw2] = useState("");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");
  const [balance, setBalance] = useState<number | null>(null);
  const [to, setTo] = useState("");
  const [resolvedTo, setResolvedTo] = useState<Address | null>(null);
  const [amt, setAmt] = useState("0.001");
  const [txHash, setTxHash] = useState<Hex | null>(null);
  const qrRef = useRef<HTMLCanvasElement>(null);

  const refresh = useCallback(async (addr: Address) => {
    try { setBalance(await getBalance(addr)); } catch { setBalance(null); }
  }, []);

  useEffect(() => {
    if (hasVault()) {
      setAddress(getAddress());
      setStage(isUnlocked() ? "unlocked" : "locked");
    } else {
      setStage("create");
    }
  }, []);

  // M2 — react to idle/visibility auto-lock by flipping to the locked view.
  useEffect(() => onAutoLock(() => {
    setStage((s) => (s === "unlocked" ? "locked" : s));
    setBalance(null);
    showToast("Auto-locked for your security");
  }), [showToast]);

  const strength = passwordStrength(pw);

  useEffect(() => {
    if (stage === "unlocked" && address) {
      void refresh(address);
      if (qrRef.current) QRCode.toCanvas(qrRef.current, address, { width: 160, margin: 1, color: { dark: "#06060c", light: "#ffffff" } }).catch(() => {});
    }
  }, [stage, address, refresh]);

  async function onCreate() {
    setErr("");
    if (!strength.acceptable) { setErr(strength.issues[0] ?? "Choose a stronger password"); return; }
    if (pw !== pw2) { setErr("Passwords don't match"); return; }
    setBusy(true);
    try {
      const addr = await createVault(pw);
      setAddress(addr); setPw(""); setPw2(""); setStage("unlocked");
      showToast("Encrypted wallet created");
    } catch (e) { setErr(e instanceof Error ? e.message : "Failed to create wallet"); }
    finally { setBusy(false); }
  }

  async function onUnlock() {
    setErr(""); setBusy(true);
    try {
      const ok = await unlock(pw);
      if (ok) { setPw(""); setStage("unlocked"); showToast("Unlocked"); }
      else setErr("Wrong password");
    } finally { setBusy(false); }
  }

  function onLock() { lock(); setStage("locked"); setBalance(null); showToast("Locked"); }

  async function onSend() {
    setErr(""); setTxHash(null);
    if (!resolvedTo) { setErr("Enter a valid 0x address or .eth name"); return; }
    const n = parseFloat(amt);
    if (!n || n <= 0) { setErr("Enter an amount"); return; }
    setBusy(true);
    try {
      const hash = await sendTestEth(resolvedTo, amt);
      recordRecipient(resolvedTo);
      setTxHash(hash); showToast("Transaction broadcast");
      if (address) setTimeout(() => void refresh(address), 4000);
    } catch (e) { setErr(e instanceof Error ? e.message : "Send failed (is the wallet funded?)"); }
    finally { setBusy(false); }
  }

  function onRemove() {
    removeVault();
    setAddress(null); setBalance(null); setTxHash(null); setStage("create");
    showToast("Wallet removed from this browser");
  }

  return (
    <div className="view" style={{ maxWidth: 600 }}>
      <div className="view-head">
        <h2>Account <span className="chip active" style={{ marginLeft: 8, verticalAlign: "middle" }}>{ACTIVE_LABEL} · encrypted</span></h2>
        <p className="muted">A real, self-built wallet on testnet. Your key is generated in your browser and stored <b>encrypted</b> (AES-256, unlocked by your password) — never in the clear, never sent anywhere.</p>
      </div>

      <div className="verdict safe" style={{ marginTop: 0, marginBottom: 16 }}>
        <div className="verdict-head">
          <div className="verdict-badge"><Icon name="shield" size={20} /></div>
          <div>
            <div className="verdict-title">Recommended: passkey Smart Account</div>
            <div className="verdict-sub">The secure way to hold funds — <b>no private key is stored anywhere</b>; your passkey is the on-chain signer. The password wallet below keeps an encrypted key in this browser: fine for quick testnet dev, <b>not safe for real money</b>.</div>
          </div>
        </div>
        <Link href="/smart-account" className="btn btn-primary" style={{ marginTop: 12, display: "inline-flex" }}>Set up Smart Account →</Link>
      </div>

      <div className="verdict caution" style={{ marginTop: 0 }}>
        <div className="verdict-head">
          <div className="verdict-badge"><Icon name="alert" size={20} /></div>
          <div>
            <div className="verdict-title">Testnet only</div>
            <div className="verdict-sub">Encrypted browser storage is fine for valueless test ETH. For real mainnet funds, a hardware signer or the passkey smart account (/smart-account) is stronger. If you forget the password, the wallet can&apos;t be recovered.</div>
          </div>
        </div>
      </div>

      {stage === "create" && IS_MAINNET && (
        <div className="card glass" style={{ marginTop: 18 }}>
          <p className="muted">On mainnet, the password-encrypted browser wallet is disabled — a key kept in the browser isn&apos;t safe for real funds. Use the passkey <b>Smart Account</b> above to hold real ETH.</p>
        </div>
      )}

      {stage === "create" && !IS_MAINNET && (
        <div className="card glass" style={{ marginTop: 18 }}>
          <p className="muted" style={{ marginBottom: 14 }}>Set a strong password to encrypt your new wallet. You&apos;ll enter it to unlock and sign. It can&apos;t be recovered, so use your password manager.</p>
          <div className="field"><label>Password</label><input className="input" type="password" value={pw} onChange={(e) => setPw(e.target.value)} placeholder="At least 12 characters, mixed types" /></div>
          {pw && (
            <div style={{ margin: "-6px 0 12px" }}>
              <div style={{ display: "flex", gap: 4, marginBottom: 6 }}>
                {[0, 1, 2, 3].map((i) => (
                  <div key={i} style={{ flex: 1, height: 4, borderRadius: 2, background: i < strength.score ? (strength.score >= 4 ? "var(--good, #36d399)" : strength.score >= 3 ? "var(--accent-2, #7aa2ff)" : "var(--warn, #f5a524)") : "rgba(255,255,255,0.12)" }} />
                ))}
              </div>
              <div className="hint" style={{ color: strength.acceptable ? "var(--good, #36d399)" : "var(--muted)" }}>
                {strength.label}{strength.issues.length ? ` · ${strength.issues[0]}` : strength.acceptable ? " · good to go" : ""}
              </div>
            </div>
          )}
          <div className="field"><label>Confirm password</label><input className="input" type="password" value={pw2} onChange={(e) => setPw2(e.target.value)} /></div>
          {err && <div className="hint bad" style={{ marginBottom: 10 }}>{err}</div>}
          <button className="btn btn-primary btn-block" disabled={busy} onClick={onCreate}>{busy ? "Encrypting…" : "Create encrypted wallet"}</button>
        </div>
      )}

      {stage === "locked" && (
        <div className="card glass" style={{ marginTop: 18 }}>
          <p className="muted" style={{ marginBottom: 8 }}>Wallet locked{address ? ` · ${address.slice(0, 6)}…${address.slice(-4)}` : ""}. Enter your password to unlock.</p>
          <div className="field"><label>Password</label><input className="input" type="password" value={pw} onChange={(e) => setPw(e.target.value)} onKeyDown={(e) => e.key === "Enter" && onUnlock()} /></div>
          {err && <div className="hint bad" style={{ marginBottom: 10 }}>{err}</div>}
          <button className="btn btn-primary btn-block" disabled={busy} onClick={onUnlock}>{busy ? "Unlocking…" : "Unlock"}</button>
          <div style={{ textAlign: "center", marginTop: 12 }}><button className="faint" onClick={onRemove}>Forget this wallet</button></div>
        </div>
      )}

      {stage === "unlocked" && address && (
        <>
          <div className="card glass qr-wrap" style={{ marginTop: 18 }}>
            <div className="qr"><canvas ref={qrRef} /></div>
            <div className="addr-box" style={{ width: "100%" }}>
              <span style={{ flex: 1 }}>{address}</span>
              <button className="iconbtn" onClick={() => { navigator.clipboard?.writeText(address); showToast("Address copied"); }} aria-label="Copy"><Icon name="copy" size={18} /></button>
            </div>
            <div style={{ display: "flex", gap: 28, justifyContent: "center", flexWrap: "wrap" }}>
              <div style={{ textAlign: "center" }}><div className="muted" style={{ fontSize: 12 }}>Balance</div><div style={{ fontWeight: 700, fontSize: 18 }}>{balance == null ? "…" : `${balance.toFixed(5)} ETH`}</div></div>
            </div>
            <div style={{ display: "flex", gap: 10, flexWrap: "wrap", justifyContent: "center" }}>
              <button className="btn" onClick={() => address && refresh(address)}>Refresh</button>
              <a className="btn" href="https://docs.base.org/tools/network-faucets" target="_blank" rel="noopener noreferrer">Get test ETH</a>
              <button className="btn" onClick={onLock}>Lock</button>
            </div>
          </div>

          <div className="card glass" style={{ marginTop: 18 }}>
            <div className="section-title" style={{ marginTop: 0 }}>Send test ETH</div>
            <RecipientField value={to} onChange={setTo} onResolved={setResolvedTo} />
            <div className="field"><label>Amount (ETH)</label><input className="input" inputMode="decimal" value={amt} onChange={(e) => setAmt(e.target.value)} /></div>
            {err && <div className="hint bad" style={{ marginBottom: 10 }}>{err}</div>}
            {txHash && <div className="hint good" style={{ marginBottom: 10 }}>Broadcast ✓ <a href={`${EXPLORER}/tx/${txHash}`} target="_blank" rel="noopener noreferrer" style={{ color: "var(--accent-2)" }}>view tx →</a></div>}
            <button className="btn btn-primary btn-block" disabled={busy} onClick={onSend}>{busy ? "Signing &amp; broadcasting…" : "Sign &amp; send (real testnet tx)"}</button>
          </div>

          <SwapCard />

          <div style={{ textAlign: "center", marginTop: 18 }}><button className="faint" onClick={onRemove}>Remove this wallet from the browser</button></div>
        </>
      )}
    </div>
  );
}

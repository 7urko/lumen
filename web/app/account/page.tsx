"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import QRCode from "qrcode";
import type { Address, Hex } from "viem";
import { isAddress } from "@/lib/chain";
import {
  hasAccount, getAddress, createAccount, removeAccount, getBalance, sendTestEth,
  attachPasskey, isPasskeyProtected,
} from "@/lib/account";
import { passkeySupported, registerPasskey, verifyPasskey } from "@/lib/passkey";
import { useWallet } from "@/components/WalletProvider";
import { Icon } from "@/components/icons";

const EXPLORER = "https://sepolia.basescan.org";

export default function AccountScreen() {
  const { showToast } = useWallet();
  const [address, setAddress] = useState<Address | null>(null);
  const [protectedByPasskey, setProtectedByPasskey] = useState(false);
  const [unlocked, setUnlocked] = useState(false);
  const [balance, setBalance] = useState<number | null>(null);
  const [loadingBal, setLoadingBal] = useState(false);
  const [to, setTo] = useState("");
  const [amt, setAmt] = useState("0.001");
  const [sending, setSending] = useState(false);
  const [txHash, setTxHash] = useState<Hex | null>(null);
  const [err, setErr] = useState("");
  const qrRef = useRef<HTMLCanvasElement>(null);

  const refreshBalance = useCallback(async (addr: Address) => {
    setLoadingBal(true);
    try { setBalance(await getBalance(addr)); } catch { setBalance(null); } finally { setLoadingBal(false); }
  }, []);

  useEffect(() => {
    if (hasAccount()) {
      const addr = getAddress();
      setAddress(addr);
      setProtectedByPasskey(isPasskeyProtected());
      setUnlocked(!isPasskeyProtected());
      if (addr) void refreshBalance(addr);
    }
  }, [refreshBalance]);

  useEffect(() => {
    if (address && qrRef.current) {
      QRCode.toCanvas(qrRef.current, address, { width: 160, margin: 1, color: { dark: "#06060c", light: "#ffffff" } }).catch(() => {});
    }
  }, [address]);

  function create() {
    const addr = createAccount();
    setAddress(addr);
    setUnlocked(true);
    setProtectedByPasskey(false);
    void refreshBalance(addr);
    showToast("Wallet created on Base Sepolia");
  }

  async function addPasskey() {
    try {
      const id = await registerPasskey("Lumen · you.lumen");
      attachPasskey(id);
      setProtectedByPasskey(true);
      showToast("Passkey added");
    } catch (e) {
      showToast(e instanceof Error ? e.message : "Passkey setup failed");
    }
  }

  async function unlock() {
    const ok = await verifyPasskey();
    setUnlocked(ok);
    showToast(ok ? "Unlocked" : "Passkey verification failed");
  }

  async function onSend() {
    setErr(""); setTxHash(null);
    if (!isAddress(to)) { setErr("Enter a valid 0x recipient address"); return; }
    const n = parseFloat(amt);
    if (!n || n <= 0) { setErr("Enter an amount"); return; }
    setSending(true);
    try {
      const hash = await sendTestEth(to as Address, amt);
      setTxHash(hash);
      showToast("Transaction broadcast");
      if (address) setTimeout(() => void refreshBalance(address), 4000);
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Send failed (is the wallet funded?)");
    } finally {
      setSending(false);
    }
  }

  function reset() {
    removeAccount();
    setAddress(null); setBalance(null); setTxHash(null); setProtectedByPasskey(false); setUnlocked(false);
    showToast("Wallet removed from this browser");
  }

  return (
    <div className="view" style={{ maxWidth: 620 }}>
      <div className="view-head">
        <h2>Account <span className="chip active" style={{ marginLeft: 8, verticalAlign: "middle" }}>Base Sepolia · real</span></h2>
        <p className="muted">A real, self-built wallet on testnet — keys generated in your browser, signing done with viem, a passkey as your unlock. No third party.</p>
      </div>

      <div className="verdict caution" style={{ marginTop: 0 }}>
        <div className="verdict-head">
          <div className="verdict-badge"><Icon name="alert" size={20} /></div>
          <div>
            <div className="verdict-title">Testnet only — not hardened for real funds</div>
            <div className="verdict-sub">The key is stored locally in this browser. Fine for valueless test ETH; production needs passkey-encrypted storage + an on-chain smart account (next milestone). Never send mainnet funds here.</div>
          </div>
        </div>
      </div>

      {!address ? (
        <div className="card glass" style={{ marginTop: 18, textAlign: "center" }}>
          <p className="muted" style={{ marginBottom: 16 }}>Create a real Base Sepolia account. No seed phrase — secure it with a passkey after.</p>
          <button className="btn btn-primary btn-block" onClick={create}>Create wallet</button>
        </div>
      ) : (
        <>
          <div className="card glass qr-wrap" style={{ marginTop: 18 }}>
            <div className="qr"><canvas ref={qrRef} /></div>
            <div className="addr-box" style={{ width: "100%" }}>
              <span style={{ flex: 1 }}>{address}</span>
              <button className="iconbtn" onClick={() => { navigator.clipboard?.writeText(address); showToast("Address copied"); }} aria-label="Copy"><Icon name="copy" size={18} /></button>
            </div>
            <div style={{ display: "flex", gap: 28, width: "100%", justifyContent: "center" }}>
              <div style={{ textAlign: "center" }}>
                <div className="muted" style={{ fontSize: 12 }}>Balance (Sepolia)</div>
                <div style={{ fontWeight: 700, fontSize: 18 }}>{loadingBal ? "…" : balance != null ? `${balance.toFixed(5)} ETH` : "—"}</div>
              </div>
              <div style={{ textAlign: "center" }}>
                <div className="muted" style={{ fontSize: 12 }}>Passkey</div>
                <div style={{ fontWeight: 700, fontSize: 18 }}>{protectedByPasskey ? "On" : "Off"}</div>
              </div>
            </div>
            <div style={{ display: "flex", gap: 10, flexWrap: "wrap", justifyContent: "center" }}>
              <button className="btn" onClick={() => address && refreshBalance(address)}>Refresh balance</button>
              {!protectedByPasskey && passkeySupported() && <button className="btn" onClick={addPasskey}>Secure with passkey</button>}
              {protectedByPasskey && !unlocked && <button className="btn btn-primary" onClick={unlock}>Unlock with passkey</button>}
              <a className="btn" href="https://docs.base.org/tools/network-faucets" target="_blank" rel="noopener noreferrer">Get test ETH</a>
            </div>
          </div>

          {unlocked && (
            <div className="card glass" style={{ marginTop: 18 }}>
              <div className="section-title" style={{ marginTop: 0 }}>Send test ETH</div>
              <div className="field"><label>Recipient</label><input className="input" placeholder="0x…" value={to} onChange={(e) => setTo(e.target.value)} spellCheck={false} /></div>
              <div className="field"><label>Amount (ETH)</label><input className="input" inputMode="decimal" value={amt} onChange={(e) => setAmt(e.target.value)} /></div>
              {err && <div className="hint bad" style={{ marginBottom: 10 }}>{err}</div>}
              {txHash && <div className="hint good" style={{ marginBottom: 10 }}>Broadcast ✓ <a href={`${EXPLORER}/tx/${txHash}`} target="_blank" rel="noopener noreferrer" style={{ color: "var(--accent-2)" }}>view tx →</a></div>}
              <button className="btn btn-primary btn-block" disabled={sending} onClick={onSend}>{sending ? "Signing &amp; broadcasting…" : "Sign &amp; send (real testnet tx)"}</button>
            </div>
          )}

          <div style={{ textAlign: "center", marginTop: 18 }}>
            <button className="faint" onClick={reset}>Remove this wallet from the browser</button>
          </div>
        </>
      )}
    </div>
  );
}

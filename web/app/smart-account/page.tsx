"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import QRCode from "qrcode";
import type { Address } from "viem";
import {
  hasSmartWallet, registerSmartWalletPasskey, getSmartAddress, isDeployed,
  getSmartBalanceEth, clearCredential, bundlerConfigured,
} from "@/lib/smart-account";
import { useWallet } from "@/components/WalletProvider";
import { Icon } from "@/components/icons";

const EXPLORER = "https://sepolia.basescan.org";

export default function SmartAccountScreen() {
  const { showToast } = useWallet();
  const [address, setAddress] = useState<Address | null>(null);
  const [deployed, setDeployed] = useState<boolean | null>(null);
  const [balance, setBalance] = useState<number | null>(null);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");
  const qrRef = useRef<HTMLCanvasElement>(null);
  const bundlerOn = bundlerConfigured();

  const refresh = useCallback(async (addr: Address) => {
    try {
      const [dep, bal] = await Promise.all([isDeployed(addr), getSmartBalanceEth(addr)]);
      setDeployed(dep); setBalance(bal);
    } catch { /* keep address; reads can fail on a flaky RPC */ }
  }, []);

  const loadExisting = useCallback(async () => {
    if (!hasSmartWallet()) return;
    setBusy(true); setErr("");
    try {
      const addr = await getSmartAddress();
      setAddress(addr);
      void refresh(addr);
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Could not derive the smart-account address");
    } finally { setBusy(false); }
  }, [refresh]);

  useEffect(() => { void loadExisting(); }, [loadExisting]);

  useEffect(() => {
    if (address && qrRef.current) {
      QRCode.toCanvas(qrRef.current, address, { width: 160, margin: 1, color: { dark: "#06060c", light: "#ffffff" } }).catch(() => {});
    }
  }, [address]);

  async function create() {
    setBusy(true); setErr("");
    try {
      await registerSmartWalletPasskey("Lumen smart account");
      const addr = await getSmartAddress();
      setAddress(addr);
      showToast("Passkey smart account created");
      void refresh(addr);
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Passkey registration failed or was cancelled");
    } finally { setBusy(false); }
  }

  function reset() {
    clearCredential();
    setAddress(null); setDeployed(null); setBalance(null);
    showToast("Passkey reference removed from this browser");
  }

  return (
    <div className="view" style={{ maxWidth: 640 }}>
      <div className="view-head">
        <h2>Smart account <span className="chip active" style={{ marginLeft: 8, verticalAlign: "middle" }}>ERC-4337 · passkey</span></h2>
        <p className="muted">The real no-seed-phrase account: a passkey-owned Coinbase Smart Wallet on Base Sepolia. No private key is stored — your passkey is the signer, verified on-chain.</p>
      </div>

      <div className="verdict safe" style={{ marginTop: 0 }}>
        <div className="verdict-head">
          <div className="verdict-badge"><Icon name="shield" size={20} /></div>
          <div>
            <div className="verdict-title">Self-built · audited open-source contract</div>
            <div className="verdict-sub">Coinbase Smart Wallet (open standard, already on Base) + WebAuthn P-256, via viem. The address is derived from your passkey and deploys on first use. Sending needs a self-hosted bundler (see BUNDLER.md).</div>
          </div>
        </div>
      </div>

      {!address ? (
        <div className="card glass" style={{ marginTop: 18, textAlign: "center" }}>
          <p className="muted" style={{ marginBottom: 16 }}>Create your account with a passkey (Windows Hello / Touch ID). No seed phrase, nothing stored but your passkey&apos;s public key.</p>
          <button className="btn btn-primary btn-block" disabled={busy} onClick={create}>{busy ? "Waiting for passkey…" : "Create passkey smart account"}</button>
          {err && <div className="hint bad" style={{ marginTop: 12 }}>{err}</div>}
        </div>
      ) : (
        <>
          <div className="card glass qr-wrap" style={{ marginTop: 18 }}>
            <div className="qr"><canvas ref={qrRef} /></div>
            <div className="addr-box" style={{ width: "100%" }}>
              <span style={{ flex: 1 }}>{address}</span>
              <button className="iconbtn" onClick={() => { navigator.clipboard?.writeText(address); showToast("Address copied"); }} aria-label="Copy"><Icon name="copy" size={18} /></button>
            </div>
            <div style={{ display: "flex", gap: 28, justifyContent: "center", flexWrap: "wrap" }}>
              <div style={{ textAlign: "center" }}><div className="muted" style={{ fontSize: 12 }}>Status</div><div style={{ fontWeight: 700 }}>{deployed == null ? "…" : deployed ? "Deployed" : "Not deployed yet"}</div></div>
              <div style={{ textAlign: "center" }}><div className="muted" style={{ fontSize: 12 }}>Balance</div><div style={{ fontWeight: 700 }}>{balance == null ? "…" : `${balance.toFixed(5)} ETH`}</div></div>
              <div style={{ textAlign: "center" }}><div className="muted" style={{ fontSize: 12 }}>Bundler</div><div style={{ fontWeight: 700 }}>{bundlerOn ? "Configured" : "Not set"}</div></div>
            </div>
            <div style={{ display: "flex", gap: 10, flexWrap: "wrap", justifyContent: "center" }}>
              <button className="btn" disabled={busy} onClick={() => address && refresh(address)}>Refresh</button>
              <a className="btn" href="https://docs.base.org/tools/network-faucets" target="_blank" rel="noopener noreferrer">Get test ETH</a>
              <a className="btn" href={`${EXPLORER}/address/${address}`} target="_blank" rel="noopener noreferrer">Explorer</a>
            </div>
          </div>

          <div className="card glass" style={{ marginTop: 18 }}>
            <div className="section-title" style={{ marginTop: 0 }}>Send (gasless · ERC-4337)</div>
            {bundlerOn ? (
              <p className="muted">Bundler configured. Sending a UserOperation flow can be enabled here.</p>
            ) : (
              <p className="muted">
                Sending needs a self-hosted ERC-4337 <b>bundler</b> to relay your UserOperation. Stand one up
                (alto / rundler / silius), set <code>NEXT_PUBLIC_BUNDLER_URL</code>, and this becomes a real gasless
                send. See <b>BUNDLER.md</b>. This is the one piece of infrastructure to run yourself — no SaaS required.
              </p>
            )}
          </div>

          <div style={{ textAlign: "center", marginTop: 18 }}>
            <button className="faint" onClick={reset}>Forget this passkey reference</button>
          </div>
        </>
      )}
    </div>
  );
}

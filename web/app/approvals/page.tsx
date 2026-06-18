"use client";

import { useCallback, useEffect, useState } from "react";
import type { Address, Hex } from "viem";
import { getAddress as getVaultAddress, hasVault } from "@/lib/account";
import { listApprovals, revoke, type ApprovalRow } from "@/lib/approvals";
import { shortAddr } from "@lumen/core";
import { useWallet } from "@/components/WalletProvider";
import { Icon } from "@/components/icons";

import { ACTIVE_EXPLORER as EXPLORER } from "@/lib/config";

export default function ApprovalsScreen() {
  const { showToast } = useWallet();
  const [owner, setOwner] = useState<Address | null>(null);
  const [rows, setRows] = useState<ApprovalRow[] | null>(null);
  const [loading, setLoading] = useState(false);
  const [busy, setBusy] = useState<string | null>(null);
  const [err, setErr] = useState("");

  const scan = useCallback(async (addr: Address) => {
    setLoading(true); setErr("");
    try { setRows(await listApprovals(addr)); }
    catch (e) { setErr(e instanceof Error ? e.message : "Scan failed"); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => {
    if (hasVault()) { const a = getVaultAddress(); setOwner(a); if (a) void scan(a); }
  }, [scan]);

  async function onRevoke(r: ApprovalRow) {
    setBusy(r.tokenAddress + r.spender); setErr("");
    try {
      const hash: Hex = await revoke(r.tokenAddress, r.spender);
      showToast("Revoke broadcast");
      void hash;
      if (owner) setTimeout(() => void scan(owner), 4000);
    } catch (e) { setErr(e instanceof Error ? e.message : "Revoke failed"); }
    finally { setBusy(null); }
  }

  return (
    <div className="view" style={{ maxWidth: 720 }}>
      <div className="view-head">
        <h2>Approvals <span className="chip active" style={{ marginLeft: 8, verticalAlign: "middle" }}>built-in revoke</span></h2>
        <p className="muted">Every token spending allowance your wallet has granted — revoke risky or unlimited ones here. Self-built, on-chain. (Most wallets make you visit a separate site for this.)</p>
      </div>

      {!owner ? (
        <div className="card glass"><p className="muted">Create your wallet first on the <b>Account</b> screen, then come back to manage approvals for it.</p></div>
      ) : (
        <>
          <div className="card glass" style={{ marginBottom: 16, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <span className="muted">Wallet: {shortAddr(owner)}</span>
            <button className="btn" disabled={loading} onClick={() => scan(owner)}>{loading ? "Scanning…" : "Rescan"}</button>
          </div>
          {err && <div className="hint bad" style={{ marginBottom: 12 }}>{err}</div>}
          {rows && rows.length === 0 && <div className="muted">No active approvals found. 🎉 (Or the public RPC limited the history scan — point it at your own node for the full picture.)</div>}
          {rows && rows.map((r) => (
            <div className="tx" key={r.tokenAddress + r.spender}>
              <div className={`tx-ic ${r.unlimited ? "out" : "in"}`}><Icon name={r.unlimited ? "alert" : "shield"} size={18} /></div>
              <div className="tx-main">
                <div className="tx-title">{r.token} → {shortAddr(r.spender)} {r.unlimited && <span className="down" style={{ fontWeight: 700 }}>· UNLIMITED</span>}</div>
                <div className="tx-sub"><a href={`${EXPLORER}/address/${r.spender}`} target="_blank" rel="noopener noreferrer" style={{ color: "var(--accent-2)" }}>spender on explorer →</a></div>
              </div>
              <button className="btn btn-danger" disabled={busy === r.tokenAddress + r.spender} onClick={() => onRevoke(r)}>{busy === r.tokenAddress + r.spender ? "Revoking…" : "Revoke"}</button>
            </div>
          ))}
        </>
      )}
    </div>
  );
}

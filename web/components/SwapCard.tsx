"use client";

import { useState } from "react";
import { SWAP_TOKENS, swapKind, quote, swap, type SwapSym } from "@/lib/swap-onchain";
import { useWallet } from "./WalletProvider";
import { Icon } from "./icons";

import { ACTIVE_EXPLORER as EXPLORER, ACTIVE_LABEL } from "@/lib/config";

function friendly(e: unknown, isDex: boolean): string {
  const m = e instanceof Error ? e.message : String(e);
  if (isDex && /revert|reverted|execution|unexpected|0x$/i.test(m)) {
    return `No Uniswap pool / liquidity for this pair on ${ACTIVE_LABEL}. ETH↔WETH always works.`;
  }
  return m.split("\n")[0]!.slice(0, 160);
}

export function SwapCard() {
  const { showToast } = useWallet();
  const [from, setFrom] = useState<SwapSym>("ETH");
  const [to, setTo] = useState<SwapSym>("WETH");
  const [amt, setAmt] = useState("0.001");
  const [out, setOut] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");
  const [hash, setHash] = useState<string | null>(null);

  const kind = swapKind(from, to);
  const isDex = kind === "dex";

  async function getQuote() {
    setErr(""); setOut(null);
    try { setOut(await quote(from, to, amt)); }
    catch (e) { setErr(friendly(e, isDex)); }
  }
  async function doSwap() {
    setErr(""); setHash(null); setBusy(true);
    try {
      const h = await swap(from, to, amt);
      setHash(h); showToast("Swap broadcast");
    } catch (e) { setErr(friendly(e, isDex)); }
    finally { setBusy(false); }
  }

  return (
    <div className="card glass" style={{ marginTop: 18 }}>
      <div className="section-title" style={{ marginTop: 0 }}>Swap <span className="chip active" style={{ marginLeft: 6 }}>real · on-chain</span></div>
      <div style={{ display: "flex", gap: 10, alignItems: "end", marginBottom: 12 }}>
        <div className="field" style={{ margin: 0, flex: 1 }}>
          <label>From</label>
          <select className="select" value={from} onChange={(e) => { setFrom(e.target.value as SwapSym); setOut(null); }}>
            {SWAP_TOKENS.map((t) => <option key={t.sym} value={t.sym}>{t.sym}</option>)}
          </select>
        </div>
        <button className="iconbtn" onClick={() => { setFrom(to); setTo(from); setOut(null); }} aria-label="Flip"><Icon name="swap" size={18} /></button>
        <div className="field" style={{ margin: 0, flex: 1 }}>
          <label>To</label>
          <select className="select" value={to} onChange={(e) => { setTo(e.target.value as SwapSym); setOut(null); }}>
            {SWAP_TOKENS.map((t) => <option key={t.sym} value={t.sym}>{t.sym}</option>)}
          </select>
        </div>
      </div>
      <div className="field"><label>Amount ({from})</label><input className="input" inputMode="decimal" value={amt} onChange={(e) => { setAmt(e.target.value); setOut(null); }} /></div>

      <div className="hint" style={{ marginBottom: 10 }}>
        {kind === "invalid" ? "Pick two different tokens. ETH↔USDC: wrap to WETH first."
          : kind === "wrap" ? "Wrap ETH → WETH (1:1, always works on testnet)."
          : kind === "unwrap" ? "Unwrap WETH → ETH (1:1, always works on testnet)."
          : `Uniswap v3 swap — real, but needs a funded pool on ${ACTIVE_LABEL}.`}
        {out != null && <> · est. out: <b>{out} {to}</b></>}
      </div>

      {err && <div className="hint bad" style={{ marginBottom: 10 }}>{err}</div>}
      {hash && <div className="hint good" style={{ marginBottom: 10 }}>Broadcast ✓ <a href={`${EXPLORER}/tx/${hash}`} target="_blank" rel="noopener noreferrer" style={{ color: "var(--accent-2)" }}>view tx →</a></div>}

      <div style={{ display: "flex", gap: 10 }}>
        <button className="btn" style={{ flex: 1 }} disabled={kind === "invalid"} onClick={getQuote}>Get quote</button>
        <button className="btn btn-primary" style={{ flex: 1 }} disabled={busy || kind === "invalid"} onClick={doSwap}>{busy ? "Swapping…" : "Swap"}</button>
      </div>
    </div>
  );
}

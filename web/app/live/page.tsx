"use client";

import { useCallback, useEffect, useState } from "react";
import { fmtUsd, fmtAmt } from "@lumen/core";
import { getPortfolio, isAddress, CHAIN_META, type ChainKey, type OnchainPortfolio } from "@/lib/chain";

const SAMPLE = "0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045"; // vitalik.eth

export default function LiveScreen() {
  const [chain, setChain] = useState<ChainKey>("base");
  const [addr, setAddr] = useState(SAMPLE);
  const [data, setData] = useState<OnchainPortfolio | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const load = useCallback(async (key: ChainKey, address: string) => {
    if (!isAddress(address)) { setError("Enter a valid 0x address"); setData(null); return; }
    setLoading(true); setError("");
    try {
      const p = await getPortfolio(key, address);
      setData(p);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to read from the chain");
      setData(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { void load("base", SAMPLE); }, [load]);

  return (
    <div className="view">
      <div className="view-head">
        <h2>Live chain <span className="chip active" style={{ marginLeft: 8, verticalAlign: "middle" }}>Real data</span></h2>
        <p className="muted">Real balances read straight from the blockchain with viem — self-built, no third-party API. Read-only.</p>
      </div>

      <div className="card glass" style={{ marginBottom: 18 }}>
        <div style={{ display: "grid", gridTemplateColumns: "150px 1fr auto", gap: 10, alignItems: "end" }}>
          <div className="field" style={{ margin: 0 }}>
            <label>Network</label>
            <select className="select" value={chain} onChange={(e) => setChain(e.target.value as ChainKey)}>
              <option value="base">Base mainnet</option>
              <option value="baseSepolia">Base Sepolia</option>
            </select>
          </div>
          <div className="field" style={{ margin: 0 }}>
            <label>Address</label>
            <input className="input" value={addr} onChange={(e) => setAddr(e.target.value)} placeholder="0x…" spellCheck={false} />
          </div>
          <button className="btn btn-primary" disabled={loading} onClick={() => load(chain, addr.trim())}>{loading ? "Reading…" : "Read"}</button>
        </div>
        {error && <div className="hint bad" style={{ marginTop: 10 }}>{error}</div>}
      </div>

      {data && (
        <>
          <div className="card glass" style={{ marginBottom: 18 }}>
            <div className="hero-label">On-chain value · {CHAIN_META[data.chain].label}</div>
            <div className="balance" style={{ fontSize: 40 }}>{fmtUsd(data.totalUsd)}</div>
            <div className="muted">
              Block #{data.block.toString()} · ETH ≈ {data.ethUsd ? fmtUsd(data.ethUsd) : "n/a"} (Chainlink, on-chain) ·{" "}
              <a href={`${CHAIN_META[data.chain].explorer}/address/${data.address}`} target="_blank" rel="noopener noreferrer" style={{ color: "var(--accent-2)" }}>
                view on explorer →
              </a>
            </div>
          </div>

          <div className="section-title" style={{ marginTop: 0 }}>Assets</div>
          {data.assets.map((a) => (
            <div className="tx" key={a.sym}>
              <div className="coin" style={{ backgroundImage: `linear-gradient(135deg, ${a.grad[0]}, ${a.grad[1]})` }}>{a.sym.slice(0, 3)}</div>
              <div className="tx-main">
                <div className="tx-title">{a.name}{a.native ? " · native" : ""}</div>
                <div className="tx-sub">{fmtAmt(a.balance)} {a.sym}</div>
              </div>
              <div className="tx-amt">{a.usd ? fmtUsd(a.usd) : "—"}</div>
            </div>
          ))}
        </>
      )}
    </div>
  );
}

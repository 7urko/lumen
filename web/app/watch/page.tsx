"use client";

import { useCallback, useEffect, useState } from "react";
import type { Address } from "viem";
import { getPortfolio, isAddress, client, CHAIN_META, type ChainKey, type OnchainPortfolio } from "@/lib/chain";
import { fmtUsd, fmtAmt, shortAddr } from "@lumen/core";
import { useWallet } from "@/components/WalletProvider";
import { Icon } from "@/components/icons";

const WATCH_KEY = "lumen.watch";

function loadList(): string[] {
  if (typeof window === "undefined") return [];
  try { return JSON.parse(localStorage.getItem(WATCH_KEY) || "[]") as string[]; } catch { return []; }
}
function saveList(l: string[]) { localStorage.setItem(WATCH_KEY, JSON.stringify(l)); }

interface Intel { isContract: boolean; txCount: number }

export default function WatchScreen() {
  const { showToast } = useWallet();
  const [list, setList] = useState<string[]>([]);
  const [input, setInput] = useState("");
  const [chain, setChain] = useState<ChainKey>("base");
  const [active, setActive] = useState<string | null>(null);
  const [data, setData] = useState<OnchainPortfolio | null>(null);
  const [intel, setIntel] = useState<Intel | null>(null);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState("");

  useEffect(() => { setList(loadList()); }, []);

  const open = useCallback(async (addr: string, key: ChainKey) => {
    setActive(addr); setLoading(true); setErr(""); setData(null); setIntel(null);
    try {
      const [p, code, nonce] = await Promise.all([
        getPortfolio(key, addr as Address),
        client(key).getCode({ address: addr as Address }),
        client(key).getTransactionCount({ address: addr as Address }),
      ]);
      setData(p);
      setIntel({ isContract: !!code && code !== "0x", txCount: nonce });
    } catch (e) { setErr(e instanceof Error ? e.message : "Lookup failed"); }
    finally { setLoading(false); }
  }, []);

  function add() {
    const a = input.trim();
    if (!isAddress(a)) { setErr("Enter a valid 0x address"); return; }
    if (!list.includes(a)) { const l = [...list, a]; setList(l); saveList(l); }
    setInput(""); showToast("Added to watch list");
    void open(a, chain);
  }
  function remove(a: string) {
    const l = list.filter((x) => x !== a); setList(l); saveList(l);
    if (active === a) { setActive(null); setData(null); setIntel(null); }
  }

  return (
    <div className="view">
      <div className="view-head">
        <h2>Watch <span className="chip active" style={{ marginLeft: 8, verticalAlign: "middle" }}>read-only radar</span></h2>
        <p className="muted">Track any wallet&apos;s real holdings and get on-chain intel on it — without importing it. Self-built, read-only.</p>
      </div>

      <div className="card glass" style={{ marginBottom: 16 }}>
        <div style={{ display: "grid", gridTemplateColumns: "150px 1fr auto", gap: 10, alignItems: "end" }}>
          <div className="field" style={{ margin: 0 }}>
            <label>Network</label>
            <select className="select" value={chain} onChange={(e) => setChain(e.target.value as ChainKey)}>
              <option value="base">Base mainnet</option>
              <option value="baseSepolia">Base Sepolia</option>
            </select>
          </div>
          <div className="field" style={{ margin: 0 }}><label>Address</label><input className="input" value={input} onChange={(e) => setInput(e.target.value)} placeholder="0x…" spellCheck={false} /></div>
          <button className="btn btn-primary" onClick={add}>Watch</button>
        </div>
        {err && <div className="hint bad" style={{ marginTop: 10 }}>{err}</div>}
      </div>

      {list.length > 0 && (
        <div className="chip-row" style={{ marginBottom: 16 }}>
          {list.map((a) => (
            <span key={a} className={`chip${active === a ? " active" : ""}`} style={{ display: "inline-flex", gap: 6, alignItems: "center" }}>
              <button onClick={() => open(a, chain)}>{shortAddr(a)}</button>
              <button onClick={() => remove(a)} aria-label="Remove" style={{ opacity: .6 }}>✕</button>
            </span>
          ))}
        </div>
      )}

      {loading && <div className="card glass" style={{ marginBottom: 16 }}><span className="skeleton" style={{ width: 160, height: 12 }} /><div style={{ marginTop: 10 }}><span className="skeleton" style={{ width: 200, height: 28 }} /></div></div>}

      {active && intel && (
        <div className={`verdict ${intel.isContract ? "caution" : "safe"}`} style={{ marginTop: 0, marginBottom: 16 }}>
          <div className="verdict-head">
            <div className="verdict-badge"><Icon name={intel.isContract ? "alert" : "check"} size={18} /></div>
            <div>
              <div className="verdict-title">{shortAddr(active)} · {intel.isContract ? "smart contract" : "wallet (EOA)"}</div>
              <div className="verdict-sub">{intel.txCount} outgoing tx{intel.txCount === 1 ? "" : "s"} · {CHAIN_META[chain].label}</div>
            </div>
          </div>
        </div>
      )}

      {data && (
        <>
          <div className="card glass" style={{ marginBottom: 16 }}>
            <div className="hero-label">Holdings value</div>
            <div className="balance" style={{ fontSize: 34 }}>{fmtUsd(data.totalUsd)}</div>
          </div>
          {data.assets.map((a) => (
            <div className="tx" key={a.sym}>
              <div className="coin" style={{ backgroundImage: `linear-gradient(135deg, ${a.grad[0]}, ${a.grad[1]})` }}>{a.sym.slice(0, 3)}</div>
              <div className="tx-main"><div className="tx-title">{a.name}</div><div className="tx-sub">{fmtAmt(a.balance)} {a.sym}</div></div>
              <div className="tx-amt">{a.usd ? fmtUsd(a.usd) : "—"}</div>
            </div>
          ))}
        </>
      )}
    </div>
  );
}

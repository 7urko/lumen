"use client";

import { useEffect, useState } from "react";
import { isAddress, type Address } from "viem";
import { resolveName, looksLikeEns } from "@/lib/ens";
import { RecipientRadar } from "./RecipientRadar";
import { QrScanner } from "./QrScanner";
import { Icon } from "./icons";

interface Props { value: string; onChange: (v: string) => void; onResolved: (a: Address | null) => void }

export function RecipientField({ value, onChange, onResolved }: Props) {
  const [resolved, setResolved] = useState<Address | null>(null);
  const [resolving, setResolving] = useState(false);
  const [scan, setScan] = useState(false);

  useEffect(() => {
    const v = value.trim();
    if (isAddress(v)) { setResolved(v); onResolved(v); setResolving(false); return; }
    if (looksLikeEns(v)) {
      setResolving(true);
      let cancelled = false;
      resolveName(v).then((a) => { if (!cancelled) { setResolved(a); onResolved(a); } }).finally(() => { if (!cancelled) setResolving(false); });
      return () => { cancelled = true; };
    }
    setResolved(null); onResolved(null); setResolving(false);
  }, [value, onResolved]);

  function handleScan(text: string) {
    const m = text.match(/0x[0-9a-fA-F]{40}|[a-z0-9-]+\.eth/i);
    onChange(m ? m[0] : text.trim());
    setScan(false);
  }

  const v = value.trim();
  return (
    <div className="field">
      <label>Recipient</label>
      <div style={{ display: "flex", gap: 8 }}>
        <input className="input" placeholder="0x… or name.eth" value={value} onChange={(e) => onChange(e.target.value)} spellCheck={false} style={{ flex: 1 }} />
        <button type="button" className="iconbtn" title="Scan QR" onClick={() => setScan(true)}><Icon name="scan" size={18} /></button>
      </div>
      {resolving && <div className="hint"><span className="spinner" /> Resolving ENS…</div>}
      {resolved && looksLikeEns(value) && <div className="hint good">{v} → {resolved.slice(0, 8)}…{resolved.slice(-6)}</div>}
      {!resolving && !resolved && v && !isAddress(v) && <div className="hint bad">Enter a valid 0x address or .eth name</div>}
      {resolved && <RecipientRadar address={resolved} />}
      {scan && <QrScanner onResult={handleScan} onClose={() => setScan(false)} />}
    </div>
  );
}

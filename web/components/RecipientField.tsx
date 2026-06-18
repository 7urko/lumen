"use client";

import { useEffect, useState } from "react";
import { getAddress, type Address } from "viem";
import { resolveName, looksLikeEns } from "@/lib/ens";
import { RecipientRadar } from "./RecipientRadar";
import { QrScanner } from "./QrScanner";
import { Icon } from "./icons";

interface Props { value: string; onChange: (v: string) => void; onResolved: (a: Address | null) => void }

const HEX40 = /^0x[0-9a-fA-F]{40}$/;

/** Validate + normalise a raw 0x address.
 *  - rejects anything with a *wrong* EIP-55 checksum (mistype / swap protection, M3);
 *  - flags all-lowercase/all-uppercase input (no checksum to verify) so the user double-checks;
 *  - always returns the canonical checksummed form to send to. */
function parseHexAddress(v: string): { address: Address | null; badChecksum: boolean; noChecksum: boolean } {
  if (!HEX40.test(v)) return { address: null, badChecksum: false, noChecksum: false };
  const noChecksum = v === v.toLowerCase() || v === v.toUpperCase();
  try {
    return { address: getAddress(v), badChecksum: false, noChecksum };
  } catch {
    return { address: null, badChecksum: true, noChecksum: false };
  }
}

export function RecipientField({ value, onChange, onResolved }: Props) {
  const [resolved, setResolved] = useState<Address | null>(null);
  const [resolving, setResolving] = useState(false);
  const [badChecksum, setBadChecksum] = useState(false);
  const [noChecksum, setNoChecksum] = useState(false);
  const [isEns, setIsEns] = useState(false);
  const [scan, setScan] = useState(false);

  useEffect(() => {
    const v = value.trim();
    setBadChecksum(false); setNoChecksum(false); setIsEns(false);

    const hex = parseHexAddress(v);
    if (hex.address) { setResolved(hex.address); onResolved(hex.address); setNoChecksum(hex.noChecksum); setResolving(false); return; }
    if (hex.badChecksum) { setResolved(null); onResolved(null); setBadChecksum(true); setResolving(false); return; }

    if (looksLikeEns(v)) {
      setIsEns(true); setResolving(true);
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
        <input className="input" placeholder="0x… or name.eth" value={value} onChange={(e) => onChange(e.target.value)} spellCheck={false} autoComplete="off" style={{ flex: 1 }} />
        <button type="button" className="iconbtn" title="Scan QR" onClick={() => setScan(true)}><Icon name="scan" size={18} /></button>
      </div>

      {resolving && <div className="hint"><span className="spinner" /> Resolving ENS…</div>}
      {badChecksum && <div className="hint bad">That address has an invalid checksum — re-check it character by character; it may be mistyped or tampered with.</div>}

      {resolved && (
        <div className="hint" style={{ display: "block" }}>
          {isEns && <div className="good" style={{ marginBottom: 2 }}>{v} resolves to:</div>}
          <code style={{ wordBreak: "break-all", fontSize: 12, opacity: 0.95 }}>{resolved}</code>
          {noChecksum && <div className="bad" style={{ marginTop: 2 }}>This address has no checksum to verify — confirm every character is correct.</div>}
        </div>
      )}

      {!resolving && !resolved && !badChecksum && v && <div className="hint bad">Enter a valid 0x address or .eth name</div>}
      {resolved && <RecipientRadar address={resolved} />}
      {scan && <QrScanner onResult={handleScan} onClose={() => setScan(false)} />}
    </div>
  );
}

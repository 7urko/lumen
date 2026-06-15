"use client";

import { useEffect, useState } from "react";
import { isAddress, type Address } from "viem";
import { inspectRecipient, type Radar } from "@/lib/scam-onchain";
import { Icon } from "./icons";

const ICON: Record<string, string> = { ok: "shield", caution: "alert", danger: "alert" };

/** Self-built pre-sign "recipient radar" — real on-chain checks before you send. */
export function RecipientRadar({ address }: { address: string }) {
  const [radar, setRadar] = useState<Radar | null>(null);
  const [loading, setLoading] = useState(false);
  const valid = isAddress(address);

  useEffect(() => {
    if (!valid) { setRadar(null); return; }
    let cancelled = false;
    setLoading(true);
    inspectRecipient(address as Address)
      .then((r) => { if (!cancelled) setRadar(r); })
      .catch(() => { if (!cancelled) setRadar(null); })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [address, valid]);

  if (!valid) return null;
  if (loading && !radar) return <div className="hint" style={{ marginTop: 8 }}>Scam Shield: scanning recipient…</div>;
  if (!radar) return null;

  const cls = radar.level === "ok" ? "safe" : radar.level === "caution" ? "caution" : "danger";
  return (
    <div className={`verdict ${cls}`} style={{ marginTop: 12 }}>
      <div className="verdict-head">
        <div className="verdict-badge"><Icon name={ICON[radar.level]} size={18} /></div>
        <div>
          <div className="verdict-title">Scam Shield · recipient radar</div>
          <div className="verdict-sub">{radar.isContract ? "Smart contract" : "Wallet"} · {radar.seenBefore ? "known to you" : "new to you"} · live on-chain check</div>
        </div>
      </div>
      <ul className="reasons">
        {radar.notes.map((n, i) => (
          <li className={`reason ${radar.level === "ok" ? "good" : "warn"}`} key={i}>
            <span className="dot"><Icon name={radar.level === "ok" ? "check" : "alert"} size={10} /></span>
            <span>{n}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

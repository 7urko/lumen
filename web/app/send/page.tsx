"use client";

import { Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { resolveRecipient, assessRisk, fmtUsd, fmtAmt, shortAddr } from "@lumen/core";
import { useWallet } from "@/components/WalletProvider";
import { Icon } from "@/components/icons";

const VERDICT_ICON: Record<string, string> = { safe: "shield", caution: "alert", danger: "alert" };
const REASON_ICON: Record<string, string> = { good: "check", warn: "alert", bad: "x" };

function SendInner() {
  const { tokens, directory, send, showToast } = useWallet();
  const router = useRouter();
  const params = useSearchParams();
  const [sym, setSym] = useState(params.get("token") ?? tokens[0]?.sym ?? "ETH");
  const [amount, setAmount] = useState(params.get("amount") ?? "");
  const [recipient, setRecipient] = useState(params.get("to") ?? "");

  const token = tokens.find((t) => t.sym === sym) ?? tokens[0]!;
  const amt = parseFloat(amount) || 0;
  const amountUsd = amt * token.price;
  const insufficient = amt > token.balance;

  const resolved = recipient.trim() ? resolveRecipient(recipient, directory) : null;
  const verdict = resolved && resolved.ok ? assessRisk(resolved, amountUsd) : null;
  const canSend = !!(resolved && resolved.ok && amt > 0 && !insufficient && verdict && verdict.level !== "danger");

  function onSend() {
    if (!canSend || !resolved) return;
    send(token.sym, amt, resolved.label ?? recipient.trim());
    showToast(`Sent ${fmtAmt(amt)} ${token.sym}`);
    setAmount(""); setRecipient("");
    router.push("/activity");
  }

  return (
    <div className="view" style={{ maxWidth: 600 }}>
      <div className="view-head">
        <h2>Send</h2>
        <p className="muted">Every send is checked by Scam Shield before it can leave your wallet.</p>
      </div>
      <div className="card glass">
        <div className="field">
          <label>Asset</label>
          <select className="select" value={sym} onChange={(e) => setSym(e.target.value)}>
            {tokens.map((t) => <option key={t.sym} value={t.sym}>{t.sym} — {t.name} ({fmtAmt(t.balance)} available)</option>)}
          </select>
        </div>
        <div className="field">
          <label>Amount</label>
          <input className="input" inputMode="decimal" placeholder="0.00" value={amount} onChange={(e) => setAmount(e.target.value)} />
          <div className="hint" style={{ display: "flex", justifyContent: "space-between" }}>
            <span className={insufficient ? "hint bad" : ""}>{insufficient ? "Insufficient balance" : `≈ ${fmtUsd(amountUsd)}`}</span>
            <button type="button" className="faint" style={{ fontWeight: 600 }} onClick={() => setAmount(String(token.balance))}>Max {fmtAmt(token.balance)} {token.sym}</button>
          </div>
        </div>
        <div className="field">
          <label>Recipient</label>
          <input className="input" placeholder="0x address · name.lumen · contact" value={recipient} onChange={(e) => setRecipient(e.target.value)} />
          {resolved && resolved.ok && (
            <div className="hint good">→ {resolved.kind === "address" ? shortAddr(resolved.address ?? "") : `${resolved.label} · ${shortAddr(resolved.address ?? "")}`}</div>
          )}
          {resolved && resolved.unknownName && <div className="hint bad">No wallet is registered for {resolved.label}</div>}
          {resolved && resolved.invalid && <div className="hint bad">Enter a 0x address, a name.lumen username, or a saved contact</div>}
        </div>

        {verdict && (
          <div className={`verdict ${verdict.level}`}>
            <div className="verdict-head">
              <div className="verdict-badge"><Icon name={VERDICT_ICON[verdict.level]} size={20} /></div>
              <div>
                <div className="verdict-title">{verdict.title}</div>
                <div className="verdict-sub">{verdict.sub}</div>
              </div>
            </div>
            <ul className="reasons">
              {verdict.reasons.map((r, i) => (
                <li className={`reason ${r.kind}`} key={i}><span className="dot"><Icon name={REASON_ICON[r.kind]} size={10} /></span><span>{r.text}</span></li>
              ))}
            </ul>
          </div>
        )}

        {verdict && (
          <div className="legs">
            <div className="leg"><span className="muted">You send</span><span className="v">{fmtAmt(amt)} {token.sym}</span></div>
            <div className="leg"><span className="muted">They receive</span><span className="v">{fmtAmt(amt)} {token.sym}</span></div>
            <div className="leg"><span className="muted">Network fee (est.)</span><span className="v">≈ $0.42</span></div>
          </div>
        )}

        <button className="btn btn-primary btn-block" disabled={!canSend} onClick={onSend}>
          {verdict?.level === "danger" ? "Blocked — high risk recipient" : `Send ${token.sym}`}
        </button>
      </div>
    </div>
  );
}

export default function SendScreen() {
  return <Suspense fallback={<div className="view" />}><SendInner /></Suspense>;
}

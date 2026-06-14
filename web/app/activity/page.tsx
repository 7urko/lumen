"use client";

import { fmtAmt, relTime } from "@lumen/core";
import { useWallet } from "@/components/WalletProvider";
import { Icon } from "@/components/icons";

export default function ActivityScreen() {
  const { history } = useWallet();
  return (
    <div className="view" style={{ maxWidth: 720 }}>
      <div className="view-head">
        <h2>Activity</h2>
        <p className="muted">Your recent transactions.</p>
      </div>
      {history.map((h, i) => (
        <div className="tx" key={i}>
          <div className={`tx-ic ${h.dir}`}><Icon name={h.dir === "in" ? "receive" : "send"} size={18} /></div>
          <div className="tx-main">
            <div className="tx-title">{h.dir === "in" ? "Received" : "Sent"} {h.sym}</div>
            <div className="tx-sub">{h.dir === "in" ? "from" : "to"} {h.address} · {relTime(h.ts)}</div>
          </div>
          <div className={`tx-amt ${h.dir === "in" ? "pos" : "neg"}`}>{h.dir === "in" ? "+" : "−"}{fmtAmt(h.amount)} {h.sym}</div>
        </div>
      ))}
    </div>
  );
}

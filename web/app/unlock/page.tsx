"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useWallet } from "@/components/WalletProvider";
import { Icon } from "@/components/icons";

export default function UnlockScreen() {
  const { showToast } = useWallet();
  const router = useRouter();
  const [verifying, setVerifying] = useState(false);

  function unlock() {
    setVerifying(true);
    setTimeout(() => { showToast("Unlocked"); router.push("/"); }, 700);
  }

  return (
    <div className="view" style={{ maxWidth: 460 }}>
      <div className="view-head"><h2>Locked</h2><p className="muted">Unlock your smart account to continue.</p></div>
      <div className="card glass" style={{ textAlign: "center", padding: "36px 24px" }}>
        <div className="brand-mark" style={{ width: 72, height: 72, margin: "0 auto 18px", borderRadius: 20 }}>
          <Icon name="faceid" size={36} />
        </div>
        <button className="btn btn-primary btn-block" disabled={verifying} onClick={unlock}>
          {verifying ? "Verifying…" : "Unlock with Face ID"}
        </button>
        <button className="faint" style={{ marginTop: 14 }} onClick={() => router.push("/security")}>Use social recovery instead</button>
      </div>
    </div>
  );
}

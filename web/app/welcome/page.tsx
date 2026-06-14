"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { genSeed } from "@lumen/core";
import { useWallet } from "@/components/WalletProvider";

type Step = "choice" | "smart" | "create" | "import";

export default function WelcomeScreen() {
  const { showToast } = useWallet();
  const router = useRouter();
  const [step, setStep] = useState<Step>("choice");
  const [seed] = useState<string[]>(() => genSeed());
  const [ack, setAck] = useState(false);

  function enter(msg: string) { showToast(msg); router.push("/"); }

  return (
    <div className="view" style={{ maxWidth: 520 }}>
      <div className="view-head"><h2>Welcome to Lumen</h2><p className="muted">A non-custodial smart-account wallet. (Demo — no real keys.)</p></div>

      {step === "choice" && (
        <div className="card glass" style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          <button className="btn btn-primary btn-block" onClick={() => setStep("smart")}>Create smart account · passkey</button>
          <button className="btn btn-block" onClick={() => setStep("create")}>Create with recovery phrase</button>
          <button className="btn btn-block" onClick={() => setStep("import")}>Import existing wallet</button>
        </div>
      )}

      {step === "smart" && (
        <div className="card glass" style={{ textAlign: "center" }}>
          <p className="muted" style={{ marginBottom: 16 }}>Register a passkey to secure your smart account — no seed phrase to lose.</p>
          <button className="btn btn-primary btn-block" onClick={() => enter("Smart account ready")}>Register passkey &amp; continue</button>
          <button className="faint" style={{ marginTop: 12 }} onClick={() => setStep("choice")}>← Back</button>
        </div>
      )}

      {step === "create" && (
        <div className="card glass">
          <p className="muted" style={{ marginBottom: 12 }}>Write down these 12 words in order and keep them safe.</p>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 8, marginBottom: 14 }}>
            {seed.map((w, i) => (
              <div key={i} className="leg" style={{ justifyContent: "flex-start", gap: 8 }}><span className="faint">{i + 1}</span><b>{w}</b></div>
            ))}
          </div>
          <label className="muted" style={{ display: "flex", gap: 8, alignItems: "center", marginBottom: 14 }}>
            <input type="checkbox" checked={ack} onChange={(e) => setAck(e.target.checked)} /> I've saved my recovery phrase
          </label>
          <button className="btn btn-primary btn-block" disabled={!ack} onClick={() => enter("Wallet ready")}>Open wallet</button>
          <button className="faint" style={{ marginTop: 12 }} onClick={() => setStep("choice")}>← Back</button>
        </div>
      )}

      {step === "import" && (
        <div className="card glass">
          <p className="muted" style={{ marginBottom: 12 }}>Paste a recovery phrase to import. (Demo — never paste a real phrase into demo software.)</p>
          <textarea className="input" rows={3} placeholder="word1 word2 word3 …" style={{ marginBottom: 14, resize: "vertical" }} />
          <button className="btn btn-primary btn-block" onClick={() => enter("Wallet imported")}>Import &amp; open</button>
          <button className="faint" style={{ marginTop: 12 }} onClick={() => setStep("choice")}>← Back</button>
        </div>
      )}
    </div>
  );
}

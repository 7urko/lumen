"use client";
import { useEffect } from "react";

export default function Error({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => { console.error("[Lumen] route error:", error); }, [error]);
  return (
    <div className="view" style={{ textAlign: "center", paddingTop: 70 }}>
      <div className="balance" style={{ fontSize: 44 }}>Something glitched</div>
      <p className="muted" style={{ marginBottom: 18 }}>A screen hit an error — your wallet and keys are unaffected.</p>
      <button className="btn btn-primary" onClick={() => reset()}>Try again</button>
    </div>
  );
}

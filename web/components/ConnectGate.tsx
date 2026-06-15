"use client";
import Link from "next/link";
import type { ReactNode } from "react";

export function ConnectGate({ connected, children }: { connected: boolean; children: ReactNode }) {
  if (connected) return <>{children}</>;
  return (
    <div className="card glass" style={{ textAlign: "center", marginTop: 18 }}>
      <p className="muted" style={{ marginBottom: 14 }}>No wallet yet. Create your real encrypted wallet to use this screen.</p>
      <Link href="/account" className="btn btn-primary" style={{ display: "inline-flex" }}>Create / unlock wallet</Link>
    </div>
  );
}

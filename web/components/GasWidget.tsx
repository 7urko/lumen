"use client";
import { useEffect, useState } from "react";
import { getGasGwei } from "@/lib/gas";

export function GasWidget() {
  const [g, setG] = useState<number | null>(null);
  useEffect(() => {
    let on = true;
    const load = async () => { try { const v = await getGasGwei(); if (on) setG(v); } catch { /* non-fatal */ } };
    void load();
    const id = setInterval(() => { void load(); }, 20000);
    return () => { on = false; clearInterval(id); };
  }, []);
  if (g == null) return null;
  return <div className="gas-pill" title="Live Base gas price">⛽ {g < 0.1 ? g.toFixed(4) : g.toFixed(2)} gwei</div>;
}

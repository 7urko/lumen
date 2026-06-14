"use client";

import { createContext, useCallback, useContext, useMemo, useRef, useState, type ReactNode } from "react";
import { DEMO_TOKENS, DEMO_HISTORY, DEMO_DIRECTORY, type Token, type HistoryEntry, type Directory } from "@lumen/core";

/** A fixed demo receive address (the prototype generated a random one). */
export const DEMO_ADDRESS = "0x7a3F9c20Bd14eE8b51aA0d7C6F2e1B9d84Ac0E12";
export const DEMO_USERNAME = "you.lumen";

interface WalletState {
  tokens: Token[];
  history: HistoryEntry[];
  directory: Directory;
  address: string;
  username: string;
  toast: string | null;
  showToast: (msg: string) => void;
  send: (sym: string, amount: number, toLabel: string) => void;
}

const Ctx = createContext<WalletState | null>(null);

export function useWallet(): WalletState {
  const c = useContext(Ctx);
  if (!c) throw new Error("useWallet must be used within <WalletProvider>");
  return c;
}

export function WalletProvider({ children }: { children: ReactNode }) {
  const [tokens, setTokens] = useState<Token[]>(() => DEMO_TOKENS.map((t) => ({ ...t })));
  const [history, setHistory] = useState<HistoryEntry[]>(() => DEMO_HISTORY.map((h) => ({ ...h })));
  const [toast, setToast] = useState<string | null>(null);
  const toastTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const showToast = useCallback((msg: string) => {
    setToast(msg);
    if (toastTimer.current) clearTimeout(toastTimer.current);
    toastTimer.current = setTimeout(() => setToast(null), 2400);
  }, []);

  const send = useCallback((sym: string, amount: number, toLabel: string) => {
    setTokens((ts) => ts.map((t) => (t.sym === sym ? { ...t, balance: Math.max(0, t.balance - amount) } : t)));
    setHistory((h) => [{ dir: "out", sym, amount, address: toLabel, ts: Date.now() }, ...h]);
  }, []);

  const value = useMemo<WalletState>(
    () => ({ tokens, history, directory: DEMO_DIRECTORY, address: DEMO_ADDRESS, username: DEMO_USERNAME, toast, showToast, send }),
    [tokens, history, toast, showToast, send],
  );

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

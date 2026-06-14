"use client";

import { createContext, useCallback, useContext, useMemo, useRef, useState, type ReactNode } from "react";
import {
  DEMO_TOKENS, DEMO_HISTORY, DEMO_DIRECTORY, DEMO_ALERTS, DEMO_GUARDIANS,
  type Token, type HistoryEntry, type Directory, type Contact, type Alert, type Guardian,
} from "@lumen/core";

export const DEMO_ADDRESS = "0x7a3F9c20Bd14eE8b51aA0d7C6F2e1B9d84Ac0E12";
export const DEMO_USERNAME = "you.lumen";

interface WalletState {
  tokens: Token[];
  history: HistoryEntry[];
  directory: Directory;
  contacts: Contact[];
  alerts: Alert[];
  guardians: Guardian[];
  address: string;
  username: string;
  toast: string | null;
  showToast: (msg: string) => void;
  send: (sym: string, amount: number, toLabel: string) => void;
  buy: (sym: string, tokenAmt: number, fiat: number) => void;
  swap: (fromSym: string, toSym: string, fromAmt: number, toAmt: number) => void;
  stake: (sym: string, amount: number) => void;
  addContact: (c: Contact) => void;
  addAlert: (a: Omit<Alert, "id">) => void;
  toggleAlert: (id: number) => void;
  removeAlert: (id: number) => void;
  addGuardian: (g: Omit<Guardian, "id">) => void;
  removeGuardian: (id: number) => void;
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
  const [contacts, setContacts] = useState<Contact[]>(() => DEMO_DIRECTORY.contacts.map((c) => ({ ...c })));
  const [alerts, setAlerts] = useState<Alert[]>(() => DEMO_ALERTS.map((a) => ({ ...a })));
  const [guardians, setGuardians] = useState<Guardian[]>(() => DEMO_GUARDIANS.map((g) => ({ ...g })));
  const [toast, setToast] = useState<string | null>(null);
  const toastTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const nextId = useRef(1000);

  const showToast = useCallback((msg: string) => {
    setToast(msg);
    if (toastTimer.current) clearTimeout(toastTimer.current);
    toastTimer.current = setTimeout(() => setToast(null), 2400);
  }, []);

  const adjust = useCallback((sym: string, deltaBalance: number, deltaStaked = 0) => {
    setTokens((ts) => ts.map((t) => (t.sym === sym ? { ...t, balance: Math.max(0, t.balance + deltaBalance), staked: Math.max(0, t.staked + deltaStaked) } : t)));
  }, []);

  const send = useCallback((sym: string, amount: number, toLabel: string) => {
    adjust(sym, -amount);
    setHistory((h) => [{ dir: "out", sym, amount, address: toLabel, ts: Date.now() }, ...h]);
  }, [adjust]);

  const buy = useCallback((sym: string, tokenAmt: number, fiat: number) => {
    adjust(sym, tokenAmt);
    setHistory((h) => [{ dir: "in", sym, amount: tokenAmt, address: "Card purchase", ts: Date.now() }, ...h]);
    void fiat;
  }, [adjust]);

  const swap = useCallback((fromSym: string, toSym: string, fromAmt: number, toAmt: number) => {
    setTokens((ts) => ts.map((t) => {
      if (t.sym === fromSym) return { ...t, balance: Math.max(0, t.balance - fromAmt) };
      if (t.sym === toSym) return { ...t, balance: t.balance + toAmt };
      return t;
    }));
    setHistory((h) => [
      { dir: "out", sym: fromSym, amount: fromAmt, address: `Swap → ${toSym}`, ts: Date.now() },
      ...h,
    ]);
  }, []);

  const stake = useCallback((sym: string, amount: number) => {
    adjust(sym, -amount, amount);
  }, [adjust]);

  const addContact = useCallback((c: Contact) => setContacts((cs) => [...cs, c]), []);
  const addAlert = useCallback((a: Omit<Alert, "id">) => setAlerts((as) => [{ ...a, id: nextId.current++ }, ...as]), []);
  const toggleAlert = useCallback((id: number) => setAlerts((as) => as.map((a) => (a.id === id ? { ...a, on: !a.on } : a))), []);
  const removeAlert = useCallback((id: number) => setAlerts((as) => as.filter((a) => a.id !== id)), []);
  const addGuardian = useCallback((g: Omit<Guardian, "id">) => setGuardians((gs) => [...gs, { ...g, id: nextId.current++ }]), []);
  const removeGuardian = useCallback((id: number) => setGuardians((gs) => gs.filter((g) => g.id !== id)), []);

  const value = useMemo<WalletState>(() => ({
    tokens, history, directory: { ...DEMO_DIRECTORY, contacts }, contacts, alerts, guardians,
    address: DEMO_ADDRESS, username: DEMO_USERNAME, toast,
    showToast, send, buy, swap, stake, addContact, addAlert, toggleAlert, removeAlert, addGuardian, removeGuardian,
  }), [tokens, history, contacts, alerts, guardians, toast, showToast, send, buy, swap, stake, addContact, addAlert, toggleAlert, removeAlert, addGuardian, removeGuardian]);

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import type { Address } from "viem";
import type { Token, Contact, Alert, Guardian, Directory } from "@lumen/core";
import { activeAddress, activeKind, type WalletKind } from "@/lib/wallet";
import { getPortfolio, type ChainKey } from "@/lib/chain";

const CHAIN: ChainKey = "baseSepolia";
const TV: Record<string, string> = { ETH: "BINANCE:ETHUSDT", WETH: "BINANCE:ETHUSDT", cbETH: "COINBASE:CBETHUSD" };

interface WalletState {
  connected: boolean;        // a real wallet exists in this browser
  kind: WalletKind | null;   // "smart" (passkey, no stored key) or "eoa" (legacy)
  address: Address | null;   // the real connected address
  chain: ChainKey;
  tokens: Token[];           // REAL on-chain holdings (mapped to the shared shape)
  totalUsd: number;
  loading: boolean;
  refresh: () => Promise<void>;
  recheck: () => void;       // re-read whether a wallet now exists
  // local, user-owned data — real, starts empty (no seeds)
  contacts: Contact[];
  addContact: (c: Contact) => void;
  alerts: Alert[];
  addAlert: (a: Omit<Alert, "id">) => void;
  toggleAlert: (id: number) => void;
  removeAlert: (id: number) => void;
  guardians: Guardian[];
  addGuardian: (g: Omit<Guardian, "id">) => void;
  removeGuardian: (id: number) => void;
  directory: Directory;
  toast: string | null;
  showToast: (msg: string) => void;
}

const Ctx = createContext<WalletState | null>(null);
export function useWallet(): WalletState {
  const c = useContext(Ctx);
  if (!c) throw new Error("useWallet must be used within <WalletProvider>");
  return c;
}

export function WalletProvider({ children }: { children: ReactNode }) {
  const [address, setAddress] = useState<Address | null>(null);
  const [kind, setKind] = useState<WalletKind | null>(null);
  const [assets, setAssets] = useState<Token[]>([]);
  const [loading, setLoading] = useState(false);
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [guardians, setGuardians] = useState<Guardian[]>([]);
  const [toast, setToast] = useState<string | null>(null);
  const toastTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const nextId = useRef(1);

  const refresh = useCallback(async () => {
    const k = activeKind();
    setKind(k);
    const addr = await activeAddress();
    setAddress(addr);
    if (!addr) { setAssets([]); return; }
    setLoading(true);
    try {
      const p = await getPortfolio(CHAIN, addr);
      const tokens: Token[] = p.assets.map((a) => {
        const price = a.balance > 0 ? a.usd / a.balance : (a.sym === "USDC" || a.sym === "DAI" ? 1 : 0);
        return { sym: a.sym, name: a.name, grad: a.grad, balance: a.balance, price, cost: price, change: 0, staked: 0, apy: 0, tv: TV[a.sym] ?? "BINANCE:ETHUSDT", stable: a.sym === "USDC" || a.sym === "DAI" };
      });
      setAssets(tokens);
    } catch { /* keep last known */ }
    finally { setLoading(false); }
  }, []);

  const recheck = useCallback(() => { void refresh(); }, [refresh]);

  useEffect(() => {
    void refresh();
    const onFocus = () => void refresh();
    window.addEventListener("focus", onFocus);
    return () => window.removeEventListener("focus", onFocus);
  }, [refresh]);

  const showToast = useCallback((msg: string) => {
    setToast(msg);
    if (toastTimer.current) clearTimeout(toastTimer.current);
    toastTimer.current = setTimeout(() => setToast(null), 2400);
  }, []);

  const addContact = useCallback((c: Contact) => setContacts((cs) => [...cs, c]), []);
  const addAlert = useCallback((a: Omit<Alert, "id">) => setAlerts((as) => [{ ...a, id: nextId.current++ }, ...as]), []);
  const toggleAlert = useCallback((id: number) => setAlerts((as) => as.map((a) => (a.id === id ? { ...a, on: !a.on } : a))), []);
  const removeAlert = useCallback((id: number) => setAlerts((as) => as.filter((a) => a.id !== id)), []);
  const addGuardian = useCallback((g: Omit<Guardian, "id">) => setGuardians((gs) => [...gs, { ...g, id: nextId.current++ }]), []);
  const removeGuardian = useCallback((id: number) => setGuardians((gs) => gs.filter((g) => g.id !== id)), []);

  const directory = useMemo<Directory>(() => ({ contacts, registry: {}, blocklist: {} }), [contacts]);
  const totalUsd = useMemo(() => assets.reduce((s, t) => s + t.balance * t.price, 0), [assets]);

  const value = useMemo<WalletState>(() => ({
    connected: !!address, kind, address, chain: CHAIN, tokens: assets, totalUsd, loading, refresh, recheck,
    contacts, addContact, alerts, addAlert, toggleAlert, removeAlert, guardians, addGuardian, removeGuardian,
    directory, toast, showToast,
  }), [address, kind, assets, totalUsd, loading, refresh, recheck, contacts, addContact, alerts, addAlert, toggleAlert, removeAlert, guardians, addGuardian, removeGuardian, directory, toast, showToast]);

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}


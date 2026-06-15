"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { isStrict, setStrict } from "@/lib/privacy";

interface Cmd { label: string; hint?: string; run: () => void }

export function CommandPalette() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [q, setQ] = useState("");

  const commands: Cmd[] = useMemo(() => {
    const go = (href: string) => () => { router.push(href); setOpen(false); };
    const nav: Array<[string, string]> = [
      ["Home", "/"], ["Send", "/send"], ["Receive", "/receive"], ["Activity", "/activity"],
      ["Add funds", "/buy"], ["Swap", "/swap"], ["Earn", "/earn"],
      ["Markets", "/markets"], ["Insights", "/insights"], ["Copilot", "/copilot"],
      ["Live chain", "/live"], ["Watch address", "/watch"],
      ["Account (wallet)", "/account"], ["Smart account", "/smart-account"],
      ["Approvals & Revoke", "/approvals"], ["Wallet Health", "/health"],
      ["Contacts", "/contacts"], ["Alerts", "/alerts"], ["Security", "/security"], ["Privacy", "/privacy"],
    ];
    const list: Cmd[] = nav.map(([label, href]) => ({ label: `Go to ${label}`, hint: href, run: go(href) }));
    list.push({ label: "Lock wallet", hint: "action", run: () => { router.push("/unlock"); setOpen(false); } });
    list.push({ label: "Toggle Strict privacy mode", hint: "action", run: () => { setStrict(!isStrict()); setOpen(false); } });
    return list;
  }, [router]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") { e.preventDefault(); setOpen((v) => !v); }
      if (e.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  useEffect(() => { if (!open) setQ(""); }, [open]);

  if (!open) return null;
  const filtered = commands.filter((c) => c.label.toLowerCase().includes(q.toLowerCase()));

  return (
    <div className="cmd-overlay" onClick={() => setOpen(false)}>
      <div className="cmd glass" onClick={(e) => e.stopPropagation()}>
        <input
          autoFocus className="cmd-input" placeholder="Type a command or screen…  (Esc to close)"
          value={q} onChange={(e) => setQ(e.target.value)}
          onKeyDown={(e) => { if (e.key === "Enter" && filtered[0]) filtered[0].run(); }}
        />
        <div className="cmd-list">
          {filtered.length === 0 && <div className="cmd-empty">No matches</div>}
          {filtered.slice(0, 9).map((c, i) => (
            <button className="cmd-item" key={i} onClick={c.run}>
              <span>{c.label}</span>
              {c.hint && <span className="cmd-hint">{c.hint}</span>}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

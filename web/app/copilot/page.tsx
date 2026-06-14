"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { copilotReply, COPILOT_SUGGESTIONS, escapeHtml, type CopilotAction } from "@lumen/core";
import { useWallet } from "@/components/WalletProvider";

interface Msg { role: "user" | "bot"; html: string; action?: CopilotAction }

export default function CopilotScreen() {
  const { tokens, history, directory } = useWallet();
  const router = useRouter();
  const [msgs, setMsgs] = useState<Msg[]>([
    { role: "bot", html: "Hi, I'm your Lumen Copilot. I can check your portfolio, screen addresses for scams, explain transactions, or set up a send for you. Try a suggestion below." },
  ]);
  const [text, setText] = useState("");
  const logRef = useRef<HTMLDivElement>(null);

  useEffect(() => { logRef.current?.scrollTo({ top: logRef.current.scrollHeight }); }, [msgs]);

  function ask(q: string) {
    if (!q.trim()) return;
    const reply = copilotReply(q, { tokens, history, directory });
    setMsgs((m) => [...m, { role: "user", html: escapeHtml(q) }, { role: "bot", html: reply.html, action: reply.action }]);
    setText("");
  }

  function runAction(a: CopilotAction) {
    if (a.route === "/send" && a.prefill) {
      const qs = new URLSearchParams();
      if (a.prefill.sym) qs.set("token", a.prefill.sym);
      if (a.prefill.amount) qs.set("amount", a.prefill.amount);
      if (a.prefill.recipient) qs.set("to", a.prefill.recipient);
      router.push(`/send?${qs.toString()}`);
    } else if (a.route) {
      router.push(a.route);
    }
  }

  return (
    <div className="view" style={{ maxWidth: 760, display: "flex", flexDirection: "column", height: "calc(100vh - 120px)" }}>
      <div className="view-head"><h2>Copilot</h2><p className="muted">A local assistant — no API key, runs on your wallet data.</p></div>
      <div className="chat-log" ref={logRef}>
        {msgs.map((m, i) => (
          <div className={`chat-msg ${m.role}`} key={i}>
            <span dangerouslySetInnerHTML={{ __html: m.html }} />
            {m.action && <button className="chat-action" onClick={() => runAction(m.action!)}>{m.action.label}</button>}
          </div>
        ))}
      </div>
      <div className="chat-suggest">
        {COPILOT_SUGGESTIONS.map((s) => <button key={s} className="chip" onClick={() => ask(s)}>{s}</button>)}
      </div>
      <form className="chat-input" onSubmit={(e) => { e.preventDefault(); ask(text); }}>
        <input className="input" placeholder="Ask anything about your wallet…" value={text} onChange={(e) => setText(e.target.value)} />
        <button className="btn btn-primary" type="submit">Send</button>
      </form>
    </div>
  );
}

"use client";

import { useState } from "react";
import { initials, colorFor } from "@lumen/core";
import { useWallet } from "@/components/WalletProvider";
import { Icon } from "@/components/icons";

export default function SecurityScreen() {
  const { guardians, addGuardian, removeGuardian, showToast } = useWallet();
  const [name, setName] = useState("");
  const [handle, setHandle] = useState("");

  const need = guardians.length >= 2 ? Math.max(2, Math.round(guardians.length * 0.6)) : guardians.length;

  function onAdd() {
    if (!name.trim() || !handle.trim()) { showToast("Enter a name and handle"); return; }
    addGuardian({ name: name.trim(), handle: handle.trim() });
    setName(""); setHandle("");
    showToast("Guardian added");
  }

  return (
    <div className="view" style={{ maxWidth: 720 }}>
      <div className="view-head"><h2>Security &amp; recovery</h2><p className="muted">No seed phrase. Trusted guardians can help you recover access.</p></div>
      <div className="verdict safe" style={{ marginTop: 0 }}>
        <div className="verdict-head">
          <div className="verdict-badge"><Icon name="shield" size={20} /></div>
          <div>
            <div className="verdict-title">Social recovery</div>
            <div className="verdict-sub">{guardians.length ? `${need} of ${guardians.length} guardians needed to recover your wallet` : "Add guardians who can help you recover access"}</div>
          </div>
        </div>
      </div>

      <div className="card glass" style={{ margin: "18px 0" }}>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr auto", gap: 10, alignItems: "end" }}>
          <div className="field" style={{ margin: 0 }}><label>Guardian name</label><input className="input" value={name} onChange={(e) => setName(e.target.value)} placeholder="Trusted friend" /></div>
          <div className="field" style={{ margin: 0 }}><label>Handle</label><input className="input" value={handle} onChange={(e) => setHandle(e.target.value)} placeholder="friend.lumen" /></div>
          <button className="btn btn-primary" onClick={onAdd}>Add</button>
        </div>
      </div>

      {guardians.length === 0 && <div className="muted">No guardians yet — add trusted contacts above.</div>}
      {guardians.map((g) => (
        <div className="tx" key={g.id}>
          <div className="coin" style={{ backgroundImage: colorFor(g.name), color: "#fff" }}>{initials(g.name)}</div>
          <div className="tx-main"><div className="tx-title">{g.name}</div><div className="tx-sub">{g.handle}</div></div>
          <span className="chip active" style={{ marginRight: 8 }}>Active</span>
          <button className="iconbtn" onClick={() => { removeGuardian(g.id); showToast("Guardian removed"); }} aria-label="Remove"><Icon name="x" size={16} /></button>
        </div>
      ))}
    </div>
  );
}

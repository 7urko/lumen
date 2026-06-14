"use client";

import { useState } from "react";
import Link from "next/link";
import { resolveRecipient, isFlagged, shortAddr, initials, colorFor, type Contact } from "@lumen/core";
import { useWallet } from "@/components/WalletProvider";
import { Icon } from "@/components/icons";

export default function ContactsScreen() {
  const { contacts, directory, addContact, showToast } = useWallet();
  const [name, setName] = useState("");
  const [handle, setHandle] = useState("");

  function onAdd() {
    if (!name.trim() || !handle.trim()) { showToast("Enter a name and address/username"); return; }
    const r = resolveRecipient(handle.trim(), directory);
    let address = handle.trim();
    let username = "";
    if (r.ok) {
      address = r.address ?? address;
      username = r.kind === "username" ? handle.trim().toLowerCase() : (r.contact ? r.contact.username : "");
    }
    if (!username) username = name.trim().toLowerCase().split(/\s+/)[0] + ".lumen";
    const c: Contact = { name: name.trim(), username, address };
    addContact(c);
    setName(""); setHandle("");
    showToast("Contact added");
  }

  return (
    <div className="view" style={{ maxWidth: 720 }}>
      <div className="view-head"><h2>Contacts</h2><p className="muted">Send to people by name instead of a raw address.</p></div>
      <div className="card glass" style={{ marginBottom: 18 }}>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr auto", gap: 10, alignItems: "end" }}>
          <div className="field" style={{ margin: 0 }}><label>Name</label><input className="input" value={name} onChange={(e) => setName(e.target.value)} placeholder="Jane Doe" /></div>
          <div className="field" style={{ margin: 0 }}><label>Address or username</label><input className="input" value={handle} onChange={(e) => setHandle(e.target.value)} placeholder="jane.lumen or 0x…" /></div>
          <button className="btn btn-primary" onClick={onAdd}>Add</button>
        </div>
      </div>

      {contacts.map((c) => {
        const flagged = isFlagged(c.address, directory.blocklist);
        return (
          <div className="tx" key={c.username + c.address}>
            <div className="coin" style={{ backgroundImage: colorFor(c.name), color: "#fff" }}>{initials(c.name)}</div>
            <div className="tx-main">
              <div className="tx-title">{c.name}</div>
              <div className="tx-sub">{c.username} · {shortAddr(c.address)}{flagged ? " · ⚠ Flagged by Scam Shield" : ""}</div>
            </div>
            <Link className="btn" href={`/send?to=${encodeURIComponent(c.username)}`}><Icon name="send" size={16} /> Send</Link>
          </div>
        );
      })}
    </div>
  );
}

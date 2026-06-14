"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Icon } from "./icons";

const NAV: Array<{ group: string; items: Array<{ href: string; label: string; icon: string }> }> = [
  { group: "Wallet", items: [
    { href: "/", label: "Home", icon: "home" },
    { href: "/send", label: "Send", icon: "send" },
    { href: "/receive", label: "Receive", icon: "receive" },
    { href: "/activity", label: "Activity", icon: "activity" },
  ]},
  { group: "Trade", items: [
    { href: "/buy", label: "Buy", icon: "buy" },
    { href: "/swap", label: "Swap", icon: "swap" },
    { href: "/earn", label: "Earn", icon: "earn" },
  ]},
  { group: "Explore", items: [
    { href: "/markets", label: "Markets", icon: "markets" },
    { href: "/insights", label: "Insights", icon: "insights" },
    { href: "/copilot", label: "Copilot", icon: "chat" },
    { href: "/live", label: "Live chain", icon: "globe" },
  ]},
  { group: "Manage", items: [
    { href: "/contacts", label: "Contacts", icon: "users" },
    { href: "/alerts", label: "Alerts", icon: "bell" },
    { href: "/account", label: "Account", icon: "lock" },
    { href: "/smart-account", label: "Smart account", icon: "key" },
    { href: "/security", label: "Security", icon: "shield" },
  ]},
];

export function Sidebar() {
  const path = usePathname();
  return (
    <aside className="sidebar">
      <div className="sb-brand">
        <div className="brand-mark"><Icon name="logo" size={22} /></div>
        <div className="sb-brand-text">
          <span className="sb-name">Lumen</span>
          <span className="sb-tag">Web</span>
        </div>
      </div>
      <nav>
        {NAV.map((section) => (
          <div key={section.group}>
            <div className="sb-group">{section.group}</div>
            {section.items.map((item) => {
              const active = item.href === "/" ? path === "/" : path.startsWith(item.href);
              return (
                <Link key={item.href} href={item.href} className={`navlink${active ? " active" : ""}`}>
                  <Icon name={item.icon} size={20} />
                  <span>{item.label}</span>
                </Link>
              );
            })}
          </div>
        ))}
      </nav>
      <div className="sb-foot">
        <Link href="/welcome" className="sb-demo" style={{ display: "block", marginBottom: 8 }}>View onboarding flow →</Link>
        <div className="sb-demo">Demo · mock data · no real funds</div>
      </div>
    </aside>
  );
}

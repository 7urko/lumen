import Link from "next/link";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "Privacy Policy" };

const EFFECTIVE = "18 June 2026";

export default function PrivacyPolicyPage() {
  return (
    <div className="view legal" style={{ maxWidth: 760 }}>
      <div className="view-head"><h2>Privacy Policy</h2><p className="muted">Effective {EFFECTIVE}</p></div>

      <div className="verdict caution" style={{ marginBottom: 18 }}>
        <div className="verdict-head"><div className="verdict-badge">i</div><div>
          <div className="verdict-title">Template — have your lawyer finalise this</div>
          <div className="verdict-sub">A standard non-custodial wallet template, not legal advice. Confirm it matches your actual data flows and your jurisdiction’s requirements (GDPR/CCPA, etc.) before launch.</div>
        </div></div>
      </div>

      <div className="card glass legal-body">
        <h3>Summary</h3>
        <p>Lumen is built to collect as little as possible. There are <b>no accounts, no sign-up, no analytics, no advertising, and no tracking cookies</b>. We do not have a server that stores your personal data. Your wallet, keys/passkey, and settings live on <b>your device</b>.</p>

        <h3>What stays on your device</h3>
        <p>Your encrypted wallet (if you use the password wallet), your passkey reference, contacts, alerts, and preferences are stored in your browser’s local storage on your device. We cannot read them. Clearing your browser storage removes them permanently.</p>

        <h3>What necessarily leaves your device</h3>
        <p>Because a wallet talks to public blockchains, some requests leave your device. By their nature these expose your IP address and the wallet/transaction data inherent to the request:</p>
        <ul>
          <li><b>Blockchain RPC node</b> — to read balances and broadcast your transactions. Required.</li>
          <li><b>ERC-4337 bundler</b> — to relay your smart-account transactions. Required to send from a smart account.</li>
          <li><b>ENS resolution</b> — an Ethereum RPC lookup when you enter a <code>.eth</code> name.</li>
          <li><b>Google Fonts</b> and the <b>TradingView</b> price chart — cosmetic; both can be turned off in Strict privacy mode. The chart is sandboxed and cannot access your wallet.</li>
        </ul>
        <p>The Privacy screen in the app enumerates exactly which external calls are made.</p>

        <h3>What we do NOT do</h3>
        <p>We do not sell or share your data. We do not run analytics or behavioural tracking. We do not set advertising cookies. We do not build user profiles. We do not require or collect your name, email, or government ID (no KYC at the interface level).</p>

        <h3>Third parties</h3>
        <p>The third-party infrastructure above (RPC providers, the bundler host, font/chart providers) may process the requests they receive under their own privacy practices. You can point the app at your own RPC/bundler to minimise this. We are not responsible for third-party practices.</p>

        <h3>Your rights</h3>
        <p>Because we don’t hold your personal data on a server, there is generally nothing for us to access, export, or delete on your behalf — your data is in your own control on your device. Where applicable law (e.g. GDPR, CCPA) grants you rights regarding any data a third-party provider processes, you may exercise them with that provider. <b>[Counsel to confirm scope and any controller/processor obligations.]</b></p>

        <h3>Children</h3>
        <p>The Interface is not directed to children and is not intended for anyone under the age required to use it in their jurisdiction.</p>

        <h3>Changes &amp; contact</h3>
        <p>We may update this Policy; the effective date above will change. Questions: <b>[contact email]</b>.</p>
      </div>

      <p className="muted" style={{ marginTop: 16, fontSize: 13 }}>See also our <Link href="/legal/terms" style={{ color: "var(--accent-2)" }}>Terms of Service</Link>.</p>
    </div>
  );
}

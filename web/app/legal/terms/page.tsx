import Link from "next/link";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "Terms of Service" };

const EFFECTIVE = "18 June 2026";

export default function TermsPage() {
  return (
    <div className="view legal" style={{ maxWidth: 760 }}>
      <div className="view-head"><h2>Terms of Service</h2><p className="muted">Effective {EFFECTIVE}</p></div>

      <div className="verdict caution" style={{ marginBottom: 18 }}>
        <div className="verdict-head"><div className="verdict-badge">i</div><div>
          <div className="verdict-title">Template — have your lawyer finalise this</div>
          <div className="verdict-sub">This is a standard non-custodial wallet template, not legal advice. Your counsel should review and adapt it (entity name, governing law, jurisdiction list) before launch.</div>
        </div></div>
      </div>

      <div className="card glass legal-body">
        <h3>1. Agreement</h3>
        <p>These Terms govern your use of the Lumen wallet interface (the “Interface”). By accessing or using the Interface you agree to them. If you do not agree, do not use the Interface.</p>

        <h3>2. Non-custodial service</h3>
        <p>Lumen is a <b>non-custodial</b>, self-hosted interface to public blockchains. You alone control your wallet, your keys (or passkey), and your funds. We never take custody of, control, or have access to your assets, private keys, or passkey. We cannot move, freeze, recover, or reverse your transactions, and we cannot reset or recover a lost password or passkey. We are not a bank, money transmitter, exchange, custodian, broker, or fiduciary.</p>

        <h3>3. You are responsible for your wallet</h3>
        <p>You are solely responsible for securing your device, password, passkey, and recovery means, and for verifying every transaction before you sign it. Blockchain transactions are <b>irreversible</b>. Sending to a wrong or malicious address, approving a malicious contract, or losing your credentials may result in permanent, unrecoverable loss. Tools such as Scam Shield are informational aids only and are not a guarantee of safety.</p>

        <h3>4. Eligibility &amp; prohibited jurisdictions</h3>
        <p>You must be of legal age and legally permitted to use the Interface in your jurisdiction. You may not use the Interface if you are located in, or are a resident or national of, any jurisdiction subject to comprehensive sanctions, or if you are a sanctioned or restricted person. You are responsible for your own compliance with local law.</p>

        <h3>5. No financial, legal, or tax advice</h3>
        <p>Nothing in the Interface is financial, investment, legal, or tax advice. Prices and other on-chain data are provided “as is” from public sources and may be inaccurate or delayed. You are responsible for your own decisions and for any taxes arising from your activity.</p>

        <h3>6. Third-party services and protocols</h3>
        <p>The Interface reads from and broadcasts to third-party infrastructure (e.g. blockchain RPC nodes, an ERC-4337 bundler, decentralized protocols such as Uniswap, and an optional market-data chart). We do not control these and are not responsible for them. Your interactions with on-chain protocols are solely between you and those protocols.</p>

        <h3>7. Open-source, “as is”, no warranty</h3>
        <p>The Interface is provided on an “as is” and “as available” basis without warranties of any kind, express or implied, including merchantability, fitness for a particular purpose, and non-infringement. We do not warrant that the Interface will be uninterrupted, secure, or error-free.</p>

        <h3>8. Limitation of liability</h3>
        <p>To the maximum extent permitted by law, we will not be liable for any indirect, incidental, special, consequential, or exemplary damages, or for any loss of funds, profits, data, or goodwill, arising from your use of (or inability to use) the Interface, including losses caused by your own error, third-party services, or on-chain protocols.</p>

        <h3>9. Indemnification</h3>
        <p>You agree to indemnify and hold harmless the operators of the Interface from any claim arising out of your use of the Interface or your violation of these Terms or applicable law.</p>

        <h3>10. Changes &amp; governing law</h3>
        <p>We may update these Terms; continued use after an update constitutes acceptance. Governing law and dispute resolution are <b>[to be set by counsel]</b>.</p>

        <h3>11. Contact</h3>
        <p>Questions about these Terms: <b>[contact email]</b>.</p>
      </div>

      <p className="muted" style={{ marginTop: 16, fontSize: 13 }}>See also our <Link href="/legal/privacy" style={{ color: "var(--accent-2)" }}>Privacy Policy</Link>.</p>
    </div>
  );
}

# Lumen — compliance posture

> **Not legal advice.** This records a product decision and the reasoning behind it. Before any public
> launch with real funds, get a short consult with a crypto/fintech lawyer for your jurisdiction(s).

## Decision (2026-06-14): non-custodial, no KYC

Lumen is a **non-custodial wallet with no built-in KYC**, the model used by MetaMask, Rabby, Phantom,
Rainbow, etc. The legal basis: Lumen is *software*, not a financial service. Users hold their own keys;
Lumen never takes custody, never controls funds, and is never in the flow of money. Pure non-custodial
wallet software is generally not treated as money transmission (e.g. US FinCEN guidance), so it can be
offered without registering users or collecting identity.

## What keeps us in the no-KYC lane (design rules)

- **Non-custodial, always.** We never hold, move, freeze, or recover a user's funds. Keys stay on the
  user's device.
- **No built-in fiat processing.** Lumen does **not** take cards or process payments. The "Add funds"
  screen only (a) shows the user's receive address and (b) **links out** to independent exchanges /
  on-ramps that run their *own* KYC. We are not in the payment flow. *(Was a fake card on-ramp; changed.)*
- **No in-app yield product.** The "Earn" screen is **informational only** — it shows reference rates and
  explains that staking happens on the protocol's own contracts, with the user keeping custody. Lumen
  does not offer, custody, or pool yield. *(Avoids securities/"investment product" exposure.)*
- **Swaps are non-custodial.** Token swaps route to a DEX (on-chain contracts); Lumen never holds the
  assets mid-swap.

## What still needs doing before a public launch (not code — operational/legal)

- **Sanctions / geo-blocking.** Even non-custodial software shouldn't knowingly serve sanctioned
  jurisdictions/persons (OFAC etc.). Plan a geo-block of prohibited countries at the app/hosting layer.
- **Terms of Service + Privacy Policy** making the non-custodial, "we can't recover your keys", no-KYC
  nature explicit.
- **Lawyer consult** for the user's home jurisdiction and target markets (US FinCEN/state, EU MiCA, UK
  FCA all differ). MiCA largely exempts fully non-custodial software; custodial/exchange services don't.
- **Don't drift into regulated territory:** the moment Lumen would take custody, process fiat directly,
  or operate an exchange/yield product, KYC/licensing obligations attach. Keep the design rules above.

## Net effect on the app

`/buy` is now a non-custodial "Add funds" page (receive + external on-ramp links). `/earn` is
informational. Positioning across the app says: **non-custodial · you hold your keys · no KYC.**

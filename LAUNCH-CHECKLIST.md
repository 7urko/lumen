# Lumen — mainnet launch checklist

Single source of truth for going live. Owner column: **C** = Claude can do/has done,
**You** = requires you (machine access, infra, funds, signatures, or a human decision).

## ✅ Done (in the codebase)
- [x] **C** — Security hardening: nonce CSP + headers, vault password strength + auto-lock,
      checksum-strict recipient confirm, address validation, sandboxed chart, dead-code removal
      (`SECURITY-REVIEW.md`).
- [x] **C** — Verified Base **mainnet** addresses vs canonical sources (`ADDRESSES.md`).
- [x] **C** — One-switch mainnet capability: `NEXT_PUBLIC_CHAIN=base` (`web/lib/config.ts`, `DEPLOY.md`).
- [x] **C** — Browser-EOA disabled on mainnet (passkey smart account only).
- [x] **C** — Bundler made mainnet-capable (`bundler/alto-config.mainnet.example.json`, `bundler/README.md`).
- [x] **C** — Terms of Service + Privacy Policy pages (`/legal/terms`, `/legal/privacy`) + footer links.
- [x] **C** — Sanctions geo-block in `middleware.ts` (baseline list, tunable).
- [x] **C** — Env template (`web/.env.example`).

## ⏳ Remaining — do these IN ORDER

### 1. Build verification &nbsp;·&nbsp; **You run, C fixes** &nbsp;·&nbsp; BLOCKER
- [ ] Run `_build.bat` (or `npm run build -w web`). It logs to `_build.log`.
- [ ] Send me the log. I fix any errors. **Nothing else proceeds until this is green.**
- [ ] `npm run dev -w web`, click through send / swap / approvals **on testnet** — all work.

### 2. Lawyer-finalise the legal pages &nbsp;·&nbsp; **You + counsel**
- [ ] Replace the bracketed placeholders in `/legal/terms` + `/legal/privacy` (entity, governing
      law, contact email) and have counsel approve the final wording.
- [ ] Confirm the geo-block list in `middleware.ts` matches counsel's required jurisdictions.

### 3. Stand up the mainnet bundler &nbsp;·&nbsp; **You run + fund, C configured**
- [ ] Generate a relay key (`node bundler/gen-key.mjs`); fund it with **real ETH** on Base.
- [ ] `copy alto-config.mainnet.example.json alto-config.json`, paste the funded key.
- [ ] `docker compose up --build`; expose it over HTTPS on a domain you control.
- [ ] (Optional, for gasless) deploy + fund a paymaster — after basic sending works.

### 4. Deploy &nbsp;·&nbsp; **You push, C guides**
- [ ] Push to GitHub; import to Vercel with **Root Directory = `web`** (`DEPLOY.md`).
- [ ] Set env vars: `NEXT_PUBLIC_BUNDLER_URL`, your RPCs — but **leave `NEXT_PUBLIC_CHAIN` unset**
      for a final testnet dress-rehearsal on the real URL first.

### 5. Flip to mainnet &nbsp;·&nbsp; **You** &nbsp;·&nbsp; LAST STEP
- [ ] After 1–4 pass, set `NEXT_PUBLIC_CHAIN=base` and redeploy.
- [ ] Smoke test on mainnet with a **tiny** amount.

### 6. First real send &nbsp;·&nbsp; **You only**
- [ ] You make the first real-money transaction yourself. I never move funds.

## Post-launch (recommended)
- [ ] Publish the audit report; add a `SECURITY.md` with a disclosure contact.
- [ ] Monitoring on the bundler relay key balance + uptime.
- [ ] Move CSP to consider any new origins; periodic dependency `npm audit` / Dependabot.

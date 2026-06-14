/* =========================================================
   Lumen Wallet — front-end demo
   All state is in-memory mock data. No real keys, no network.
   Feature set: Scam Shield · Smart Account · Buy/Swap ·
   Contacts/usernames · AI Copilot · Insights/P&L · Alerts · Earn
   ========================================================= */

(function () {
  "use strict";

  // ---------- mock data ----------
  const WORDLIST = [
    "ribbon", "harvest", "lunar", "copper", "meadow", "tunnel", "crystal", "ember",
    "fabric", "glide", "hollow", "ivory", "jungle", "kettle", "lantern", "marble",
    "nectar", "orbit", "pebble", "quiver", "ripple", "saddle", "timber", "velvet",
    "willow", "zephyr", "anchor", "breeze", "cinder", "drift", "echo", "frost"
  ];

  // price = live mock spot · cost = average cost basis (for P&L) · staked = amount earning yield
  const TOKENS = [
    { sym: "BTC",  name: "Bitcoin",  grad: ["#f7931a", "#ffcf6b"], balance: 0.4821,  price: 64210.55, cost: 41800.00, change:  2.8, staked: 0,    apy: 0,    tv: "BINANCE:BTCUSDT" },
    { sym: "ETH",  name: "Ethereum", grad: ["#627eea", "#a9b8ff"], balance: 3.927,   price: 3375.10,  cost: 2180.00,  change:  1.6, staked: 1.5,  apy: 4.2,  tv: "BINANCE:ETHUSDT" },
    { sym: "SOL",  name: "Solana",   grad: ["#14f195", "#7afcd2"], balance: 58.20,   price: 168.42,   cost: 96.40,    change: -3.1, staked: 20.0, apy: 6.8,  tv: "BINANCE:SOLUSDT" },
    { sym: "USDC", name: "USD Coin", grad: ["#2775ca", "#5aa6ff"], balance: 1250.00, price: 1.00,     cost: 1.00,     change:  0.0, staked: 0,    apy: 5.1,  tv: "BINANCE:BTCUSDT", stable: true },
    { sym: "MATIC",name: "Polygon",  grad: ["#8247e5", "#c79bff"], balance: 940.5,   price: 0.72,     cost: 1.18,     change:  4.4, staked: 0,    apy: 3.9,  tv: "BINANCE:MATICUSDT" }
  ];

  // honor reduced-motion for JS-driven animations (counter, sparkline draw)
  const REDUCED = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  // STATIC = render final values instantly (set on ?screen= deep-links so screenshots
  // capture the true balance rather than a mid-count frame). Live app stays animated.
  let STATIC = false;

  // seed history (newest first added at runtime via unshift)
  const HISTORY = [
    { dir: "in",  sym: "ETH",  amount: 1.5,    address: "0x9f4a...c21b", ts: daysAgo(1) },
    { dir: "out", sym: "USDC", amount: 320.00, address: "alice.lumen",   ts: daysAgo(2) },
    { dir: "in",  sym: "BTC",  amount: 0.05,   address: "bc1qx...7h2k",  ts: daysAgo(4) },
    { dir: "out", sym: "SOL",  amount: 12.0,   address: "5Gw8...Qm3v",   ts: daysAgo(6) },
    { dir: "in",  sym: "MATIC",amount: 500.0,  address: "0x12ab...ff09", ts: daysAgo(9) }
  ];

  // ----- usernames + contacts (ENS-style .lumen registry) -----
  const DRAINER_ADDR = "0x9f13a4c0db4e1fb2c0dead5ef21ab77c0d1a9e55";
  const REGISTRY = {
    "alice.lumen":  "0x4a8f23bd9c1e77a6f0b2d4513e8c9a2f17b6d340",
    "bob.lumen":    "0x77de10b4c2a91f3e8d6045a09b8c7e21ff8043a4",
    "satoshi.lumen":"0x12abf0091c3e5d7a4b8e6f2019cd33aa07ff09b1",
    "maya.lumen":   "0x6c0fae12b9d4471e2a8f53c0d9b71e44a05c8821",
    "vault.lumen":  "0x3e91d7c5a0b248f16ec9034b7d52a8f0916ccaa2",
    "claim-airdrop.lumen": DRAINER_ADDR  // scam handle → known drainer
  };
  const CONTACTS = [
    { name: "Alice Nguyen",  username: "alice.lumen",   address: REGISTRY["alice.lumen"] },
    { name: "Bob Carter",    username: "bob.lumen",     address: REGISTRY["bob.lumen"] },
    { name: "Maya Okafor",   username: "maya.lumen",    address: REGISTRY["maya.lumen"] },
    { name: "Cold Vault",    username: "vault.lumen",   address: REGISTRY["vault.lumen"] }
  ];

  // ----- Scam Shield threat intel (mock) -----
  const BLOCKLIST = {}; // address(lower) -> reasons[]
  BLOCKLIST[DRAINER_ADDR] = [
    "Flagged as a known wallet-drainer contract",
    "Reported by 1,284 users in the last 30 days",
    "Requests unlimited token approvals, then sweeps funds",
    "Linked to 7 phishing “airdrop claim” sites"
  ];
  BLOCKLIST["0x000000000000000000000000000000000000dead"] = [
    "Burn address — funds sent here are destroyed forever"
  ];

  // ----- price alerts (mock) -----
  let alertId = 1;
  const ALERTS = [
    { id: alertId++, sym: "BTC", dir: "above", price: 70000, on: true },
    { id: alertId++, sym: "ETH", dir: "below", price: 3000,  on: true },
    { id: alertId++, sym: "SOL", dir: "above", price: 200,   on: false }
  ];

  // ----- social recovery guardians (mock) -----
  let guardianId = 1;
  const GUARDIANS = [
    { id: guardianId++, name: "Alice Nguyen", handle: "alice.lumen" },
    { id: guardianId++, name: "Maya Okafor",  handle: "maya.lumen" }
  ];

  let WALLET_ADDRESS = "";
  const WALLET_USERNAME = "you.lumen";
  let buyMethod = "card";
  let slippage = 0.5;

  // ---------- helpers ----------
  function daysAgo(n) { return Date.now() - n * 86400000; }
  function $(sel, root) { return (root || document).querySelector(sel); }
  function $all(sel, root) { return Array.from((root || document).querySelectorAll(sel)); }
  function token(sym) { return TOKENS.find(t => t.sym === sym); }

  function fmtUsd(n) {
    const abs = Math.abs(n);
    const dp = abs > 0 && abs < 1 ? (abs < 0.01 ? 6 : 4) : 2;
    return "$" + n.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: dp });
  }
  function fmtUsd0(n) { return "$" + Math.round(n).toLocaleString("en-US"); }
  function fmtSigned(n) { return (n >= 0 ? "+" : "−") + fmtUsd(Math.abs(n)); }
  function fmtAmt(n) {
    const s = Number(n).toFixed(6).replace(/\.?0+$/, "");
    return s === "" ? "0" : s;
  }
  function totalUsd() { return TOKENS.reduce((s, t) => s + (t.balance + t.staked) * t.price, 0); }
  function liquidUsd() { return TOKENS.reduce((s, t) => s + t.balance * t.price, 0); }
  function shortAddr(a) {
    if (!a) return "";
    if (a.length <= 14) return a;
    return a.slice(0, 8) + "…" + a.slice(-6);
  }
  function genAddress() {
    const hex = "0123456789abcdef";
    let s = "0x";
    for (let i = 0; i < 40; i++) s += hex[Math.floor(Math.random() * 16)];
    return s;
  }
  function genSeed() {
    const words = [];
    for (let i = 0; i < 12; i++) words.push(WORDLIST[Math.floor(Math.random() * WORDLIST.length)]);
    return words;
  }
  function relTime(ts) {
    const diff = Date.now() - ts;
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return "just now";
    if (mins < 60) return mins + "m ago";
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return hrs + "h ago";
    const days = Math.floor(hrs / 24);
    if (days < 30) return days + "d ago";
    return new Date(ts).toLocaleDateString();
  }
  function initials(name) {
    const p = name.trim().split(/\s+/);
    return ((p[0] || "")[0] || "" ) + ((p[1] || "")[0] || "");
  }
  function colorFor(str) {
    let h = 0;
    for (let i = 0; i < str.length; i++) h = (h * 31 + str.charCodeAt(i)) % 360;
    return "linear-gradient(135deg,hsl(" + h + " 70% 55%),hsl(" + ((h + 40) % 360) + " 75% 62%))";
  }
  function escapeHtml(s) {
    return String(s).replace(/[&<>"]/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
  }

  // ---------- sparklines ----------
  function buildSeries(seed, change, n) {
    n = n || 28;
    const pts = [];
    let v = 100;
    let r = seed * 9301 + 49297;
    const rng = () => { r = (r * 9301 + 49297) % 233280; return r / 233280; };
    const trend = change / 100 / n;
    for (let i = 0; i < n; i++) {
      v += (rng() - 0.5) * 6 + v * trend;
      pts.push(v);
    }
    return pts;
  }

  let sparkUid = 0;
  function sparkSVG(data, opts) {
    opts = opts || {};
    const w = opts.w || 100, h = opts.h || 34, pad = 2, fill = opts.fill !== false;
    const up = opts.color || "var(--up)";
    const min = Math.min.apply(null, data), max = Math.max.apply(null, data);
    const span = (max - min) || 1;
    const stepX = (w - pad * 2) / (data.length - 1);
    const pts = data.map((d, i) => {
      const x = pad + i * stepX;
      const y = pad + (h - pad * 2) * (1 - (d - min) / span);
      return [x, y];
    });
    const line = pts.map((p, i) => (i ? "L" : "M") + p[0].toFixed(1) + " " + p[1].toFixed(1)).join(" ");
    const area = "M" + pts[0][0].toFixed(1) + " " + (h - pad) + " " +
      line.replace(/^M/, "L") + " L" + pts[pts.length - 1][0].toFixed(1) + " " + (h - pad) + " Z";
    const id = "spk" + (++sparkUid);
    const len = Math.round(pts.reduce((s, p, i) => i ? s + Math.hypot(p[0] - pts[i-1][0], p[1] - pts[i-1][1]) : 0, 0));
    return '<svg viewBox="0 0 ' + w + ' ' + h + '" preserveAspectRatio="none">' +
      '<defs><linearGradient id="' + id + '" x1="0" y1="0" x2="0" y2="1">' +
        '<stop offset="0" stop-color="' + up + '" stop-opacity="0.28"/>' +
        '<stop offset="1" stop-color="' + up + '" stop-opacity="0"/>' +
      '</linearGradient></defs>' +
      (fill ? '<path class="spark-fill" d="' + area + '" fill="url(#' + id + ')"/>' : '') +
      '<path class="spark-path" d="' + line + '" fill="none" stroke="' + up + '" ' +
        'stroke-width="' + (opts.sw || 2) + '" stroke-linecap="round" stroke-linejoin="round" ' +
        'style="--len:' + len + '"/>' +
      '</svg>';
  }

  // ---------- animated counter ----------
  function animateUsd(el, to) {
    if (REDUCED || STATIC) { el.textContent = fmtUsd(to); return; }
    const from = 0, dur = 900, start = performance.now();
    function frame(now) {
      const p = Math.min(1, (now - start) / dur);
      const eased = 1 - Math.pow(1 - p, 3);
      el.textContent = fmtUsd(from + (to - from) * eased);
      if (p < 1) requestAnimationFrame(frame);
    }
    requestAnimationFrame(frame);
  }

  let toastTimer = null;
  function toast(msg) {
    const el = $("#toast");
    el.textContent = msg;
    el.classList.remove("hidden");
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => el.classList.add("hidden"), 2200);
  }

  function copy(text) {
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(text).then(() => toast("Copied to clipboard")).catch(fallbackCopy);
    } else { fallbackCopy(); }
    function fallbackCopy() {
      const ta = document.createElement("textarea");
      ta.value = text; document.body.appendChild(ta); ta.select();
      try { document.execCommand("copy"); toast("Copied to clipboard"); } catch (e) {}
      document.body.removeChild(ta);
    }
  }

  // ====================================================================
  //  ONBOARDING  (smart account · recovery phrase · import)
  // ====================================================================
  function showOnboardCard(which) {
    ["choice", "smart", "create", "import"].forEach(c => {
      const el = $("#onboard-" + c);
      if (el) el.classList.toggle("hidden", c !== which);
    });
  }

  function initOnboarding() {
    $("#btn-smart").addEventListener("click", () => {
      resetPasskeyStage();
      showOnboardCard("smart");
    });

    $("#btn-create").addEventListener("click", () => {
      const seed = genSeed();
      renderSeedGrid(seed);
      $("#seed-ack").checked = false;
      $("#btn-create-finish").disabled = true;
      showOnboardCard("create");
    });

    $("#btn-import").addEventListener("click", () => showOnboardCard("import"));

    $all("[data-back]").forEach(b =>
      b.addEventListener("click", () => showOnboardCard(b.getAttribute("data-back")))
    );

    $("#seed-ack").addEventListener("change", e => {
      $("#btn-create-finish").disabled = !e.target.checked;
    });
    $("#btn-create-finish").addEventListener("click", () => enterWallet());

    $("#btn-import-finish").addEventListener("click", () => {
      const v = $("#import-phrase").value.trim();
      if (!v) { toast("Enter a recovery phrase"); return; }
      enterWallet();
    });

    // smart-account passkey registration animation
    $("#passkey-ring").addEventListener("click", runPasskeyScan);
    $("#btn-smart-finish").addEventListener("click", () => {
      const ring = $("#passkey-ring");
      if (ring.classList.contains("done")) { enterWallet(false, "Smart account ready"); return; }
      runPasskeyScan(() => enterWallet(false, "Smart account ready"));
    });
  }

  function renderSeedGrid(seed) {
    const grid = $("#seed-grid");
    grid.innerHTML = "";
    seed.forEach((w, i) => {
      const div = document.createElement("div");
      div.className = "seed-word";
      div.innerHTML = "<b>" + (i + 1) + "</b><span>" + w + "</span>";
      grid.appendChild(div);
    });
  }

  function resetPasskeyStage() {
    const ring = $("#passkey-ring");
    ring.classList.remove("scanning", "done");
    $("#passkey-state").textContent = "Tap to register passkey";
  }
  function runPasskeyScan(done) {
    const ring = $("#passkey-ring");
    const state = $("#passkey-state");
    if (ring.classList.contains("scanning")) return;
    ring.classList.remove("done");
    ring.classList.add("scanning");
    state.textContent = "Scanning biometrics…";
    setTimeout(() => {
      ring.classList.remove("scanning");
      ring.classList.add("done");
      state.textContent = "Passkey registered ✓";
      if (typeof done === "function") setTimeout(done, 450);
    }, REDUCED ? 200 : 1100);
  }

  // ====================================================================
  //  ENTER / LOCK / UNLOCK
  // ====================================================================
  function enterWallet(silent, msg) {
    if (!WALLET_ADDRESS) WALLET_ADDRESS = genAddress();
    $("#screen-onboarding").classList.remove("active");
    $("#screen-unlock").classList.remove("active");
    $("#screen-main").classList.add("active");
    $("#top-addr").textContent = WALLET_USERNAME;
    renderAll();
    navigate("dashboard");
    if (!silent) toast(msg || "Wallet ready");
  }

  function lockWallet() {
    closeAllModals();
    $("#screen-main").classList.remove("active");
    $("#screen-unlock").classList.add("active");
    resetFaceId();
  }

  function resetFaceId() {
    const ring = $("#faceid-ring");
    ring.classList.remove("scanning", "done");
    $("#faceid-label").textContent = "Tap to unlock with Face ID";
  }
  function runFaceId() {
    const ring = $("#faceid-ring");
    const label = $("#faceid-label");
    if (ring.classList.contains("scanning")) return;
    ring.classList.remove("done");
    ring.classList.add("scanning");
    label.textContent = "Verifying…";
    setTimeout(() => {
      ring.classList.remove("scanning");
      ring.classList.add("done");
      label.textContent = "Unlocked ✓";
      setTimeout(() => enterWallet(true), 420);
    }, REDUCED ? 200 : 1200);
  }

  function initUnlock() {
    $("#btn-faceid").addEventListener("click", runFaceId);
    $("#btn-unlock-recovery").addEventListener("click", () => {
      enterWallet(true);
      navigate("recovery");
      toast("Social recovery available");
    });
  }

  // ====================================================================
  //  NAVIGATION
  // ====================================================================
  const NAV_VIEWS = ["dashboard", "chart", "copilot", "insights"]; // have a bottom-nav button

  function navigate(view) {
    closeAllModals();
    $all(".view").forEach(v => v.classList.toggle("active", v.id === "view-" + view));
    $all(".nav-btn").forEach(b => b.classList.toggle("active", b.getAttribute("data-nav") === view));
    moveNavPill(view);
    if (view === "send") prepSend();
    if (view === "receive") renderReceive();
    if (view === "history") renderHistory();
    if (view === "chart") renderChart();
    if (view === "dashboard") renderDashboard();
    if (view === "buy") renderBuy();
    if (view === "swap") renderSwap();
    if (view === "contacts") renderContacts();
    if (view === "copilot") renderCopilot();
    if (view === "insights") renderInsights();
    if (view === "alerts") renderAlerts();
    if (view === "earn") renderEarn();
    if (view === "recovery") renderRecovery();
    // scroll the active view to top
    const active = $("#view-" + view);
    if (active && active.scrollTop) active.scrollTop = 0;
  }

  function moveNavPill(view) {
    const pill = $("#nav-pill");
    const btn = NAV_VIEWS.indexOf(view) >= 0
      ? document.querySelector('.nav-btn[data-nav="' + view + '"]') : null;
    if (!pill) return;
    if (!btn) { pill.style.opacity = "0"; return; }
    pill.style.opacity = "0.9";
    pill.style.width = btn.offsetWidth + "px";
    pill.style.transform = "translateX(" + btn.offsetLeft + "px)";
  }

  function initNav() {
    $all("[data-nav]").forEach(b =>
      b.addEventListener("click", () => navigate(b.getAttribute("data-nav")))
    );
    $("#btn-lock").addEventListener("click", lockWallet);
    $("#btn-top-copilot").addEventListener("click", () => navigate("copilot"));
    $("#top-addr").addEventListener("click", () => copy(WALLET_ADDRESS));
    // more sheet
    $("#btn-more").addEventListener("click", () => $("#more-sheet").classList.remove("hidden"));
    $("#more-sheet").addEventListener("click", e => { if (e.target.id === "more-sheet") $("#more-sheet").classList.add("hidden"); });
    $("#btn-more-lock").addEventListener("click", lockWallet);
    $all("#more-sheet [data-nav]").forEach(b =>
      b.addEventListener("click", () => { $("#more-sheet").classList.add("hidden"); })
    );
  }

  function closeAllModals() {
    ["#modal-confirm", "#more-sheet", "#contact-picker"].forEach(id => {
      const el = $(id); if (el) el.classList.add("hidden");
    });
  }

  // ====================================================================
  //  DASHBOARD
  // ====================================================================
  function renderDashboard() {
    const total = totalUsd();
    animateUsd($("#total-balance"), total);

    let wsum = 0, vsum = 0;
    TOKENS.forEach(t => { const v = (t.balance + t.staked) * t.price; wsum += v * t.change; vsum += v; });
    const pChange = vsum ? wsum / vsum : 0;
    const chip = $("#balance-change");
    const up = pChange >= 0;
    chip.className = "chip " + (up ? "chip-up" : "chip-down");
    chip.textContent = (up ? "▲ " : "▼ ") + Math.abs(pChange).toFixed(2) + "%";
    $("#balance-sub").textContent = (up ? "+" : "−") + fmtUsd(Math.abs(total * pChange / 100)) + " today";

    const N = 32;
    const portfolio = new Array(N).fill(0);
    TOKENS.forEach((t, idx) => {
      const v = (t.balance + t.staked) * t.price;
      const s = buildSeries(idx + 3, t.change, N);
      const base = s[0];
      for (let i = 0; i < N; i++) portfolio[i] += (s[i] / base) * v;
    });
    $("#hero-spark").innerHTML = sparkSVG(portfolio, {
      w: 320, h: 56, sw: 2.5, color: up ? "var(--up)" : "var(--down)"
    });

    // P&L strip
    const pnl = computePnl();
    setPnlEl($("#pnl-total"), pnl.total);
    setPnlEl($("#pnl-24h"), pnl.day);

    const sorted = TOKENS.slice().sort((a, b) => ((b.balance + b.staked) * b.price) - ((a.balance + a.staked) * a.price));
    $("#asset-count").textContent = sorted.length + " assets";

    const list = $("#token-list");
    list.innerHTML = "";
    sorted.forEach((t, i) => {
      const cu = t.change >= 0;
      const series = buildSeries(TOKENS.indexOf(t) + 3, t.change, 28);
      const li = document.createElement("li");
      li.className = "token";
      li.style.animationDelay = (i * 0.05) + "s";
      li.tabIndex = 0;
      li.setAttribute("role", "button");
      li.title = "View " + t.name + " chart";
      li.addEventListener("click", () => openChart(t.sym));
      li.addEventListener("keydown", e => {
        if (e.key === "Enter" || e.key === " ") { e.preventDefault(); openChart(t.sym); }
      });
      li.innerHTML =
        '<div class="token-ico" style="background:linear-gradient(135deg,' + t.grad[0] + ',' + t.grad[1] + ')">' + t.sym.slice(0, 2) + '</div>' +
        '<div class="token-meta">' +
          '<div class="token-name">' + t.name + '</div>' +
          '<div class="token-sub">' + fmtUsd(t.price) + '</div>' +
        '</div>' +
        '<div class="token-spark">' + sparkSVG(series, { w: 90, h: 34, color: cu ? "var(--up)" : "var(--down)" }) + '</div>' +
        '<div class="token-vals">' +
          '<div class="token-fiat">' + fmtUsd((t.balance + t.staked) * t.price) + '</div>' +
          '<div class="token-amt">' + fmtAmt(t.balance + t.staked) + ' ' + t.sym + '</div>' +
          '<div class="token-chg ' + (cu ? "up" : "down") + '">' + (cu ? "+" : "") + t.change.toFixed(1) + '%</div>' +
        '</div>';
      list.appendChild(li);
    });
  }

  function setPnlEl(el, val) {
    el.textContent = fmtSigned(val);
    el.className = "pnl-v " + (val >= 0 ? "pos" : "neg");
  }

  function computePnl() {
    let value = 0, cost = 0, day = 0;
    TOKENS.forEach(t => {
      const held = t.balance + t.staked;
      const v = held * t.price;
      value += v;
      cost += held * t.cost;
      const prev = v / (1 + t.change / 100);
      day += v - prev;
    });
    return { total: value - cost, totalPct: cost ? (value - cost) / cost * 100 : 0, day: day, dayPct: value ? day / value * 100 : 0, value: value, cost: cost };
  }

  // ====================================================================
  //  SCAM SHIELD  (risk engine + recipient resolution)
  // ====================================================================
  function isFlagged(address) {
    return address && BLOCKLIST[String(address).toLowerCase()] || null;
  }

  // Resolve a recipient string → {ok, address, kind, label, contact, flagReasons}
  function resolveRecipient(raw) {
    const input = (raw || "").trim();
    if (!input) return { ok: false, empty: true };
    const lower = input.toLowerCase();

    // saved contact by name / username / address?
    const contact = CONTACTS.find(c =>
      c.username.toLowerCase() === lower ||
      c.name.toLowerCase() === lower ||
      c.address.toLowerCase() === lower);
    if (contact) {
      return { ok: true, address: contact.address, kind: "contact", label: contact.name + " · " + contact.username, contact: contact, flagReasons: isFlagged(contact.address) };
    }
    // username registry
    if (REGISTRY[lower]) {
      const addr = REGISTRY[lower];
      return { ok: true, address: addr, kind: "username", label: lower, flagReasons: isFlagged(addr) };
    }
    // bare username pattern but unknown
    if (/^[a-z0-9-]+\.lumen$/i.test(input)) {
      return { ok: false, unknownName: true, label: input };
    }
    // raw address (0x… / bc1… / base58)
    if (/^(0x[0-9a-fA-F]{6,}|bc1[a-z0-9]{6,}|[1-9A-HJ-NP-Za-km-z]{8,})$/.test(input)) {
      return { ok: true, address: input, kind: "address", label: shortAddr(input), flagReasons: isFlagged(input) };
    }
    return { ok: false, invalid: true };
  }

  // Build a risk verdict for a send. amountUsd used for "large transfer" caution.
  function assessRisk(resolved, amountUsd) {
    if (resolved && resolved.flagReasons) {
      return {
        level: "danger",
        title: "Danger — known malicious address",
        sub: "This recipient is on Lumen's threat list",
        reasons: resolved.flagReasons.map(r => ({ kind: "bad", text: r }))
      };
    }
    const reasons = [];
    let level = "safe";
    if (resolved && resolved.kind === "contact") {
      reasons.push({ kind: "good", text: "Saved contact — you've trusted this address before" });
    } else if (resolved && resolved.kind === "username") {
      reasons.push({ kind: "good", text: "Verified Lumen username · resolves to " + shortAddr(resolved.address) });
    } else {
      reasons.push({ kind: "good", text: "Address is not on any known scam or drainer blocklist" });
    }
    reasons.push({ kind: "good", text: "No malicious token approvals requested" });
    if (amountUsd > 5000) {
      level = "caution";
      reasons.push({ kind: "warn", text: "Large transfer (" + fmtUsd(amountUsd) + ") — double-check the recipient" });
    } else {
      reasons.push({ kind: "good", text: "Standard wallet transfer · simulated successfully" });
    }
    return {
      level: level,
      title: level === "caution" ? "Proceed with caution" : "Verified safe",
      sub: level === "caution" ? "No threats found, but review the amount" : "Simulation passed all security checks",
      reasons: reasons
    };
  }

  // ====================================================================
  //  SEND
  // ====================================================================
  function prepSend() {
    const sel = $("#send-token");
    const current = sel.value;
    sel.innerHTML = "";
    TOKENS.forEach(t => {
      const o = document.createElement("option");
      o.value = t.sym;
      o.textContent = t.sym + " — " + t.name;
      sel.appendChild(o);
    });
    if (current) sel.value = current;
    $("#send-error").textContent = "";
    updateSendMeta();
    updateResolveHint();
  }

  function updateSendMeta() {
    const t = token($("#send-token").value);
    if (!t) return;
    $("#send-avail").textContent = "Available: " + fmtAmt(t.balance) + " " + t.sym +
      " (" + fmtUsd(t.balance * t.price) + ")";
    const amt = parseFloat($("#send-amount").value) || 0;
    $("#send-fiat").textContent = "≈ " + fmtUsd(amt * t.price);
  }

  function updateResolveHint() {
    const hint = $("#resolve-hint");
    const r = resolveRecipient($("#send-address").value);
    hint.className = "resolve-hint";
    if (r.empty) { hint.innerHTML = ""; return; }
    if (r.unknownName) { hint.classList.add("caution"); hint.innerHTML = svgIco("warn") + "No wallet registered for " + escapeHtml(r.label); return; }
    if (r.invalid) { hint.classList.add("caution"); hint.innerHTML = svgIco("warn") + "Doesn't look like a valid address or username"; return; }
    if (r.flagReasons) { hint.classList.add("danger"); hint.innerHTML = svgIco("danger") + "<b>Flagged drainer address</b> — Scam Shield will block this"; return; }
    hint.classList.add("ok");
    if (r.kind === "contact") hint.innerHTML = svgIco("ok") + escapeHtml(r.label);
    else if (r.kind === "username") hint.innerHTML = svgIco("ok") + escapeHtml(r.label) + " → <code>" + shortAddr(r.address) + "</code>";
    else hint.innerHTML = svgIco("ok") + "Valid address · <code>" + shortAddr(r.address) + "</code>";
  }

  function svgIco(kind) {
    if (kind === "ok") return '<svg class="rs-ico" viewBox="0 0 24 24" fill="none"><path d="M20 6 9 17l-5-5" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"/></svg>';
    if (kind === "danger" || kind === "bad") return '<svg class="rs-ico" viewBox="0 0 24 24" fill="none"><path d="M12 8v5" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"/><circle cx="12" cy="16.5" r="1.2" fill="currentColor"/><path d="M10.3 3.8 2.5 17.5A2 2 0 0 0 4.2 20.5h15.6a2 2 0 0 0 1.7-3L13.7 3.8a2 2 0 0 0-3.4 0Z" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round"/></svg>';
    if (kind === "warn") return '<svg class="rs-ico" viewBox="0 0 24 24" fill="none"><path d="M12 8v5" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"/><circle cx="12" cy="16.5" r="1.2" fill="currentColor"/><circle cx="12" cy="12" r="9" stroke="currentColor" stroke-width="1.8"/></svg>';
    return '<svg class="rs-ico" viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="9" stroke="currentColor" stroke-width="1.8"/><path d="M12 11v5" stroke="currentColor" stroke-width="2" stroke-linecap="round"/><circle cx="12" cy="7.8" r="1.1" fill="currentColor"/></svg>';
  }

  function initSend() {
    $("#send-token").addEventListener("change", updateSendMeta);
    $("#send-amount").addEventListener("input", updateSendMeta);
    $("#send-address").addEventListener("input", updateResolveHint);
    $("#btn-max").addEventListener("click", () => {
      const t = token($("#send-token").value);
      if (t) { $("#send-amount").value = fmtAmt(t.balance); updateSendMeta(); }
    });
    $("#btn-pick-contact").addEventListener("click", openPicker);

    $("#send-form").addEventListener("submit", e => {
      e.preventDefault();
      const err = $("#send-error");
      err.textContent = "";
      const t = token($("#send-token").value);
      const r = resolveRecipient($("#send-address").value);
      const amt = parseFloat($("#send-amount").value);

      if (!r.ok) {
        err.textContent = r.unknownName ? "No wallet found for that username."
          : "Enter a valid address, username, or contact.";
        return;
      }
      if (!amt || amt <= 0) { err.textContent = "Enter an amount greater than 0."; return; }
      if (amt > t.balance) { err.textContent = "Insufficient " + t.sym + " balance."; return; }

      openReview({ type: "send", t: t, amt: amt, resolved: r });
    });
  }

  // ====================================================================
  //  REVIEW MODAL  (Scam Shield-powered, unified for send/swap/buy/stake)
  // ====================================================================
  let pendingTx = null;

  function openReview(tx) {
    pendingTx = tx;
    const verdictEl = $("#shield-verdict");
    const simEl = $("#sim-flow");
    const rowsEl = $("#confirm-rows");
    const reasonsEl = $("#shield-reasons");
    const confirmBtn = $("#btn-confirm-send");
    confirmBtn.classList.remove("btn-danger");

    let risk, sim, rows, confirmLabel;

    if (tx.type === "send") {
      const fee = 0.0008 * tx.t.price;
      risk = assessRisk(tx.resolved, tx.amt * tx.t.price);
      tx.fee = fee;
      sim = simLegs(
        { k: "You send", v: fmtAmt(tx.amt) + " " + tx.t.sym, fiat: fmtUsd(tx.amt * tx.t.price), cls: "out" },
        { k: "They receive", v: "≈ " + fmtAmt(tx.amt) + " " + tx.t.sym, fiat: fmtUsd(tx.amt * tx.t.price), cls: "in" }
      );
      rows = row("Asset", tx.t.name + " (" + tx.t.sym + ")") +
             row("To", tx.resolved.kind === "address" ? shortAddr(tx.resolved.address) : tx.resolved.label) +
             row("Network fee", "≈ " + fmtUsd(fee)) +
             totalRow(fmtUsd(tx.amt * tx.t.price + fee));
      confirmLabel = "Confirm & Send";
    } else if (tx.type === "swap") {
      risk = { level: "safe", title: "Verified safe", sub: "Best route found · audited liquidity pool",
        reasons: [
          { kind: "good", text: "Routed through an audited DEX aggregator" },
          { kind: "good", text: "Price impact " + tx.impact.toFixed(2) + "% · within slippage " + slippage + "%" },
          { kind: "good", text: "Both tokens are verified contracts" }
        ] };
      sim = simLegs(
        { k: "You pay", v: fmtAmt(tx.fromAmt) + " " + tx.from.sym, fiat: fmtUsd(tx.fromAmt * tx.from.price), cls: "out" },
        { k: "You receive", v: "≈ " + fmtAmt(tx.toAmt) + " " + tx.to.sym, fiat: fmtUsd(tx.toAmt * tx.to.price), cls: "in" }
      );
      rows = row("Rate", "1 " + tx.from.sym + " ≈ " + fmtAmt(tx.to.price ? tx.from.price / tx.to.price : 0) + " " + tx.to.sym) +
             row("Slippage", slippage + "%") +
             row("Network fee", "≈ " + fmtUsd(tx.fee)) +
             totalRow("≈ " + fmtAmt(tx.toAmt) + " " + tx.to.sym);
      confirmLabel = "Confirm swap";
    } else if (tx.type === "buy") {
      risk = { level: "safe", title: "Verified safe", sub: "Licensed on-ramp · funds secured",
        reasons: [
          { kind: "good", text: "Processed by a licensed payment provider" },
          { kind: "good", text: "3-D Secure card verification" },
          { kind: "info", text: "Tokens delivered to your self-custody wallet" }
        ] };
      sim = simLegs(
        { k: "You pay", v: fmtUsd(tx.fiat), fiat: tx.method === "apple" ? "Apple Pay" : "Card ••42", cls: "out" },
        { k: "You receive", v: "≈ " + fmtAmt(tx.tokenAmt) + " " + tx.t.sym, fiat: fmtUsd(tx.tokenAmt * tx.t.price), cls: "in" }
      );
      rows = row("Rate", "1 " + tx.t.sym + " = " + fmtUsd(tx.t.price)) +
             row("Provider fee", fmtUsd(tx.fee)) +
             totalRow(fmtUsd(tx.fiat));
      confirmLabel = "Confirm purchase";
    } else { // stake
      const yearly = tx.amt * tx.t.price * tx.t.apy / 100;
      risk = { level: "safe", title: "Verified safe", sub: "Non-custodial staking · unstake anytime",
        reasons: [
          { kind: "good", text: "Audited staking contract · you keep custody" },
          { kind: "good", text: "Liquid staking — unstake whenever you want" },
          { kind: "info", text: "Rewards accrue continuously at " + tx.t.apy + "% APY" }
        ] };
      sim = simLegs(
        { k: "You stake", v: fmtAmt(tx.amt) + " " + tx.t.sym, fiat: fmtUsd(tx.amt * tx.t.price), cls: "out" },
        { k: "Est. yearly yield", v: "+" + fmtAmt(tx.amt * tx.t.apy / 100) + " " + tx.t.sym, fiat: "≈ " + fmtUsd(yearly), cls: "in" }
      );
      rows = row("Asset", tx.t.name + " (" + tx.t.sym + ")") +
             row("APY", tx.t.apy + "%") +
             totalRow(fmtAmt(tx.amt) + " " + tx.t.sym);
      confirmLabel = "Confirm stake";
    }

    // verdict block
    verdictEl.className = "shield-verdict " + risk.level;
    verdictEl.innerHTML =
      '<span class="sv-ico">' + verdictIcon(risk.level) + '</span>' +
      '<div><div class="sv-title">' + risk.title + '</div><div class="sv-sub">' + risk.sub + '</div></div>';

    simEl.innerHTML = sim;
    rowsEl.innerHTML = rows;
    reasonsEl.innerHTML = risk.reasons.map(r =>
      '<li class="' + r.kind + '">' + svgIco(r.kind === "good" ? "ok" : r.kind === "bad" ? "bad" : r.kind === "warn" ? "warn" : "info") + '<span>' + escapeHtml(r.text) + '</span></li>'
    ).join("");

    if (risk.level === "danger") {
      confirmBtn.classList.add("btn-danger");
      confirmBtn.textContent = "Send anyway — I accept the risk";
    } else {
      confirmBtn.textContent = confirmLabel;
    }

    $("#modal-confirm").classList.remove("hidden");
  }

  function verdictIcon(level) {
    if (level === "danger") return '<svg viewBox="0 0 24 24" fill="none"><path d="M10.3 3.8 2.5 17.5A2 2 0 0 0 4.2 20.5h15.6a2 2 0 0 0 1.7-3L13.7 3.8a2 2 0 0 0-3.4 0Z" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round"/><path d="M12 8.5v5" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"/><circle cx="12" cy="16.8" r="1.2" fill="currentColor"/></svg>';
    if (level === "caution") return '<svg viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="9" stroke="currentColor" stroke-width="1.8"/><path d="M12 7.5v5.5" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"/><circle cx="12" cy="16.5" r="1.2" fill="currentColor"/></svg>';
    return '<svg viewBox="0 0 24 24" fill="none"><path d="M12 3l7 3v5c0 4.4-3 8-7 10-4-2-7-5.6-7-10V6l7-3Z" stroke="currentColor" stroke-width="1.5" stroke-linejoin="round"/><path d="m9 12 2 2 4-4" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>';
  }
  function simLegs(a, b) {
    return leg(a) +
      '<div class="sim-arrow"><svg viewBox="0 0 24 24" fill="none"><path d="M5 12h13M12 5l7 7-7 7" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/></svg></div>' +
      leg(b);
    function leg(x) {
      return '<div class="sim-leg ' + x.cls + '"><div class="sim-k">' + x.k + '</div><div class="sim-v">' + x.v + '</div><div class="sim-fiat">' + x.fiat + '</div></div>';
    }
  }
  function row(k, v) { return '<div class="confirm-row"><span class="k">' + k + '</span><span class="v">' + v + '</span></div>'; }
  function totalRow(v) { return '<div class="confirm-row total"><span class="k">Total</span><span class="v">' + v + '</span></div>'; }

  function closeConfirm() { $("#modal-confirm").classList.add("hidden"); pendingTx = null; }

  function initConfirm() {
    $("#btn-confirm-cancel").addEventListener("click", closeConfirm);
    $("#modal-confirm").addEventListener("click", e => { if (e.target.id === "modal-confirm") closeConfirm(); });
    $("#btn-confirm-send").addEventListener("click", () => {
      if (!pendingTx) return;
      const tx = pendingTx;
      if (tx.type === "send") {
        tx.t.balance = Math.max(0, tx.t.balance - tx.amt);
        HISTORY.unshift({ dir: "out", sym: tx.t.sym, amount: tx.amt, address: tx.resolved.kind === "address" ? shortAddr(tx.resolved.address) : tx.resolved.label, ts: Date.now() });
        closeConfirm(); renderDashboard();
        toast("Sent " + fmtAmt(tx.amt) + " " + tx.t.sym);
        navigate("history");
      } else if (tx.type === "swap") {
        tx.from.balance = Math.max(0, tx.from.balance - tx.fromAmt);
        tx.to.balance += tx.toAmt;
        HISTORY.unshift({ dir: "out", sym: tx.from.sym, amount: tx.fromAmt, address: "Swap → " + tx.to.sym, ts: Date.now() });
        HISTORY.unshift({ dir: "in", sym: tx.to.sym, amount: tx.toAmt, address: "Swap ← " + tx.from.sym, ts: Date.now() });
        closeConfirm(); renderDashboard();
        toast("Swapped to " + fmtAmt(tx.toAmt) + " " + tx.to.sym);
        navigate("dashboard");
      } else if (tx.type === "buy") {
        tx.t.balance += tx.tokenAmt;
        HISTORY.unshift({ dir: "in", sym: tx.t.sym, amount: tx.tokenAmt, address: "Bought · " + (tx.method === "apple" ? "Apple Pay" : "Card"), ts: Date.now() });
        closeConfirm(); renderDashboard();
        toast("Bought " + fmtAmt(tx.tokenAmt) + " " + tx.t.sym);
        navigate("dashboard");
      } else if (tx.type === "stake") {
        tx.t.balance = Math.max(0, tx.t.balance - tx.amt);
        tx.t.staked += tx.amt;
        HISTORY.unshift({ dir: "out", sym: tx.t.sym, amount: tx.amt, address: "Staked · " + tx.t.apy + "% APY", ts: Date.now() });
        closeConfirm(); renderEarn(); renderDashboard();
        toast("Staked " + fmtAmt(tx.amt) + " " + tx.t.sym);
      }
    });
  }

  // ====================================================================
  //  CONTACT PICKER
  // ====================================================================
  function openPicker() {
    const list = $("#picker-list");
    list.innerHTML = "";
    CONTACTS.forEach(c => {
      const li = document.createElement("li");
      li.className = "contact";
      const flagged = isFlagged(c.address);
      li.innerHTML =
        '<div class="contact-avatar" style="background:' + colorFor(c.name) + '">' + escapeHtml(initials(c.name)) + '</div>' +
        '<div class="contact-meta"><div class="contact-name">' + escapeHtml(c.name) + '</div>' +
        '<div class="contact-handle">' + escapeHtml(c.username) + '</div></div>' +
        (flagged ? '<span class="contact-flag">' + svgIco("danger") + 'Flagged</span>' : '');
      li.addEventListener("click", () => {
        $("#send-address").value = c.username;
        updateResolveHint();
        $("#contact-picker").classList.add("hidden");
      });
      list.appendChild(li);
    });
    $("#contact-picker").classList.remove("hidden");
  }
  function initPicker() {
    $("#btn-picker-close").addEventListener("click", () => $("#contact-picker").classList.add("hidden"));
    $("#contact-picker").addEventListener("click", e => { if (e.target.id === "contact-picker") $("#contact-picker").classList.add("hidden"); });
  }

  // ====================================================================
  //  CONTACTS SCREEN
  // ====================================================================
  function renderContacts() {
    const list = $("#contacts-list");
    list.innerHTML = "";
    if (!CONTACTS.length) { list.innerHTML = '<li class="empty">No contacts yet.</li>'; return; }
    CONTACTS.forEach((c, i) => {
      const flagged = isFlagged(c.address);
      const li = document.createElement("li");
      li.className = "contact";
      li.style.animationDelay = (i * 0.05) + "s";
      li.innerHTML =
        '<div class="contact-avatar" style="background:' + colorFor(c.name) + '">' + escapeHtml(initials(c.name)) + '</div>' +
        '<div class="contact-meta"><div class="contact-name">' + escapeHtml(c.name) + '</div>' +
        '<div class="contact-handle">' + escapeHtml(c.username) + '</div>' +
        '<div class="contact-addr">' + shortAddr(c.address) + '</div>' +
        (flagged ? '<div class="contact-flag">' + svgIco("danger") + 'Flagged by Scam Shield</div>' : '') + '</div>' +
        '<button class="contact-send" title="Send to ' + escapeHtml(c.name) + '"><svg viewBox="0 0 24 24" fill="none"><path d="M7 17 17 7M9 7h8v8" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg></button>';
      li.querySelector(".contact-send").addEventListener("click", e => {
        e.stopPropagation();
        prefillSend(null, null, c.username);
        navigate("send");
      });
      li.addEventListener("click", () => { prefillSend(null, null, c.username); navigate("send"); });
      list.appendChild(li);
    });
  }
  function initContacts() {
    $("#btn-add-contact").addEventListener("click", () => {
      const name = $("#contact-name").value.trim();
      const handle = $("#contact-handle").value.trim();
      if (!name || !handle) { toast("Enter a name and address/username"); return; }
      let address = handle, username = "";
      const r = resolveRecipient(handle);
      if (r.ok) { address = r.address; username = r.kind === "username" ? handle.toLowerCase() : (r.contact ? r.contact.username : ""); }
      if (!username) username = name.toLowerCase().split(/\s+/)[0] + ".lumen";
      CONTACTS.push({ name: name, username: username, address: address });
      $("#contact-name").value = ""; $("#contact-handle").value = "";
      renderContacts();
      toast("Contact added");
    });
  }

  // ====================================================================
  //  RECEIVE
  // ====================================================================
  let qrInstance = null;
  function renderReceive() {
    $("#receive-username").textContent = WALLET_USERNAME;
    $("#receive-addr").textContent = WALLET_ADDRESS;
    const box = $("#qrcode");
    box.innerHTML = "";
    if (typeof QRCode !== "undefined") {
      qrInstance = new QRCode(box, {
        text: WALLET_ADDRESS, width: 168, height: 168,
        colorDark: "#0a0a14", colorLight: "#ffffff", correctLevel: QRCode.CorrectLevel.M
      });
    } else {
      box.innerHTML = '<div style="color:#333;font-size:12px;text-align:center;padding:10px">QR library offline.<br>Address shown below.</div>';
    }
  }
  function initReceive() { $("#btn-copy-addr").addEventListener("click", () => copy(WALLET_ADDRESS)); }

  // ====================================================================
  //  BUY
  // ====================================================================
  function renderBuy() {
    const sel = $("#buy-token");
    if (!sel.options.length) {
      TOKENS.filter(t => !t.stable).concat(TOKENS.filter(t => t.stable)).forEach(t => {
        const o = document.createElement("option"); o.value = t.sym; o.textContent = t.sym + " — " + t.name; sel.appendChild(o);
      });
    }
    updateBuyQuote();
  }
  function updateBuyQuote() {
    const t = token($("#buy-token").value) || TOKENS[0];
    const fiat = parseFloat($("#buy-fiat").value) || 0;
    const feeRate = buyMethod === "apple" ? 0.009 : 0.012;
    const fee = fiat * feeRate;
    const net = Math.max(0, fiat - fee);
    const tokenAmt = t.price ? net / t.price : 0;
    $("#buy-quote").innerHTML =
      '<div class="quote-row"><span class="qk">Rate</span><span class="qv">1 ' + t.sym + ' = ' + fmtUsd(t.price) + '</span></div>' +
      '<div class="quote-row"><span class="qk">' + (buyMethod === "apple" ? "Apple Pay" : "Card") + ' fee</span><span class="qv">' + fmtUsd(fee) + '</span></div>' +
      '<div class="quote-row big"><span class="qk">You receive</span><span class="qv">≈ ' + fmtAmt(tokenAmt) + ' ' + t.sym + '</span></div>';
    // sync active preset
    $all("#buy-presets .preset").forEach(p => p.classList.toggle("active", parseFloat(p.getAttribute("data-amt")) === fiat));
    return { t: t, fiat: fiat, fee: fee, tokenAmt: tokenAmt };
  }
  function initBuy() {
    $("#buy-fiat").addEventListener("input", updateBuyQuote);
    $("#buy-token").addEventListener("change", updateBuyQuote);
    $all("#buy-presets .preset").forEach(p => p.addEventListener("click", () => {
      $("#buy-fiat").value = p.getAttribute("data-amt"); updateBuyQuote();
    }));
    $all("#buy-methods .pay-method").forEach(m => m.addEventListener("click", () => {
      buyMethod = m.getAttribute("data-method");
      $all("#buy-methods .pay-method").forEach(x => x.classList.toggle("active", x === m));
      updateBuyQuote();
    }));
    $("#btn-buy").addEventListener("click", () => {
      const q = updateBuyQuote();
      if (!q.fiat || q.fiat <= 0) { toast("Enter an amount"); return; }
      openReview({ type: "buy", t: q.t, fiat: q.fiat, fee: q.fee, tokenAmt: q.tokenAmt, method: buyMethod });
    });
  }

  // ====================================================================
  //  SWAP
  // ====================================================================
  function renderSwap() {
    const from = $("#swap-from-token"), to = $("#swap-to-token");
    if (!from.options.length) {
      TOKENS.forEach(t => {
        from.appendChild(opt(t)); to.appendChild(opt(t));
      });
      from.value = "ETH"; to.value = "USDC";
    }
    updateSwapQuote();
    function opt(t) { const o = document.createElement("option"); o.value = t.sym; o.textContent = t.sym; return o; }
  }
  function updateSwapQuote() {
    const from = token($("#swap-from-token").value) || TOKENS[0];
    const to = token($("#swap-to-token").value) || TOKENS[1];
    $("#swap-from-bal").textContent = "Balance " + fmtAmt(from.balance) + " " + from.sym;
    $("#swap-to-bal").textContent = "Balance " + fmtAmt(to.balance) + " " + to.sym;
    const fromAmt = parseFloat($("#swap-from-amt").value) || 0;
    const rate = to.price ? from.price / to.price : 0;
    const gross = fromAmt * rate;
    const impact = fromAmt > 0 ? Math.min(0.8, (fromAmt * from.price) / 250000) : 0; // mock price impact %
    const toAmt = gross * (1 - impact / 100);
    $("#swap-to-amt").value = fromAmt > 0 ? fmtAmt(toAmt) : "";
    $("#swap-from-fiat").textContent = "≈ " + fmtUsd(fromAmt * from.price);
    $("#swap-to-fiat").textContent = "≈ " + fmtUsd(toAmt * to.price);
    $("#swap-rate").textContent = "1 " + from.sym + " ≈ " + fmtAmt(rate) + " " + to.sym;
    $("#swap-receive-line").innerHTML = "<span>You receive (min)</span><b>" + (fromAmt > 0 ? fmtAmt(toAmt * (1 - slippage / 100)) + " " + to.sym : "—") + "</b>";
    return { from: from, to: to, fromAmt: fromAmt, toAmt: toAmt, impact: impact, fee: fromAmt * from.price * 0.003 };
  }
  function initSwap() {
    $("#swap-from-amt").addEventListener("input", updateSwapQuote);
    $("#swap-from-token").addEventListener("change", () => { ensureDistinct("from"); updateSwapQuote(); });
    $("#swap-to-token").addEventListener("change", () => { ensureDistinct("to"); updateSwapQuote(); });
    $("#btn-swap-flip").addEventListener("click", () => {
      const f = $("#swap-from-token").value, t = $("#swap-to-token").value;
      $("#swap-from-token").value = t; $("#swap-to-token").value = f;
      $("#swap-from-amt").value = ""; updateSwapQuote();
    });
    $all("#slip-chips .slip").forEach(s => s.addEventListener("click", () => {
      slippage = parseFloat(s.getAttribute("data-slip"));
      $all("#slip-chips .slip").forEach(x => x.classList.toggle("active", x === s));
      updateSwapQuote();
    }));
    $("#btn-swap-review").addEventListener("click", () => {
      const q = updateSwapQuote();
      const err = $("#swap-error"); err.textContent = "";
      if (q.from.sym === q.to.sym) { err.textContent = "Choose two different tokens."; return; }
      if (!q.fromAmt || q.fromAmt <= 0) { err.textContent = "Enter an amount to swap."; return; }
      if (q.fromAmt > q.from.balance) { err.textContent = "Insufficient " + q.from.sym + " balance."; return; }
      openReview({ type: "swap", from: q.from, to: q.to, fromAmt: q.fromAmt, toAmt: q.toAmt, impact: q.impact, fee: q.fee });
    });
    function ensureDistinct(changed) {
      const f = $("#swap-from-token"), t = $("#swap-to-token");
      if (f.value === t.value) {
        const alt = TOKENS.find(x => x.sym !== f.value);
        if (changed === "from") t.value = alt.sym; else f.value = alt.sym;
      }
    }
  }

  // ====================================================================
  //  INSIGHTS / PORTFOLIO P&L
  // ====================================================================
  function renderInsights() {
    const pnl = computePnl();
    const total = pnl.value;
    // donut
    const sorted = TOKENS.slice().sort((a, b) => ((b.balance + b.staked) * b.price) - ((a.balance + a.staked) * a.price));
    let acc = 0, stops = [];
    const legend = [];
    sorted.forEach(t => {
      const v = (t.balance + t.staked) * t.price;
      const pct = total ? v / total * 100 : 0;
      const start = acc, end = acc + pct;
      stops.push(t.grad[0] + " " + start.toFixed(2) + "% " + end.toFixed(2) + "%");
      acc = end;
      legend.push({ sym: t.sym, color: t.grad[0], pct: pct });
    });
    $("#alloc-donut").style.background = "conic-gradient(" + stops.join(",") + ")";
    $("#alloc-donut").style.webkitMask = "radial-gradient(circle, transparent 54%, #000 55%)";
    $("#alloc-donut").style.mask = "radial-gradient(circle, transparent 54%, #000 55%)";
    $("#alloc-total").textContent = fmtUsd0(total);
    $("#alloc-legend").innerHTML = legend.map(l =>
      '<li><span class="alloc-dot" style="background:' + l.color + '"></span><span class="alloc-sym">' + l.sym + '</span><span class="alloc-pct">' + l.pct.toFixed(1) + '%</span></li>'
    ).join("");

    setPnlEl($("#ins-pnl-total"), pnl.total); $("#ins-pnl-total").classList.add("big");
    setPnlEl($("#ins-pnl-24h"), pnl.day); $("#ins-pnl-24h").classList.add("big");
    const tp = $("#ins-pnl-total-pct"); tp.textContent = (pnl.totalPct >= 0 ? "+" : "") + pnl.totalPct.toFixed(2) + "% all time"; tp.className = "pnl-pct " + (pnl.totalPct >= 0 ? "pos" : "neg");
    const dp = $("#ins-pnl-24h-pct"); dp.textContent = (pnl.dayPct >= 0 ? "+" : "") + pnl.dayPct.toFixed(2) + "% today"; dp.className = "pnl-pct " + (pnl.dayPct >= 0 ? "pos" : "neg");

    const list = $("#insights-list");
    list.innerHTML = "";
    sorted.forEach((t, i) => {
      const held = t.balance + t.staked;
      const value = held * t.price;
      const p = (t.price - t.cost) * held;
      const pPct = t.cost ? (t.price - t.cost) / t.cost * 100 : 0;
      const li = document.createElement("li");
      li.className = "ins-row"; li.style.animationDelay = (i * 0.05) + "s";
      li.innerHTML =
        '<div class="token-ico" style="background:linear-gradient(135deg,' + t.grad[0] + ',' + t.grad[1] + ')">' + t.sym.slice(0, 2) + '</div>' +
        '<div class="ins-meta"><div class="ins-name">' + t.name + '</div>' +
        '<div class="ins-basis">' + fmtAmt(held) + ' ' + t.sym + ' · avg ' + fmtUsd(t.cost) + '</div></div>' +
        '<div class="ins-vals"><div class="ins-value">' + fmtUsd(value) + '</div>' +
        '<div class="ins-pnl ' + (p >= 0 ? "pos" : "neg") + '">' + fmtSigned(p) + ' (' + (pPct >= 0 ? "+" : "") + pPct.toFixed(1) + '%)</div></div>';
      list.appendChild(li);
    });
  }
  function initInsights() {
    $("#btn-export").addEventListener("click", exportCsv);
  }
  function exportCsv() {
    const rows = [["Asset", "Symbol", "Balance", "Staked", "Avg cost (USD)", "Price (USD)", "Value (USD)", "Unrealized P&L (USD)"]];
    TOKENS.forEach(t => {
      const held = t.balance + t.staked;
      rows.push([t.name, t.sym, fmtAmt(t.balance), fmtAmt(t.staked), t.cost.toFixed(2), t.price.toFixed(2), (held * t.price).toFixed(2), ((t.price - t.cost) * held).toFixed(2)]);
    });
    const csv = rows.map(r => r.map(c => '"' + String(c).replace(/"/g, '""') + '"').join(",")).join("\n");
    try {
      const blob = new Blob([csv], { type: "text/csv" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url; a.download = "lumen-portfolio-tax-report.csv";
      document.body.appendChild(a); a.click(); document.body.removeChild(a);
      setTimeout(() => URL.revokeObjectURL(url), 1000);
      toast("Tax report exported (CSV)");
    } catch (e) { toast("Export ready (demo)"); }
  }

  // ====================================================================
  //  PRICE ALERTS
  // ====================================================================
  function renderAlerts() {
    const sel = $("#alert-token");
    if (!sel.options.length) {
      TOKENS.forEach(t => { const o = document.createElement("option"); o.value = t.sym; o.textContent = t.sym; sel.appendChild(o); });
    }
    const list = $("#alerts-list");
    list.innerHTML = "";
    if (!ALERTS.length) { list.innerHTML = '<li class="empty">No alerts yet.</li>'; return; }
    ALERTS.forEach((a, i) => {
      const t = token(a.sym);
      const armed = a.dir === "above" ? t.price >= a.price : t.price <= a.price;
      const li = document.createElement("li");
      li.className = "alert-item"; li.style.animationDelay = (i * 0.05) + "s";
      const dist = Math.abs((t.price - a.price) / a.price * 100);
      li.innerHTML =
        '<div class="alert-ico" style="background:linear-gradient(135deg,' + t.grad[0] + ',' + t.grad[1] + ')">' + a.sym.slice(0, 2) + '</div>' +
        '<div class="alert-meta"><div class="alert-title">' + a.sym + ' ' + (a.dir === "above" ? "above" : "below") + ' ' + fmtUsd(a.price) + '</div>' +
        '<div class="alert-sub' + (a.on ? " live" : "") + (armed && a.on ? " armed" : "") + '">' +
          (!a.on ? "Paused" : armed ? "● Triggered — condition met" : "● Live · now " + fmtUsd(t.price) + " (" + dist.toFixed(1) + "% away)") + '</div></div>' +
        '<button class="toggle ' + (a.on ? "on" : "") + '" aria-label="Toggle"></button>' +
        '<button class="alert-del" aria-label="Delete"><svg viewBox="0 0 24 24" fill="none"><path d="M6 7h12M9 7V5h6v2M8 7l1 12h6l1-12" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"/></svg></button>';
      li.querySelector(".toggle").addEventListener("click", () => { a.on = !a.on; renderAlerts(); });
      li.querySelector(".alert-del").addEventListener("click", () => { const idx = ALERTS.indexOf(a); if (idx >= 0) ALERTS.splice(idx, 1); renderAlerts(); toast("Alert removed"); });
      list.appendChild(li);
    });
  }
  function initAlerts() {
    $("#alert-token").addEventListener("change", () => {
      const t = token($("#alert-token").value);
      if (t && !$("#alert-price").value) $("#alert-price").value = Math.round(t.price);
    });
    $("#btn-add-alert").addEventListener("click", () => {
      const sym = $("#alert-token").value;
      const dir = $("#alert-dir").value;
      const price = parseFloat($("#alert-price").value);
      if (!price || price <= 0) { toast("Enter a target price"); return; }
      ALERTS.unshift({ id: alertId++, sym: sym, dir: dir, price: price, on: true });
      $("#alert-price").value = "";
      renderAlerts();
      toast("Alert set for " + sym);
    });
  }

  // ====================================================================
  //  EARN / STAKING
  // ====================================================================
  function renderEarn() {
    const stakedUsd = TOKENS.reduce((s, t) => s + t.staked * t.price, 0);
    const yearly = TOKENS.reduce((s, t) => s + t.staked * t.price * t.apy / 100, 0);
    $("#earn-staked-total").textContent = fmtUsd(stakedUsd);
    $("#earn-yield-sub").textContent = "Earning ≈ " + fmtUsd(yearly) + " / yr";
    const list = $("#earn-list");
    list.innerHTML = "";
    TOKENS.filter(t => t.apy > 0).sort((a, b) => b.apy - a.apy).forEach((t, i) => {
      const li = document.createElement("li");
      li.className = "earn-item"; li.style.animationDelay = (i * 0.05) + "s";
      li.innerHTML =
        '<div class="token-ico" style="background:linear-gradient(135deg,' + t.grad[0] + ',' + t.grad[1] + ')">' + t.sym.slice(0, 2) + '</div>' +
        '<div class="earn-meta"><div class="earn-name">' + t.name + ' staking</div>' +
        '<div class="earn-sub">Liquid · unstake anytime</div>' +
        (t.staked > 0 ? '<div class="earn-staked">Staked ' + fmtAmt(t.staked) + ' ' + t.sym + '</div>' : '') + '</div>' +
        '<div class="earn-apy"><div class="earn-apy-v">' + t.apy.toFixed(1) + '%</div><div class="earn-apy-k">APY</div></div>' +
        '<button class="earn-stake-btn">Stake</button>';
      li.querySelector(".earn-stake-btn").addEventListener("click", () => {
        if (t.balance <= 0) { toast("No " + t.sym + " available to stake"); return; }
        // demo: stake half of available, rounded sensibly
        let amt = t.balance * 0.5;
        amt = t.price > 1000 ? Math.round(amt * 1000) / 1000 : t.price > 10 ? Math.round(amt * 100) / 100 : Math.round(amt);
        if (amt <= 0) amt = t.balance;
        openReview({ type: "stake", t: t, amt: Math.min(amt, t.balance) });
      });
      list.appendChild(li);
    });
  }

  // ====================================================================
  //  SOCIAL RECOVERY
  // ====================================================================
  function renderRecovery() {
    const need = Math.max(2, Math.ceil(GUARDIANS.length / 2) + (GUARDIANS.length >= 3 ? 0 : 0));
    const threshold = GUARDIANS.length ? Math.ceil(GUARDIANS.length / 2) + (GUARDIANS.length % 2 === 0 ? 0 : 0) : 0;
    const req = GUARDIANS.length >= 2 ? Math.max(2, Math.round(GUARDIANS.length * 0.6)) : GUARDIANS.length;
    $("#recovery-threshold").textContent = GUARDIANS.length
      ? req + " of " + GUARDIANS.length + " guardians needed to recover your wallet"
      : "Add guardians who can help you recover access";
    const list = $("#guardian-list");
    list.innerHTML = "";
    if (!GUARDIANS.length) { list.innerHTML = '<li class="empty">No guardians yet — add trusted contacts below.</li>'; }
    GUARDIANS.forEach((g, i) => {
      const li = document.createElement("li");
      li.className = "guardian-item"; li.style.animationDelay = (i * 0.05) + "s";
      li.innerHTML =
        '<div class="guardian-avatar" style="background:' + colorFor(g.name) + '">' + escapeHtml(initials(g.name)) + '</div>' +
        '<div class="guardian-meta"><div class="guardian-name">' + escapeHtml(g.name) + '</div>' +
        '<div class="guardian-handle">' + escapeHtml(g.handle) + '</div></div>' +
        '<span class="guardian-badge">Active</span>' +
        '<button class="guardian-del" aria-label="Remove"><svg viewBox="0 0 24 24" fill="none"><path d="M6 6l12 12M18 6 6 18" stroke="currentColor" stroke-width="1.9" stroke-linecap="round"/></svg></button>';
      li.querySelector(".guardian-del").addEventListener("click", () => {
        const idx = GUARDIANS.indexOf(g); if (idx >= 0) GUARDIANS.splice(idx, 1);
        renderRecovery(); toast("Guardian removed");
      });
      list.appendChild(li);
    });
  }
  function initRecovery() {
    $("#btn-add-guardian").addEventListener("click", () => {
      const name = $("#guardian-name").value.trim();
      const handle = $("#guardian-handle").value.trim();
      if (!name || !handle) { toast("Enter a name and handle"); return; }
      GUARDIANS.push({ id: guardianId++, name: name, handle: handle });
      $("#guardian-name").value = ""; $("#guardian-handle").value = "";
      renderRecovery(); toast("Guardian added");
    });
  }

  // ====================================================================
  //  AI COPILOT  (local intent engine, no external API)
  // ====================================================================
  const COPILOT_SUGGESTIONS = [
    "What's my portfolio worth?",
    "How am I doing? (P&L)",
    "Is claim-airdrop.lumen safe?",
    "Explain my last transaction",
    "Send $50 of ETH to alice",
    "What can you do?"
  ];
  let copilotBooted = false;

  function renderCopilot() {
    const chips = $("#chat-suggest");
    chips.innerHTML = "";
    COPILOT_SUGGESTIONS.forEach(s => {
      const b = document.createElement("button");
      b.className = "chat-chip"; b.textContent = s;
      b.addEventListener("click", () => { submitCopilot(s); });
      chips.appendChild(b);
    });
    if (!copilotBooted) {
      copilotBooted = true;
      addChat("bot", "Hi, I'm your Lumen Copilot. I can check your portfolio, screen addresses for scams, explain transactions, or set up a send for you. Try one of the suggestions below.");
    }
  }

  function addChat(role, html) {
    const log = $("#chat-log");
    const div = document.createElement("div");
    div.className = "chat-msg " + role;
    div.innerHTML = html;
    log.appendChild(div);
    log.scrollTop = log.scrollHeight;
    return div;
  }

  function initCopilot() {
    $("#chat-form").addEventListener("submit", e => {
      e.preventDefault();
      const v = $("#chat-text").value.trim();
      if (!v) return;
      submitCopilot(v);
      $("#chat-text").value = "";
    });
  }

  function submitCopilot(text) {
    addChat("user", escapeHtml(text));
    const typing = addChat("bot", '<span class="chat-typing"><span></span><span></span><span></span></span>');
    const reply = copilotReply(text);
    setTimeout(() => {
      typing.innerHTML = reply.html;
      if (reply.action) {
        const btn = document.createElement("button");
        btn.className = "chat-action";
        btn.innerHTML = reply.action.label;
        btn.addEventListener("click", reply.action.fn);
        typing.appendChild(btn);
      }
      $("#chat-log").scrollTop = $("#chat-log").scrollHeight;
    }, REDUCED ? 120 : 650);
  }

  function copilotReply(text) {
    const q = text.toLowerCase().trim();

    // ----- natural-language SEND -----
    const sendIntent = parseSend(q);
    if (sendIntent) {
      const r = resolveRecipient(sendIntent.recipient);
      const t = sendIntent.token;
      if (!r.ok) {
        return { html: "I couldn't find a wallet for <b>" + escapeHtml(sendIntent.recipient) + "</b>. Add them as a contact, or give me a username like <b>alice.lumen</b>." };
      }
      const amt = sendIntent.fiat != null ? (t.price ? sendIntent.fiat / t.price : 0) : sendIntent.amount;
      const flagged = isFlagged(r.address);
      const safetyLine = flagged
        ? ' ⚠️ <span class="chat-neg">Heads up: Scam Shield has this address flagged as a drainer.</span>'
        : ' Scam Shield will run a safety check before you confirm.';
      return {
        html: "Got it — I'll set up a send of <b>" + fmtAmt(amt) + " " + t.sym + "</b>" +
          (sendIntent.fiat != null ? " (≈ " + fmtUsd(sendIntent.fiat) + ")" : "") +
          " to <b>" + escapeHtml(r.kind === "address" ? shortAddr(r.address) : r.label) + "</b>." + safetyLine,
        action: {
          label: '<svg viewBox="0 0 24 24" fill="none"><path d="M7 17 17 7M9 7h8v8" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg> Review this send',
          fn: () => { prefillSend(t.sym, fmtAmt(amt), sendIntent.recipient); navigate("send"); }
        }
      };
    }

    // ----- portfolio worth -----
    if (/(portfolio|net ?worth|total).*(worth|value|balance)|how much.*(have|worth)|what.*worth/.test(q) || q === "balance" || /my balance/.test(q)) {
      const pnl = computePnl();
      const top = TOKENS.slice().sort((a, b) => (b.balance + b.staked) * b.price - (a.balance + a.staked) * a.price)[0];
      return { html: "Your portfolio is worth <b>" + fmtUsd(pnl.value) + "</b> across " + TOKENS.length + " assets. Biggest holding is <b>" + top.name + "</b> at " + fmtUsd((top.balance + top.staked) * top.price) + ". Total P&L is <span class=\"" + (pnl.total >= 0 ? "chat-pos" : "chat-neg") + "\">" + fmtSigned(pnl.total) + " (" + (pnl.totalPct >= 0 ? "+" : "") + pnl.totalPct.toFixed(1) + "%)</span>." };
    }

    // ----- P&L / performance -----
    if (/p&l|pnl|profit|loss|how am i doing|performance|gains?|up or down/.test(q)) {
      const pnl = computePnl();
      const winners = TOKENS.filter(t => t.price > t.cost).sort((a, b) => (b.price / b.cost) - (a.price / a.cost));
      const losers = TOKENS.filter(t => t.price < t.cost);
      let html = "Total unrealized P&L: <span class=\"" + (pnl.total >= 0 ? "chat-pos" : "chat-neg") + "\">" + fmtSigned(pnl.total) + " (" + (pnl.totalPct >= 0 ? "+" : "") + pnl.totalPct.toFixed(1) + "%)</span>. Today you're <span class=\"" + (pnl.day >= 0 ? "chat-pos" : "chat-neg") + "\">" + fmtSigned(pnl.day) + "</span>.";
      if (winners[0]) html += " Best performer: <b>" + winners[0].sym + "</b> (+" + ((winners[0].price / winners[0].cost - 1) * 100).toFixed(0) + "%).";
      if (losers[0]) html += " " + losers[0].sym + " is currently below cost basis.";
      html += ' Open <b>Insights</b> for the full breakdown.';
      return { html: html, action: { label: 'View Insights', fn: () => navigate("insights") } };
    }

    // ----- safety / scam check -----
    if (/safe|scam|legit|trust|risk|drain|phish/.test(q)) {
      // is there an address / username mentioned?
      const m = q.match(/(0x[0-9a-f]{6,}|[a-z0-9-]+\.lumen)/i);
      if (m) {
        const r = resolveRecipient(m[1]);
        if (r.ok && isFlagged(r.address)) {
          return { html: '<span class="chat-neg">⚠️ Do not send to ' + escapeHtml(m[1]) + '.</span> Scam Shield has it flagged as a known wallet drainer — it requests unlimited token approvals and sweeps funds. Reported by 1,284 users.' };
        }
        if (r.ok) {
          return { html: "<b>" + escapeHtml(m[1]) + "</b> looks <span class=\"chat-pos\">clean</span> — it's not on any scam or drainer blocklist, and resolves to " + shortAddr(r.address) + ". I'll still simulate the transaction before you confirm." };
        }
        return { html: "I don't recognize " + escapeHtml(m[1]) + ". If it's a username it isn't registered; treat unknown addresses with caution." };
      }
      // token safety
      const t = findTokenInText(q);
      if (t) return { html: "<b>" + t.name + " (" + t.sym + ")</b> is a verified, well-known asset in your wallet — not a risky contract. Scam Shield only blocks unverified or flagged contracts." };
      return { html: "Paste an address or username (e.g. <b>claim-airdrop.lumen</b>) and I'll screen it with Scam Shield. Every send is also simulated and risk-scored before you confirm." };
    }

    // ----- explain last transaction -----
    if (/explain|what was|last|recent|latest/.test(q) && /transaction|tx|transfer|activity|send|payment/.test(q)) {
      const tx = HISTORY[0];
      if (!tx) return { html: "You don't have any transactions yet." };
      const t = token(tx.sym);
      const usd = t ? fmtUsd(tx.amount * t.price) : "";
      const verb = tx.dir === "out" ? "sent" : "received";
      return { html: "Your most recent activity: you <b>" + verb + " " + fmtAmt(tx.amount) + " " + tx.sym + "</b> (" + usd + ") " + (tx.dir === "out" ? "to" : "from") + " <b>" + escapeHtml(tx.address) + "</b>, " + relTime(tx.ts) + ". It cleared successfully.", action: { label: "Open Activity", fn: () => navigate("history") } };
    }

    // ----- price of a token -----
    if (/price|worth|cost|how much is|value of|trading/.test(q)) {
      const t = findTokenInText(q);
      if (t) return { html: "<b>" + t.name + "</b> is trading at <b>" + fmtUsd(t.price) + "</b>, " + (t.change >= 0 ? '<span class="chat-pos">up ' : '<span class="chat-neg">down ') + Math.abs(t.change).toFixed(1) + "%</span> in 24h. You hold " + fmtAmt(t.balance + t.staked) + " " + t.sym + " (" + fmtUsd((t.balance + t.staked) * t.price) + ").", action: { label: "Open chart", fn: () => openChart(t.sym) } };
    }

    // ----- balance of a token -----
    if (/how much|balance of|do i have|holding/.test(q)) {
      const t = findTokenInText(q);
      if (t) return { html: "You hold <b>" + fmtAmt(t.balance + t.staked) + " " + t.sym + "</b> (" + fmtUsd((t.balance + t.staked) * t.price) + ")" + (t.staked > 0 ? ", of which " + fmtAmt(t.staked) + " is staked at " + t.apy + "% APY" : "") + "." };
    }

    // ----- staking / earn -----
    if (/stake|staking|earn|yield|apy|interest|passive/.test(q)) {
      const best = TOKENS.filter(t => t.apy > 0).sort((a, b) => b.apy - a.apy)[0];
      return { html: "You can earn yield on several assets — highest is <b>" + best.sym + " at " + best.apy + "% APY</b>. Staking is liquid, so you can unstake anytime.", action: { label: "Open Earn", fn: () => navigate("earn") } };
    }

    // ----- buy / swap guidance -----
    if (/\bbuy\b|on.?ramp|purchase|top up/.test(q)) return { html: "You can buy crypto with card or Apple Pay on the Buy screen — pick an amount and you'll see exactly how many tokens you'll receive.", action: { label: "Open Buy", fn: () => navigate("buy") } };
    if (/\bswap\b|exchange|convert|trade/.test(q)) return { html: "Use Swap to convert between tokens with a live rate and slippage control. I'll show price impact and run a safety check first.", action: { label: "Open Swap", fn: () => navigate("swap") } };
    if (/alert|notify|remind/.test(q)) return { html: "Set price alerts to get notified when a coin crosses a target — for example BTC above $70,000.", action: { label: "Open Alerts", fn: () => navigate("alerts") } };
    if (/recover|guardian|seed|phrase|backup|lost/.test(q)) return { html: "Your wallet is a smart account — no seed phrase. If you lose access, your trusted <b>guardians</b> can help you recover it.", action: { label: "Open Security", fn: () => navigate("recovery") } };
    if (/fee|gas|network cost/.test(q)) return { html: "Network fees are shown on every transaction review before you confirm — typically a fraction of the amount. Smart-account onboarding itself is gasless." };

    // ----- help -----
    if (/help|what can you|how do you|capabilit|commands?/.test(q)) {
      return { html: "I can help with:<br>• <b>Portfolio &amp; P&L</b> — “what's my portfolio worth?”<br>• <b>Scam checks</b> — “is this address safe?”<br>• <b>Explaining activity</b> — “explain my last transaction”<br>• <b>Sending</b> — “send $50 of ETH to alice”<br>• <b>Prices, staking, alerts</b> and more. Just ask." };
    }
    if (/^(hi|hey|hello|yo|sup|gm)\b/.test(q)) return { html: "Hey! Want a portfolio snapshot, a scam check, or to send something? Just tell me." };
    if (/thank/.test(q)) return { html: "Anytime. Stay safe out there 🛡️" };

    // fallback
    return { html: "I can check your portfolio value &amp; P&L, screen addresses for scams, explain transactions, and set up sends/swaps. Try “what's my portfolio worth?” or “is claim-airdrop.lumen safe?”." };
  }

  function findTokenInText(q) {
    return TOKENS.find(t => new RegExp("\\b" + t.sym + "\\b", "i").test(q) || new RegExp("\\b" + t.name + "\\b", "i").test(q)) ||
      (/bitcoin/i.test(q) && token("BTC")) || (/ether/i.test(q) && token("ETH")) || (/sol/i.test(q) && token("SOL")) || (/polygon|matic/i.test(q) && token("MATIC")) || null;
  }

  // Parse "send $50 of ETH to alice" / "send 0.2 BTC to bob.lumen"
  function parseSend(q) {
    if (!/\bsend\b|\btransfer\b|\bpay\b/.test(q)) return null;
    if (!/\bto\b/.test(q)) return null;
    const t = findTokenInText(q);
    if (!t) return null;
    const recMatch = q.match(/to\s+([a-z0-9.\-]+)/i);
    if (!recMatch) return null;
    let recipient = recMatch[1];
    if (/^[a-z0-9-]+$/.test(recipient) && !recipient.includes(".") && !/^0x/.test(recipient)) recipient = recipient + ".lumen";
    const fiatMatch = q.match(/\$\s?([\d,]+(?:\.\d+)?)/) || q.match(/([\d,]+(?:\.\d+)?)\s*(?:dollars|usd|bucks)/);
    const amtMatch = q.match(/([\d,]+(?:\.\d+)?)/);
    if (fiatMatch) return { token: t, recipient: recipient, fiat: parseFloat(fiatMatch[1].replace(/,/g, "")) };
    if (amtMatch) return { token: t, recipient: recipient, amount: parseFloat(amtMatch[1].replace(/,/g, "")) };
    return null;
  }

  // Pre-fill the Send form (used by Copilot, Contacts, deep-link)
  function prefillSend(sym, amount, recipient) {
    prepSend();
    if (sym) $("#send-token").value = sym;
    if (amount != null) $("#send-amount").value = amount;
    if (recipient != null) $("#send-address").value = recipient;
    updateSendMeta();
    updateResolveHint();
  }

  // ====================================================================
  //  HISTORY
  // ====================================================================
  function renderHistory() {
    const list = $("#tx-list");
    list.innerHTML = "";
    if (HISTORY.length === 0) { list.innerHTML = '<li class="empty">No transactions yet.</li>'; return; }
    const ICON_OUT = '<svg viewBox="0 0 24 24" fill="none"><path d="M7 17 17 7M9 7h8v8" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>';
    const ICON_IN  = '<svg viewBox="0 0 24 24" fill="none"><path d="M17 7 7 17M15 17H7V9" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>';
    HISTORY.forEach((tx, i) => {
      const t = token(tx.sym);
      const price = t ? t.price : 0;
      const li = document.createElement("li");
      li.className = "tx"; li.style.animationDelay = (i * 0.05) + "s";
      const sign = tx.dir === "out" ? "−" : "+";
      const verb = tx.dir === "out" ? "Sent" : "Received";
      const prep = tx.dir === "out" ? "To " : "From ";
      const sub = /Swap|Bought|Staked/.test(tx.address) ? tx.address : prep + tx.address;
      li.innerHTML =
        '<div class="tx-ico ' + tx.dir + '">' + (tx.dir === "out" ? ICON_OUT : ICON_IN) + '</div>' +
        '<div class="tx-meta"><div class="tx-title">' + verb + ' ' + tx.sym + '</div>' +
          '<div class="tx-sub">' + escapeHtml(sub) + '</div></div>' +
        '<div class="tx-vals"><div class="tx-amt ' + tx.dir + '">' + sign + fmtAmt(tx.amount) + ' ' + tx.sym + '</div>' +
          '<div class="tx-time">' + relTime(tx.ts) + ' · ' + fmtUsd(tx.amount * price) + '</div></div>';
      list.appendChild(li);
    });
  }

  // ====================================================================
  //  CHART / MARKETS
  // ====================================================================
  function chartTokens() { return TOKENS.filter(t => !t.stable); }
  let CHART_SYMBOL = "BTC";
  let tvBuildToken = 0;

  function chartToken() {
    const t = token(CHART_SYMBOL);
    if (t && !t.stable) return t;
    return token("BTC");
  }
  function openChart(sym) { if (sym) CHART_SYMBOL = String(sym).toUpperCase(); navigate("chart"); }

  function renderChart() {
    const active = chartToken();
    CHART_SYMBOL = active.sym;
    const sw = $("#chart-switch");
    sw.innerHTML = "";
    chartTokens().forEach(t => {
      const b = document.createElement("button");
      b.className = "chart-chip" + (t.sym === active.sym ? " active" : "");
      b.innerHTML =
        '<span class="chart-chip-ico" style="background:linear-gradient(135deg,' + t.grad[0] + ',' + t.grad[1] + ')">' + t.sym.slice(0, 2) + '</span>' +
        '<span>' + t.sym + '</span>';
      b.addEventListener("click", () => { CHART_SYMBOL = t.sym; renderChart(); });
      sw.appendChild(b);
    });
    const cu = active.change >= 0;
    $("#chart-ico").style.background = "linear-gradient(135deg," + active.grad[0] + "," + active.grad[1] + ")";
    $("#chart-ico").textContent = active.sym.slice(0, 2);
    $("#chart-name").textContent = active.name;
    $("#chart-sym").textContent = active.sym + " · USD";
    $("#chart-price").textContent = fmtUsd(active.price);
    const chg = $("#chart-chg");
    chg.className = "chart-chg " + (cu ? "up" : "down");
    chg.textContent = (cu ? "▲ " : "▼ ") + Math.abs(active.change).toFixed(1) + "%";
    buildTvWidget(active.tv);
  }

  function buildTvWidget(tvSymbol) {
    const host = $("#tv-widget");
    const offline = $("#chart-offline");
    const myBuild = ++tvBuildToken;
    host.innerHTML = "";
    const unavailable = (typeof TradingView === "undefined") ||
      (typeof navigator !== "undefined" && navigator.onLine === false);
    if (unavailable) { offline.classList.remove("hidden"); host.classList.add("is-hidden"); return; }
    offline.classList.add("hidden");
    host.classList.remove("is-hidden");
    try {
      new TradingView.widget({
        autosize: true, symbol: tvSymbol, interval: "60", timezone: "Etc/UTC",
        theme: "dark", style: "1", locale: "en",
        backgroundColor: "rgba(0,0,0,0)", gridColor: "rgba(255,255,255,0.05)", toolbar_bg: "rgba(0,0,0,0)",
        enable_publishing: false, hide_top_toolbar: true, hide_legend: false,
        hide_side_toolbar: true, allow_symbol_change: false, save_image: false, container_id: "tv-widget"
      });
    } catch (e) {
      if (myBuild === tvBuildToken) { offline.classList.remove("hidden"); host.classList.add("is-hidden"); }
    }
  }

  function initChart() {
    function onConn() { if ($("#view-chart").classList.contains("active")) renderChart(); }
    window.addEventListener("online", onConn);
    window.addEventListener("offline", onConn);
  }

  function renderAll() { renderDashboard(); }

  // ====================================================================
  //  DEEP LINKS
  // ====================================================================
  const SAMPLE_SEED = [
    "ribbon", "harvest", "lunar", "copper", "meadow", "tunnel",
    "crystal", "ember", "fabric", "glide", "hollow", "ivory"
  ];
  function showCreateWithSample() {
    renderSeedGrid(SAMPLE_SEED);
    $("#seed-ack").checked = false;
    $("#btn-create-finish").disabled = true;
    showOnboardCard("create");
  }

  function handleDeepLink() {
    let screen = "", symbol = "";
    try {
      const params = new URLSearchParams(window.location.search);
      screen = (params.get("screen") || "").toLowerCase();
      symbol = (params.get("symbol") || "").toUpperCase();
    } catch (e) {}
    if (!screen) return false;
    STATIC = true;

    if (screen === "create") { showCreateWithSample(); return true; }
    if (screen === "smart") { resetPasskeyStage(); showOnboardCard("smart"); return true; }
    if (screen === "unlock") { $("#screen-onboarding").classList.remove("active"); $("#screen-unlock").classList.add("active"); resetFaceId(); return true; }

    if (screen === "chart" || screen === "markets") { enterWallet(true); openChart(symbol || "BTC"); return true; }

    // Scam Shield demo: open Send with a flagged drainer prefilled + the shield modal showing DANGER
    if (screen === "scamshield") {
      enterWallet(true);
      prefillSend("ETH", "1.25", "claim-airdrop.lumen");
      navigate("send");
      const t = token("ETH");
      const r = resolveRecipient("claim-airdrop.lumen");
      openReview({ type: "send", t: t, amt: 1.25, resolved: r });
      return true;
    }

    const viewMap = {
      dashboard: "dashboard", send: "send", receive: "receive",
      activity: "history", history: "history",
      buy: "buy", swap: "swap", contacts: "contacts", copilot: "copilot",
      insights: "insights", alerts: "alerts", earn: "earn", recovery: "recovery", security: "recovery"
    };
    const view = viewMap[screen];
    if (view) { enterWallet(true); navigate(view); return true; }
    return false;
  }

  // ---------- boot ----------
  document.addEventListener("DOMContentLoaded", function () {
    initOnboarding();
    initUnlock();
    initNav();
    initSend();
    initConfirm();
    initPicker();
    initContacts();
    initReceive();
    initBuy();
    initSwap();
    initInsights();
    initAlerts();
    initRecovery();
    initCopilot();
    initChart();
    showOnboardCard("choice");
    handleDeepLink();
  });
})();

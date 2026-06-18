/**
 * Self-built encrypted wallet vault (Base Sepolia testnet) — viem + WebCrypto.
 *
 * The key is generated in the browser and stored **encrypted** (AES-256-GCM,
 * key derived from a password via PBKDF2-SHA256, 310k iterations) — the same
 * model MetaMask uses. The plaintext key only ever exists in memory while the
 * vault is unlocked, and is wiped on lock. No private key is ever persisted in
 * the clear. No third party, no server.
 *
 * Hardening (security review M1/M2):
 *  - createVault enforces a minimum password strength (the vault blob is in
 *    localStorage, so a weak password is brute-forceable offline).
 *  - the in-memory key auto-locks on inactivity and when the tab is hidden, so a
 *    walked-away session can't keep signing.
 *
 * Testnet for now: a browser-stored vault is fine for valueless test ETH; for
 * real mainnet funds a hardware signer or the passkey smart account (/smart-account)
 * is the stronger path.
 */
import { generatePrivateKey, privateKeyToAccount } from "viem/accounts";
import { createWalletClient, http, parseEther, formatEther, type Address, type Hex } from "viem";
import { client } from "./chain";
import { ACTIVE_CHAIN, ACTIVE_VIEM_CHAIN, ACTIVE_RPC } from "./config";

const STORE = "lumen.vault.v1";
const ITERATIONS = 310_000;

/** Auto-lock the in-memory key after this much inactivity (M2). */
export const AUTO_LOCK_MS = 10 * 60 * 1000; // 10 minutes

interface Vault { v: 1; address: Address; salt: string; iv: string; ct: string }

// Plaintext key lives only in memory, only while unlocked.
let unlockedPk: Hex | null = null;

const textEnc = new TextEncoder();
const textDec = new TextDecoder();

function b64(buf: ArrayBufferLike): string {
  let s = "";
  for (const b of new Uint8Array(buf)) s += String.fromCharCode(b);
  return btoa(s);
}
function unb64(s: string): Uint8Array<ArrayBuffer> {
  const bin = atob(s);
  const out = new Uint8Array(new ArrayBuffer(bin.length));
  for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i);
  return out;
}
function bytes(n: number): Uint8Array<ArrayBuffer> {
  const a = new Uint8Array(new ArrayBuffer(n));
  crypto.getRandomValues(a);
  return a;
}

// ---------------------------------------------------------------------------
// M1 — password strength
// ---------------------------------------------------------------------------

export interface PasswordStrength {
  /** 0–4 (Very weak → Strong). */
  score: number;
  label: "Very weak" | "Weak" | "Fair" | "Good" | "Strong";
  /** Whether it clears the minimum bar to create a vault. */
  acceptable: boolean;
  /** Human-readable suggestions to get stronger. */
  issues: string[];
}

const COMMON = new Set([
  "password", "password1", "12345678", "123456789", "qwerty123", "letmein",
  "iloveyou", "admin123", "welcome1", "abc12345", "passw0rd", "trustno1",
]);

/** A lightweight, dependency-free strength estimate (no zxcvbn needed). */
export function passwordStrength(pw: string): PasswordStrength {
  const issues: string[] = [];
  const len = pw.length;
  const classes =
    (/[a-z]/.test(pw) ? 1 : 0) + (/[A-Z]/.test(pw) ? 1 : 0) +
    (/[0-9]/.test(pw) ? 1 : 0) + (/[^A-Za-z0-9]/.test(pw) ? 1 : 0);

  if (len < 12) issues.push("Use at least 12 characters");
  if (classes < 3) issues.push("Mix upper, lower, numbers and symbols");
  if (/(.)\1\1/.test(pw)) issues.push("Avoid repeated characters");
  if (COMMON.has(pw.toLowerCase())) issues.push("This is a commonly used password");

  let score = 0;
  if (len >= 8) score++;
  if (len >= 12) score++;
  if (len >= 16) score++;
  if (classes >= 3) score++;
  if (COMMON.has(pw.toLowerCase()) || len < 8) score = 0;
  score = Math.min(4, score);

  const label = (["Very weak", "Weak", "Fair", "Good", "Strong"] as const)[score];
  // Minimum bar: ≥12 chars, ≥3 character classes, not a common password.
  const acceptable = len >= 12 && classes >= 3 && !COMMON.has(pw.toLowerCase());
  return { score, label, acceptable, issues };
}

function read(): Vault | null {
  if (typeof window === "undefined") return null;
  try {
    const s = localStorage.getItem(STORE);
    return s ? (JSON.parse(s) as Vault) : null;
  } catch {
    return null;
  }
}

export function hasVault(): boolean { return !!read(); }
export function getAddress(): Address | null { return read()?.address ?? null; }
export function isUnlocked(): boolean { return unlockedPk !== null; }
export function lock(): void { unlockedPk = null; stopAutoLock(); }

// ---------------------------------------------------------------------------
// M2 — idle auto-lock
// ---------------------------------------------------------------------------

let lockTimer: ReturnType<typeof setTimeout> | null = null;
let listening = false;
const lockSubscribers = new Set<() => void>();
const ACTIVITY = ["pointerdown", "keydown", "touchstart", "mousemove", "scroll"] as const;

/** Subscribe to auto-lock events (UI can flip to a locked view). Returns an unsubscribe. */
export function onAutoLock(cb: () => void): () => void {
  lockSubscribers.add(cb);
  return () => lockSubscribers.delete(cb);
}

function doAutoLock() {
  if (unlockedPk === null) return;
  lock();
  for (const cb of lockSubscribers) { try { cb(); } catch { /* ignore */ } }
}

function resetTimer() {
  if (typeof window === "undefined") return;
  if (lockTimer) clearTimeout(lockTimer);
  lockTimer = setTimeout(doAutoLock, AUTO_LOCK_MS);
}

function onActivity() { if (unlockedPk !== null) resetTimer(); }
function onVisibility() {
  // Lock immediately when the tab is hidden — a backgrounded wallet shouldn't stay hot.
  if (document.visibilityState === "hidden") doAutoLock();
}

function startAutoLock() {
  if (typeof window === "undefined") return;
  if (!listening) {
    for (const ev of ACTIVITY) window.addEventListener(ev, onActivity, { passive: true });
    document.addEventListener("visibilitychange", onVisibility);
    listening = true;
  }
  resetTimer();
}

function stopAutoLock() {
  if (typeof window === "undefined") return;
  if (lockTimer) { clearTimeout(lockTimer); lockTimer = null; }
  if (listening) {
    for (const ev of ACTIVITY) window.removeEventListener(ev, onActivity);
    document.removeEventListener("visibilitychange", onVisibility);
    listening = false;
  }
}

async function deriveKey(password: string, salt: BufferSource): Promise<CryptoKey> {
  const base = await crypto.subtle.importKey("raw", textEnc.encode(password) as BufferSource, "PBKDF2", false, ["deriveKey"]);
  return crypto.subtle.deriveKey(
    { name: "PBKDF2", salt, iterations: ITERATIONS, hash: "SHA-256" },
    base,
    { name: "AES-GCM", length: 256 },
    false,
    ["encrypt", "decrypt"],
  );
}

/** Generate a key, encrypt it under `password`, persist the vault, leave it unlocked. */
export async function createVault(password: string): Promise<Address> {
  if (!passwordStrength(password).acceptable) {
    throw new Error("Password too weak: use at least 12 characters mixing upper, lower, numbers and symbols.");
  }
  const pk = generatePrivateKey();
  const account = privateKeyToAccount(pk);
  const salt = bytes(16);
  const iv = bytes(12);
  const key = await deriveKey(password, salt);
  const ct = await crypto.subtle.encrypt({ name: "AES-GCM", iv }, key, textEnc.encode(pk) as BufferSource);
  const vault: Vault = { v: 1, address: account.address, salt: b64(salt.buffer), iv: b64(iv.buffer), ct: b64(ct) };
  localStorage.setItem(STORE, JSON.stringify(vault));
  unlockedPk = pk;
  startAutoLock();
  return account.address;
}

/** Decrypt the vault into memory. Wrong password fails (GCM auth) → returns false. */
export async function unlock(password: string): Promise<boolean> {
  const vault = read();
  if (!vault) return false;
  try {
    const key = await deriveKey(password, unb64(vault.salt));
    const pt = await crypto.subtle.decrypt({ name: "AES-GCM", iv: unb64(vault.iv) }, key, unb64(vault.ct));
    unlockedPk = textDec.decode(pt) as Hex;
    startAutoLock();
    return true;
  } catch {
    return false;
  }
}

/** The viem account for the unlocked key (for signing swaps etc.), or null if locked. */
export function unlockedSigner() {
  return unlockedPk ? privateKeyToAccount(unlockedPk) : null;
}

export function removeVault(): void {
  if (typeof window !== "undefined") localStorage.removeItem(STORE);
  unlockedPk = null;
  stopAutoLock();
}

/** Live native balance on the active chain. */
export async function getBalance(address: Address): Promise<number> {
  const wei = await client(ACTIVE_CHAIN).getBalance({ address });
  return Number(formatEther(wei));
}

/** Sign + broadcast a real ETH transfer on the active chain. Requires the vault unlocked. */
export async function sendTestEth(to: Address, amountEth: string): Promise<Hex> {
  if (!unlockedPk) throw new Error("Wallet is locked — unlock first");
  const account = privateKeyToAccount(unlockedPk);
  const wallet = createWalletClient({ account, chain: ACTIVE_VIEM_CHAIN, transport: http(ACTIVE_RPC) });
  return wallet.sendTransaction({ to, value: parseEther(amountEth) });
}

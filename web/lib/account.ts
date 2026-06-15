/**
 * Self-built encrypted wallet vault (Base Sepolia testnet) — viem + WebCrypto.
 *
 * The key is generated in the browser and stored **encrypted** (AES-256-GCM,
 * key derived from a password via PBKDF2-SHA256, 310k iterations) — the same
 * model MetaMask uses. The plaintext key only ever exists in memory while the
 * vault is unlocked, and is wiped on lock. No private key is ever persisted in
 * the clear. No third party, no server.
 *
 * Testnet for now: a browser-stored vault is fine for valueless test ETH; for
 * real mainnet funds a hardware signer or the passkey smart account (/smart-account)
 * is the stronger path.
 */
import { generatePrivateKey, privateKeyToAccount } from "viem/accounts";
import { createWalletClient, http, parseEther, formatEther, type Address, type Hex } from "viem";
import { baseSepolia } from "viem/chains";
import { client } from "./chain";

const STORE = "lumen.vault.v1";
const RPC = process.env.NEXT_PUBLIC_BASE_SEPOLIA_RPC ?? "https://sepolia.base.org";
const ITERATIONS = 310_000;

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
export function lock(): void { unlockedPk = null; }

/** Generate a key, encrypt it under `password`, persist the vault, leave it unlocked. */
export async function createVault(password: string): Promise<Address> {
  const pk = generatePrivateKey();
  const account = privateKeyToAccount(pk);
  const salt = bytes(16);
  const iv = bytes(12);
  const key = await deriveKey(password, salt);
  const ct = await crypto.subtle.encrypt({ name: "AES-GCM", iv }, key, textEnc.encode(pk) as BufferSource);
  const vault: Vault = { v: 1, address: account.address, salt: b64(salt.buffer), iv: b64(iv.buffer), ct: b64(ct) };
  localStorage.setItem(STORE, JSON.stringify(vault));
  unlockedPk = pk;
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
    return true;
  } catch {
    return false;
  }
}

export function removeVault(): void {
  if (typeof window !== "undefined") localStorage.removeItem(STORE);
  unlockedPk = null;
}

/** Live native balance on Base Sepolia. */
export async function getBalance(address: Address): Promise<number> {
  const wei = await client("baseSepolia").getBalance({ address });
  return Number(formatEther(wei));
}

/** Sign + broadcast a real test-ETH transfer. Requires the vault to be unlocked. */
export async function sendTestEth(to: Address, amountEth: string): Promise<Hex> {
  if (!unlockedPk) throw new Error("Wallet is locked — unlock first");
  const account = privateKeyToAccount(unlockedPk);
  const wallet = createWalletClient({ account, chain: baseSepolia, transport: http(RPC) });
  return wallet.sendTransaction({ to, value: parseEther(amountEth) });
}

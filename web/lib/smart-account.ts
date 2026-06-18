/**
 * Self-built ERC-4337 smart account — a passkey-owned Coinbase Smart Wallet.
 *
 * This is the real "no seed phrase" account: the signer is a WebAuthn passkey
 * (P-256), verified ON-CHAIN by the Coinbase Smart Wallet contract (an audited,
 * open-source standard already deployed on Base — using it is like using ERC-20,
 * not a SaaS). No private key is ever stored: we keep only the passkey's public
 * key + id, and the passkey itself lives in the platform authenticator.
 *
 * The address is counterfactual — derived deterministically from the passkey and
 * deployed automatically on the first transaction. Sending requires an ERC-4337
 * **bundler** to relay the UserOperation; point NEXT_PUBLIC_BUNDLER_URL at a
 * self-hosted bundler (see BUNDLER.md). Reads (address, deployment, balance) need
 * only the RPC.
 */
import { createPublicClient, http, isHex, type Address, type Hex } from "viem";
import {
  createWebAuthnCredential, toWebAuthnAccount, toCoinbaseSmartAccount, createBundlerClient,
  type P256Credential,
} from "viem/account-abstraction";
import { ACTIVE_VIEM_CHAIN, ACTIVE_RPC } from "./config";

const BUNDLER = process.env.NEXT_PUBLIC_BUNDLER_URL ?? "";
const STORE = "lumen.smart.v0";

export interface StoredCredential { id: string; publicKey: Hex }

function publicClient() {
  return createPublicClient({ chain: ACTIVE_VIEM_CHAIN, transport: http(ACTIVE_RPC) });
}

/** Shape-check a stored credential so a tampered localStorage entry is rejected (L5). */
function isValidCredential(c: unknown): c is StoredCredential {
  if (!c || typeof c !== "object") return false;
  const { id, publicKey } = c as Record<string, unknown>;
  return typeof id === "string" && id.length > 0 && typeof publicKey === "string" && isHex(publicKey);
}

export function loadCredential(): StoredCredential | null {
  if (typeof window === "undefined") return null;
  try {
    const s = localStorage.getItem(STORE);
    if (!s) return null;
    const parsed: unknown = JSON.parse(s);
    return isValidCredential(parsed) ? parsed : null;
  } catch {
    return null;
  }
}
function save(c: StoredCredential) { localStorage.setItem(STORE, JSON.stringify(c)); }
export function clearCredential() { if (typeof window !== "undefined") localStorage.removeItem(STORE); }
export function hasSmartWallet(): boolean { return !!loadCredential(); }
export function bundlerConfigured(): boolean { return BUNDLER.length > 0; }

/** Register a real platform passkey (P-256) and persist only its public bits. */
export async function registerSmartWalletPasskey(name: string): Promise<StoredCredential> {
  const cred: P256Credential = await createWebAuthnCredential({ name });
  const stored: StoredCredential = { id: cred.id, publicKey: cred.publicKey };
  save(stored);
  return stored;
}

/** Rebuild the Coinbase Smart Account from the stored passkey. */
export async function getSmartAccount(cred?: StoredCredential) {
  const credential = cred ?? loadCredential();
  if (!credential) throw new Error("No smart wallet passkey on this device");
  const owner = toWebAuthnAccount({ credential });
  return toCoinbaseSmartAccount({ client: publicClient(), owners: [owner], version: "1.1" });
}

export async function getSmartAddress(): Promise<Address> {
  return (await getSmartAccount()).address;
}

export async function isDeployed(address: Address): Promise<boolean> {
  const code = await publicClient().getCode({ address });
  return !!code && code !== "0x";
}

export async function getSmartBalanceEth(address: Address): Promise<number> {
  const wei = await publicClient().getBalance({ address });
  return Number(wei) / 1e18;
}

/** Send a gasless smart-account transaction via the bundler. Requires a bundler URL. */
export async function sendSmartTx(to: Address, valueWei: bigint): Promise<Hex> {
  if (!BUNDLER) throw new Error("No bundler configured — set NEXT_PUBLIC_BUNDLER_URL (see BUNDLER.md)");
  const account = await getSmartAccount();
  const bundler = createBundlerClient({ account, client: publicClient(), transport: http(BUNDLER) });
  return bundler.sendUserOperation({ account, calls: [{ to, value: valueWei }] });
}

/**
 * Self-built account layer (Base Sepolia testnet) — viem, no third party.
 *
 * v0 = a real, locally-generated EOA that signs and broadcasts real testnet
 * transactions directly to the node. A passkey (see passkey.ts) gates access.
 *
 * SECURITY (read this): the key is generated in the browser and stored locally.
 * That is fine for *testnet* funds (no real value) but is NOT hardened for real
 * money. The production path is: passkey-PRF-encrypted storage, then an ERC-4337
 * smart account whose signer is the passkey (verified on-chain) — that's the next
 * milestone. Nothing here should ever hold mainnet funds.
 */
import { generatePrivateKey, privateKeyToAccount } from "viem/accounts";
import { createWalletClient, http, parseEther, formatEther, type Address, type Hex } from "viem";
import { baseSepolia } from "viem/chains";
import { client } from "./chain";

const KEY = "lumen.account.v0";
const RPC = process.env.NEXT_PUBLIC_BASE_SEPOLIA_RPC ?? "https://sepolia.base.org";

interface Stored { address: Address; pk: Hex; createdAt: number; passkeyId?: string }

function read(): Stored | null {
  if (typeof window === "undefined") return null;
  try {
    const s = localStorage.getItem(KEY);
    return s ? (JSON.parse(s) as Stored) : null;
  } catch {
    return null;
  }
}
function write(s: Stored) { localStorage.setItem(KEY, JSON.stringify(s)); }

export function hasAccount(): boolean { return !!read(); }
export function getAddress(): Address | null { return read()?.address ?? null; }
export function getPasskeyId(): string | null { return read()?.passkeyId ?? null; }
export function isPasskeyProtected(): boolean { return !!read()?.passkeyId; }

/** Generate a real account key and persist it (testnet). */
export function createAccount(): Address {
  const pk = generatePrivateKey();
  const account = privateKeyToAccount(pk);
  write({ address: account.address, pk, createdAt: Date.now() });
  return account.address;
}

export function attachPasskey(passkeyId: string) {
  const s = read();
  if (s) write({ ...s, passkeyId });
}

export function removeAccount() {
  if (typeof window !== "undefined") localStorage.removeItem(KEY);
}

/** Live native balance on Base Sepolia. */
export async function getBalance(address: Address): Promise<number> {
  const wei = await client("baseSepolia").getBalance({ address });
  return Number(formatEther(wei));
}

/** Sign and broadcast a real test-ETH transfer on Base Sepolia. Returns the tx hash. */
export async function sendTestEth(to: Address, amountEth: string): Promise<Hex> {
  const s = read();
  if (!s) throw new Error("No account");
  const account = privateKeyToAccount(s.pk);
  const wallet = createWalletClient({ account, chain: baseSepolia, transport: http(RPC) });
  return wallet.sendTransaction({ to, value: parseEther(amountEth) });
}

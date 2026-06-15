import { createPublicClient, http, isAddress, type Address } from "viem";
import { mainnet } from "viem/chains";
import { normalize } from "viem/ens";

const RPC = process.env.NEXT_PUBLIC_MAINNET_RPC ?? "https://ethereum-rpc.publicnode.com";
const mc = createPublicClient({ chain: mainnet, transport: http(RPC) });

export function looksLikeEns(s: string): boolean { return /\.eth$/i.test(s.trim()); }

/** Resolve an ENS name (e.g. vitalik.eth) to an address via Ethereum mainnet. */
export async function resolveName(name: string): Promise<Address | null> {
  try { return await mc.getEnsAddress({ name: normalize(name.trim()) }); }
  catch { return null; }
}

export { isAddress };

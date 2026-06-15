import { formatGwei } from "viem";
import { client } from "./chain";
/** Live Base mainnet gas price in gwei (self-built RPC read). */
export async function getGasGwei(): Promise<number> {
  const wei = await client("base").getGasPrice();
  return Number(formatGwei(wei));
}

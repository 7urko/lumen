// Generate a relay key for the bundler.
// Run from the repo root so it resolves viem from the workspace:
//     node bundler/gen-key.mjs
import { generatePrivateKey, privateKeyToAccount } from "viem/accounts";

const pk = generatePrivateKey();
const account = privateKeyToAccount(pk);

console.log("");
console.log("  Relay PRIVATE KEY :", pk);
console.log("  Relay ADDRESS     :", account.address);
console.log("");
console.log("  1) Put the PRIVATE KEY into bundler/alto-config.json (executor + utility).");
console.log("  2) Fund the ADDRESS with Base Sepolia test ETH from a faucet:");
console.log("     https://docs.base.org/tools/network-faucets");
console.log("  3) Keep this key private. It is a hot key for testnet gas only.");
console.log("");

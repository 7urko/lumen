# Lumen — hardcoded on-chain addresses (verification register)

Every contract address the app trusts, why it's trusted, and its verification status.
All addresses are validated at module load via viem `getAddress` (`vAddr`) — a typo or
bad EIP-55 checksum throws at startup, so we never read/route against a malformed
address. **What that does NOT prove is that an address is the *right* contract.**
Confirming contract identity against official sources is a human gate that must be
cleared **before any mainnet value flows** (testnet misuse is harmless).

## Status legend
- ✅ verified against an authoritative source listed below
- ⚠️ widely-used value but not yet re-confirmed for this project — **verify before mainnet**

## Base mainnet (used when NEXT_PUBLIC_CHAIN=base)
| Symbol / role | Address | Source | Status |
|---|---|---|---|
| USDC | `0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913` | Circle (native Base USDC) | ⚠️ |
| DAI | `0x50c5725949A6F0c72E6C4a641F24049A917DB0Cb` | MakerDAO / Base bridge | ⚠️ |
| cbETH | `0x2Ae3F1Ec7F1F5012CFEab0185bfc7aa3cf0DEc22` | Coinbase | ⚠️ |
| ETH/USD Chainlink feed | `0x71041dddad3595F9CEd3DcCFBe3D1F4b0a16Bb70` | Chainlink data.chain.link (base/eth-usd) | ✅ |
| Uniswap SwapRouter02 | `0x2626664c2603336E57B271c5C0b26F421741e481` | Uniswap docs (Base deployments) + BaseScan | ✅ |
| Uniswap QuoterV2 | `0x3d4e44Eb1374240CE5F1B871ab261CD16335B76a` | Uniswap docs (Base deployments) | ✅ |
| WETH9 | `0x4200000000000000000000000000000000000006` | OP-Stack predeploy (canonical) | ✅ |

## Base Sepolia testnet (active chain for sends/swaps)
| Symbol / role | Address | Source | Status |
|---|---|---|---|
| WETH9 | `0x4200000000000000000000000000000000000006` | OP-Stack predeploy (canonical) | ✅ |
| USDC (test) | `0x036CbD53842c5426634e7929541eC2318f3dCF7e` | Circle testnet USDC | ⚠️ |
| Uniswap SwapRouter02 | `0x94cC0AaC535CCDB3C01d6787D6413C739ae12bc4` | Uniswap docs (Base Sepolia col) | ✅ |
| Uniswap QuoterV2 | `0xC5290058841028F1614F3A6F0F5816cAd0df5E27` | Uniswap docs (Base Sepolia col) | ✅ |

## Ethereum mainnet (read-only, net-worth + ENS)
| Symbol / role | Address | Source | Status |
|---|---|---|---|
| USDC | `0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48` | Circle | ⚠️ |
| DAI | `0x6B175474E89094C44Da98b954EedeAC495271d0F` | MakerDAO | ⚠️ |
| WETH | `0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2` | canonical WETH9 | ⚠️ |
| ETH/USD Chainlink feed | `0x5f4eC3Df9cbd43714FE2740f5E3616155c5b8419` | Chainlink data feeds | ⚠️ |

## Before mainnet — verification checklist
1. Re-confirm every ⚠️ address against its **official deployments page** (Circle, Maker,
   Coinbase, Chainlink `data.chain.link`, Uniswap docs) and flip it to ✅ with the URL.
2. Cross-check on the block explorer that the contract is **verified** and matches the
   expected source (especially any swap router — funds route through it).
3. Confirm the Base Sepolia Uniswap router/quoter against the canonical Uniswap v3
   testnet deployment list (the official docs primarily list mainnets, so verify these
   via the Uniswap deployments repo / a verified explorer entry before relying on them
   beyond throwaway testnet funds).

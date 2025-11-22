import type { ChainConfig } from "./types";

export const SUPPORTED_CHAINS: Record<number, ChainConfig> = {
  42161: {
    chainId: 42161,
    name: "arbitrum",
    rpcUrl: "https://arb1.arbitrum.io/rpc",
    edgeContract: "0x0506263eb2Cc3908C7528F8eE3Dc2ad4d92A6a8E",
    tokens: [
      { address: "0xaf88d065e77c8cC2239327C5EDb3A432268e5831", symbol: "USDC", decimals: 6 },
      { address: "0x912CE59144191C1204E64559FE8253a0e49E6548", symbol: "ARB", decimals: 18 },
      { address: "0x82aF49447D8a07e3bd95BD0d56f35241523fBab1", symbol: "WETH", decimals: 18 },
    ],
  },
  137: {
    chainId: 137,
    name: "polygon",
    rpcUrl: "https://polygon-rpc.com",
    edgeContract: "0x0000000000000000000000000000000000000000",
    tokens: [
      { address: "0x3c499c542cEF5E3811e1192ce70d8cC03d5c3359", symbol: "USDC", decimals: 6 },
      { address: "0x0000000000000000000000000000000000001010", symbol: "MATIC", decimals: 18 },
    ],
  },
};

export function getChainConfig(chainId: number): ChainConfig | undefined {
  return SUPPORTED_CHAINS[chainId];
}

export function getSupportedChainIds(): number[] {
  return Object.keys(SUPPORTED_CHAINS).map(Number);
}

import { config } from "./config";

export interface SupportedResponse {
  kinds: Array<{ scheme: string; network: string }>;
  sourceChains: Array<{ chainId: number; name: string }>;
}

export function getSupported(): SupportedResponse {
  const sourceChains = Object.entries(config.chains).map(([chainId, chain]) => ({
    chainId: Number(chainId),
    name: chain.name,
  }));

  return {
    kinds: [{ scheme: "omni402", network: "base" }],
    sourceChains,
  };
}

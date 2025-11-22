export const config = {
  port: Number(process.env.PORT) || 3001,

  rpc: {
    base: process.env.BASE_RPC_URL!,
    arbitrum: process.env.ARBITRUM_RPC_URL!,
  },

  contracts: {
    hub: process.env.HUB_ADDRESS! as `0x${string}`,
    edgeArbitrum: process.env.EDGE_ARBITRUM_ADDRESS! as `0x${string}`,
  },

  chains: {
    42161: {
      name: "arbitrum",
      rpcUrl: process.env.ARBITRUM_RPC_URL!,
      edgeContract: process.env.EDGE_ARBITRUM_ADDRESS! as `0x${string}`,
    },
  } as Record<number, { name: string; rpcUrl: string; edgeContract: `0x${string}` }>,
};

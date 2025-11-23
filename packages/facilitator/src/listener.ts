import { createPublicClient, http, parseAbiItem } from "viem";
import { base } from "viem/chains";
import { config } from "./config";
import { prisma } from "./db";

const HubABI = [
  {
    type: "event",
    name: "PaymentSettled",
    inputs: [
      { name: "paymentId", type: "bytes32", indexed: true },
      { name: "merchant", type: "address", indexed: true },
      { name: "amount", type: "uint256", indexed: false },
    ],
  },
] as const;

const client = createPublicClient({
  chain: base,
  transport: http(config.rpc.base),
  pollingInterval: 5_000, // Poll every 5 seconds instead of using filters
});

export async function startEventListener() {
  console.log("Starting event listener for PaymentSettled...");

  const unwatch = client.watchContractEvent({
    address: config.contracts.hub,
    abi: HubABI,
    eventName: "PaymentSettled",
    poll: true, // Use polling instead of filters (required for public RPC)
    pollingInterval: 5_000,
    onLogs: async (logs) => {
      for (const log of logs) {
        const { paymentId, merchant, amount } = log.args;
        
        if (!paymentId) continue;

        console.log(`PaymentSettled: ${paymentId}`);

        try {
          await prisma.payment.updateMany({
            where: { 
              invoiceId: paymentId,
              status: "pending",
            },
            data: {
              status: "settled",
              settledAt: new Date(),
              settlementTxHash: log.transactionHash,
            },
          });
        } catch (error) {
          console.error("Failed to update payment:", error);
        }
      }
    },
    onError: (error) => {
      console.error("Event listener error:", error);
    },
  });

  return unwatch;
}

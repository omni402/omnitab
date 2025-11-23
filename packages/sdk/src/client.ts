import { createPublicClient, http, type PublicClient } from "viem";
import { arbitrum, polygon } from "viem/chains";
import { getChainConfig } from "./chains";
import type {
  Invoice,
  PaymentOption,
  PaymentRequirement,
  PaymentPayload,
  VerifyResponse,
  ChainConfig,
} from "./types";

export interface Omni402ClientConfig {
  facilitatorUrl: string;
  chains?: ChainConfig[];
}

export class Omni402Client {
  private facilitatorUrl: string;
  private clients: Map<number, PublicClient> = new Map();

  constructor(config: Omni402ClientConfig) {
    this.facilitatorUrl = config.facilitatorUrl;

    this.clients.set(
      42161,
      createPublicClient({
        chain: arbitrum,
        transport: http(),
      })
    );

    this.clients.set(
      137,
      createPublicClient({
        chain: polygon,
        transport: http(),
      })
    );
  }

  async parseInvoice(response: Response): Promise<Invoice> {
    const data = await response.json();
    return data as Invoice;
  }

  async getPaymentOptions(
    invoice: Invoice,
    userAddress: string
  ): Promise<PaymentOption[]> {
    const options: PaymentOption[] = [];

    for (const option of invoice.availablePaymentOptions) {
      const client = this.clients.get(option.chainId);
      if (!client) continue;

      const balance = await client.readContract({
        address: option.token as `0x${string}`,
        abi: [
          {
            name: "balanceOf",
            type: "function",
            inputs: [{ name: "account", type: "address" }],
            outputs: [{ name: "", type: "uint256" }],
            stateMutability: "view",
          },
        ],
        functionName: "balanceOf",
        args: [userAddress as `0x${string}`],
      });

      options.push({
        ...option,
        userBalance: balance.toString(),
      });
    }

    return options;
  }

  createPaymentHeader(
    invoice: Invoice,
    txHash: string,
    chainId: number,
    lzMessageId: string
  ): string {
    const requirement = invoice.accepts[0];
    const chainConfig = getChainConfig(chainId);

    const payload: PaymentPayload = {
      x402Version: 1,
      scheme: "omni402",
      network: chainConfig?.name || "unknown",
      payload: {
        edgeTxHash: txHash,
        lzMessageId,
        invoiceId: this.generateInvoiceId(requirement),
        sourceChain: chainId,
      },
    };

    return btoa(JSON.stringify(payload));
  }

  async verifyPayment(
    header: string,
    requirement: PaymentRequirement
  ): Promise<VerifyResponse> {
    const payload = JSON.parse(atob(header)) as PaymentPayload;

    const response = await fetch(`${this.facilitatorUrl}/verify`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        x402Version: 1,
        paymentPayload: payload,
        paymentRequirements: requirement,
      }),
    });

    return response.json();
  }

  async settlePayment(
    header: string,
    requirement: PaymentRequirement
  ): Promise<any> {
    const payload = JSON.parse(atob(header)) as PaymentPayload;

    const response = await fetch(`${this.facilitatorUrl}/settle`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        x402Version: 1,
        paymentPayload: payload,
        paymentRequirements: requirement,
      }),
    });

    return response.json();
  }

  private generateInvoiceId(requirement: PaymentRequirement): string {
    const data = `${requirement.payTo}:${requirement.resource}:${requirement.maxAmountRequired}`;
    return "0x" + Array.from(new TextEncoder().encode(data))
      .map(b => b.toString(16).padStart(2, "0"))
      .join("")
      .slice(0, 64)
      .padEnd(64, "0");
  }

  getClient(chainId: number): PublicClient | undefined {
    return this.clients.get(chainId);
  }
}

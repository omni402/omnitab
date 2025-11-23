import type { NextRequest } from "next/server";
import type { PaymentRequirement } from "../types";

const ARB_TOKEN = "0x912CE59144191C1204E64559FE8253a0e49E6548";
const USDC_TOKEN = "0xaf88d065e77c8cC2239327C5EDb3A432268e5831";

interface PaymentConfig {
  amount: string;
  payTo: string;
  resource?: string;
  facilitatorUrl?: string;
}

interface PaymentOptions {
  chainId: number;
  token: string;
  symbol: string;
  decimals: number;
  estimatedAmount?: string;
}

// Helper to build payment options with estimated token amounts
function buildPaymentOptions(usdcAmount: string): PaymentOptions[] {
  const amount = BigInt(usdcAmount);
  const fee = (amount * 7n) / 1000n;
  const total = amount + fee;

  // Estimate ARB amount needed
  // ARB ~$0.2, so need 5 ARB per USDC, with 20% buffer = 6 ARB per USDC
  const arbAmount = (total * BigInt(10 ** 18) * 60n) / (BigInt(10 ** 6) * 10n);

  return [
    {
      chainId: 42161,
      token: USDC_TOKEN,
      symbol: "USDC",
      decimals: 6,
      estimatedAmount: total.toString()
    },
    {
      chainId: 42161,
      token: ARB_TOKEN,
      symbol: "ARB",
      decimals: 18,
      estimatedAmount: arbAmount.toString()
    },
  ];
}

export function requirePayment(
  config: PaymentConfig,
  handler: (req: NextRequest) => Promise<Response> | Response
) {
  return async (req: NextRequest): Promise<Response> => {
    const paymentHeader = req.headers.get("X-PAYMENT");

    if (!paymentHeader) {
      const resource = config.resource || req.url;
      const paymentOptions = buildPaymentOptions(config.amount);

      return new Response(
        JSON.stringify({
          x402Version: 1,
          accepts: [
            {
              scheme: "omni402",
              network: "base",
              maxAmountRequired: config.amount,
              payTo: config.payTo,
              resource,
            },
          ],
          facilitator: config.facilitatorUrl || process.env.NEXT_PUBLIC_FACILITATOR_URL || "http://localhost:3001",
          availablePaymentOptions: paymentOptions,
        }),
        {
          status: 402,
          headers: {
            "Content-Type": "application/json",
          },
        }
      );
    }

    try {
      const payload = JSON.parse(atob(paymentHeader));

      const facilitatorUrl = config.facilitatorUrl || process.env.NEXT_PUBLIC_FACILITATOR_URL || "http://localhost:3001";

      const requestBody = JSON.stringify({
        x402Version: 1,
        paymentPayload: payload,
        paymentRequirements: {
          scheme: "omni402",
          network: "base",
          maxAmountRequired: config.amount,
          payTo: config.payTo,
          resource: config.resource || req.url,
        },
      });

      // First verify the payment
      const verifyResponse = await fetch(`${facilitatorUrl}/verify`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: requestBody,
      });

      const verifyResult = await verifyResponse.json();

      if (!verifyResult.isValid) {
        return new Response(
          JSON.stringify({
            error: "Payment verification failed",
            reason: verifyResult.invalidReason,
          }),
          {
            status: 402,
            headers: { "Content-Type": "application/json" },
          }
        );
      }

      // Then settle (store) the payment
      await fetch(`${facilitatorUrl}/settle`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: requestBody,
      });

      return handler(req);
    } catch (error) {
      return new Response(
        JSON.stringify({
          error: "Invalid payment header",
        }),
        {
          status: 400,
          headers: { "Content-Type": "application/json" },
        }
      );
    }
  };
}

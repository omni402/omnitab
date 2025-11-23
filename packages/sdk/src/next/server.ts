import type { NextRequest } from "next/server";
import type { PaymentRequirement } from "../types";

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
}

const DEFAULT_PAYMENT_OPTIONS: PaymentOptions[] = [
  { chainId: 42161, token: "0xaf88d065e77c8cC2239327C5EDb3A432268e5831", symbol: "USDC", decimals: 6 },
  { chainId: 42161, token: "0x912CE59144191C1204E64559FE8253a0e49E6548", symbol: "ARB", decimals: 18 },
];

export function requirePayment(
  config: PaymentConfig,
  handler: (req: NextRequest) => Promise<Response> | Response
) {
  return async (req: NextRequest): Promise<Response> => {
    const paymentHeader = req.headers.get("X-PAYMENT");

    if (!paymentHeader) {
      const resource = config.resource || req.url;

      return new Response(
        JSON.stringify({
          x402Version: 1,
          accepts: [
            {
              scheme: "omnitab",
              network: "base",
              maxAmountRequired: config.amount,
              payTo: config.payTo,
              resource,
            },
          ],
          facilitator: config.facilitatorUrl || process.env.NEXT_PUBLIC_FACILITATOR_URL || "http://localhost:3001",
          availablePaymentOptions: DEFAULT_PAYMENT_OPTIONS,
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

      const verifyResponse = await fetch(`${facilitatorUrl}/verify`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          x402Version: 1,
          paymentPayload: payload,
          paymentRequirements: {
            scheme: "omnitab",
            network: "base",
            maxAmountRequired: config.amount,
            payTo: config.payTo,
            resource: config.resource || req.url,
          },
        }),
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

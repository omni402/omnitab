import { z } from "zod";

export const PaymentPayloadSchema = z.object({
  x402Version: z.number(),
  scheme: z.literal("omni402"),
  network: z.string(),
  payload: z.object({
    edgeTxHash: z.string(),
    lzMessageId: z.string(),
    invoiceId: z.string(),
    sourceChain: z.number(),
  }),
});

export const PaymentRequirementsSchema = z.object({
  scheme: z.literal("omni402"),
  network: z.literal("base"),
  maxAmountRequired: z.string(),
  payTo: z.string(),
  resource: z.string(),
});

export const VerifyRequestSchema = z.object({
  x402Version: z.number(),
  paymentPayload: PaymentPayloadSchema,
  paymentRequirements: PaymentRequirementsSchema,
});

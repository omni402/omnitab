import { prisma } from "./db";
import { verifyPayment } from "./verify";
import type { VerifyRequest, SettleResponse } from "./types";

export async function settlePayment(req: VerifyRequest): Promise<SettleResponse> {
  const verifyResult = await verifyPayment(req);

  if (!verifyResult.isValid) {
    return {
      success: false,
      errorReason: verifyResult.invalidReason,
      transaction: "",
      network: req.paymentPayload.network,
      payer: verifyResult.payer,
    };
  }

  const { paymentPayload, paymentRequirements } = req;
  const { edgeTxHash, lzMessageId, invoiceId, sourceChain } = paymentPayload.payload;

  try {
    const existing = await prisma.payment.findUnique({
      where: { edgeTxHash },
    });

    if (existing) {
      return {
        success: true,
        transaction: existing.edgeTxHash,
        network: paymentPayload.network,
        payer: existing.payerAddress,
      };
    }

    const payment = await prisma.payment.create({
      data: {
        invoiceId,
        sourceChain,
        payerAddress: verifyResult.payer!.toLowerCase(),
        merchantAddress: paymentRequirements.payTo.toLowerCase(),
        amount: paymentRequirements.maxAmountRequired,
        edgeTxHash,
        lzMessageId,
        status: "pending",
      },
    });

    console.log(`Payment created: ${payment.id} for merchant ${payment.merchantAddress}`);

    return {
      success: true,
      transaction: payment.edgeTxHash,
      network: paymentPayload.network,
      payer: payment.payerAddress,
    };
  } catch (error) {
    console.error("Settlement error:", error);
    return {
      success: false,
      errorReason: "network_error",
      transaction: "",
      network: paymentPayload.network,
      payer: verifyResult.payer,
    };
  }
}

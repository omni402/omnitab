import { createPublicClient, http, decodeEventLog, type Log } from "viem";
import { arbitrum } from "viem/chains";
import { config } from "./config";
import { EdgePaymentABI } from "./abi";
import type { VerifyRequest, VerifyResponse, ErrorReason } from "./types";

const clients: Record<number, ReturnType<typeof createPublicClient>> = {
  42161: createPublicClient({
    chain: arbitrum,
    transport: http(config.rpc.arbitrum),
  }),
};

export async function verifyPayment(req: VerifyRequest): Promise<VerifyResponse> {
  const { paymentPayload, paymentRequirements } = req;
  const { edgeTxHash, lzMessageId, invoiceId, sourceChain } = paymentPayload.payload;

  // Check supported chain
  const chainConfig = config.chains[sourceChain];
  if (!chainConfig) {
    return {
      isValid: false,
      invalidReason: "unsupported_source_chain",
      payer: null,
    };
  }

  const client = clients[sourceChain];
  if (!client) {
    return {
      isValid: false,
      invalidReason: "unsupported_source_chain",
      payer: null,
    };
  }

  try {
    // Fetch transaction receipt
    const receipt = await client.getTransactionReceipt({
      hash: edgeTxHash as `0x${string}`,
    });

    if (!receipt) {
      return {
        isValid: false,
        invalidReason: "transaction_not_found",
        payer: null,
      };
    }

    if (receipt.status !== "success") {
      return {
        isValid: false,
        invalidReason: "invalid_transaction_status",
        payer: null,
      };
    }

    // Find PaymentProcessed event
    let paymentEvent: any = null;
    let messageEvent: any = null;

    for (const log of receipt.logs) {
      try {
        const decoded = decodeEventLog({
          abi: EdgePaymentABI,
          data: log.data,
          topics: log.topics,
        });

        if (decoded.eventName === "PaymentProcessed") {
          paymentEvent = decoded.args;
        } else if (decoded.eventName === "MessageSent") {
          messageEvent = decoded.args;
        }
      } catch {
        // Not our event, skip
      }
    }

    if (!paymentEvent) {
      return {
        isValid: false,
        invalidReason: "invalid_event_data",
        payer: null,
      };
    }

    // Verify invoice ID matches
    if (paymentEvent.paymentId.toLowerCase() !== invoiceId.toLowerCase()) {
      return {
        isValid: false,
        invalidReason: "invoice_mismatch",
        payer: paymentEvent.payer || null,
      };
    }

    // Verify merchant matches payTo
    if (paymentEvent.merchant.toLowerCase() !== paymentRequirements.payTo.toLowerCase()) {
      return {
        isValid: false,
        invalidReason: "recipient_mismatch",
        payer: paymentEvent.payer,
      };
    }

    // Verify amount is sufficient
    const requiredAmount = BigInt(paymentRequirements.maxAmountRequired);
    if (paymentEvent.amount < requiredAmount) {
      return {
        isValid: false,
        invalidReason: "amount_insufficient",
        payer: paymentEvent.payer,
      };
    }

    // Verify LZ message was sent
    if (!messageEvent) {
      return {
        isValid: false,
        invalidReason: "lz_message_not_found",
        payer: paymentEvent.payer,
      };
    }

    // Verify LZ message ID matches
    if (messageEvent.guid.toLowerCase() !== lzMessageId.toLowerCase()) {
      return {
        isValid: false,
        invalidReason: "lz_message_mismatch",
        payer: paymentEvent.payer,
      };
    }

    return {
      isValid: true,
      payer: paymentEvent.payer,
    };
  } catch (error) {
    console.error("Verification error:", error);
    return {
      isValid: false,
      invalidReason: "network_error",
      payer: null,
    };
  }
}

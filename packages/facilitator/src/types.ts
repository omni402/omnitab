export interface PaymentPayload {
  x402Version: number;
  scheme: "omnitab";
  network: string;
  payload: {
    edgeTxHash: string;
    lzMessageId: string;
    invoiceId: string;
    sourceChain: number;
  };
}

export interface PaymentRequirements {
  scheme: "omnitab";
  network: "base";
  maxAmountRequired: string;
  payTo: string;
  resource: string;
}

export interface VerifyRequest {
  x402Version: number;
  paymentPayload: PaymentPayload;
  paymentRequirements: PaymentRequirements;
}

export interface VerifyResponse {
  isValid: boolean;
  invalidReason?: string;
  payer: string | null;
}

export interface SettleResponse {
  success: boolean;
  errorReason?: string;
  transaction: string;
  network: string;
  payer: string | null;
}

export type ErrorReason =
  | "invalid_transaction_status"
  | "transaction_not_found"
  | "invalid_event_data"
  | "invoice_mismatch"
  | "amount_insufficient"
  | "recipient_mismatch"
  | "unsupported_source_chain"
  | "invalid_payment_payload"
  | "lz_message_not_found"
  | "lz_message_mismatch"
  | "network_error";

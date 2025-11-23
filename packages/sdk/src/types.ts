export interface Invoice {
  x402Version: number;
  accepts: PaymentRequirement[];
  facilitator: string;
  availablePaymentOptions: PaymentOption[];
}

export interface PaymentRequirement {
  scheme: "omni402";
  network: "base";
  maxAmountRequired: string;
  payTo: string;
  resource: string;
}

export interface PaymentOption {
  chainId: number;
  token: string;
  symbol: string;
  decimals: number;
  estimatedAmount?: string;
  userBalance?: string;
}

export interface PaymentPayload {
  x402Version: number;
  scheme: "omni402";
  network: string;
  payload: {
    edgeTxHash: string;
    lzMessageId: string;
    invoiceId: string;
    sourceChain: number;
  };
}

export interface VerifyRequest {
  x402Version: number;
  paymentPayload: PaymentPayload;
  paymentRequirements: PaymentRequirement;
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

export interface ChainConfig {
  chainId: number;
  name: string;
  rpcUrl: string;
  edgeContract: `0x${string}`;
  tokens: TokenConfig[];
}

export interface TokenConfig {
  address: `0x${string}`;
  symbol: string;
  decimals: number;
}

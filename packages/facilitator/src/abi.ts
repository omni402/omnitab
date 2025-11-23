export const EdgePaymentABI = [
  {
    type: "event",
    name: "PaymentProcessed",
    inputs: [
      { name: "paymentId", type: "bytes32", indexed: true },
      { name: "payer", type: "address", indexed: true },
      { name: "merchant", type: "address", indexed: true },
      { name: "amount", type: "uint256", indexed: false },
      { name: "fee", type: "uint256", indexed: false },
      { name: "sourceToken", type: "address", indexed: false },
      { name: "sourceAmount", type: "uint256", indexed: false },
    ],
  },
  {
    type: "event",
    name: "MessageSent",
    inputs: [
      { name: "paymentId", type: "bytes32", indexed: true },
      { name: "guid", type: "bytes32", indexed: false },
    ],
  },
] as const;

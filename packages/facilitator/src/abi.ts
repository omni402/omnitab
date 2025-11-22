export const EdgePaymentABI = [
  {
    type: "event",
    name: "PaymentProcessed",
    inputs: [
      { name: "invoiceId", type: "bytes32", indexed: true },
      { name: "payer", type: "address", indexed: true },
      { name: "merchant", type: "address", indexed: false },
      { name: "amount", type: "uint256", indexed: false },
      { name: "fee", type: "uint256", indexed: false },
    ],
  },
  {
    type: "event",
    name: "MessageSent",
    inputs: [
      { name: "guid", type: "bytes32", indexed: false },
      { name: "invoiceId", type: "bytes32", indexed: true },
    ],
  },
] as const;

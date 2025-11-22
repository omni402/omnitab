import type { PublicClient, WalletClient } from "viem";
import { getChainConfig } from "./chains";
import type { TokenConfig } from "./types";

export const EdgePaymentABI = [
  {
    name: "pay",
    type: "function",
    inputs: [
      { name: "paymentId", type: "bytes32" },
      { name: "merchant", type: "address" },
      { name: "amount", type: "uint256" },
      { name: "fee", type: "uint256" },
    ],
    outputs: [],
    stateMutability: "payable",
  },
  {
    name: "quote",
    type: "function",
    inputs: [
      { name: "paymentId", type: "bytes32" },
      { name: "merchant", type: "address" },
      { name: "amount", type: "uint256" },
      { name: "fee", type: "uint256" },
    ],
    outputs: [
      {
        name: "",
        type: "tuple",
        components: [
          { name: "nativeFee", type: "uint256" },
          { name: "lzTokenFee", type: "uint256" },
        ],
      },
    ],
    stateMutability: "view",
  },
  {
    type: "event",
    name: "PaymentProcessed",
    inputs: [
      { name: "paymentId", type: "bytes32", indexed: true },
      { name: "payer", type: "address", indexed: true },
      { name: "merchant", type: "address", indexed: true },
      { name: "amount", type: "uint256", indexed: false },
      { name: "fee", type: "uint256", indexed: false },
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

export const ERC20ABI = [
  {
    name: "balanceOf",
    type: "function",
    inputs: [{ name: "account", type: "address" }],
    outputs: [{ name: "", type: "uint256" }],
    stateMutability: "view",
  },
  {
    name: "approve",
    type: "function",
    inputs: [
      { name: "spender", type: "address" },
      { name: "amount", type: "uint256" },
    ],
    outputs: [{ name: "", type: "bool" }],
    stateMutability: "nonpayable",
  },
  {
    name: "allowance",
    type: "function",
    inputs: [
      { name: "owner", type: "address" },
      { name: "spender", type: "address" },
    ],
    outputs: [{ name: "", type: "uint256" }],
    stateMutability: "view",
  },
] as const;

export async function quoteLzFee(
  client: PublicClient,
  chainId: number,
  paymentId: `0x${string}`,
  merchant: `0x${string}`,
  amount: bigint,
  fee: bigint
): Promise<bigint> {
  const config = getChainConfig(chainId);
  if (!config) throw new Error(`Unsupported chain: ${chainId}`);

  const result = await client.readContract({
    address: config.edgeContract,
    abi: EdgePaymentABI,
    functionName: "quote",
    args: [paymentId, merchant, amount, fee],
  });

  return result.nativeFee;
}

export async function executePayment(
  walletClient: WalletClient,
  publicClient: PublicClient,
  chainId: number,
  paymentId: `0x${string}`,
  merchant: `0x${string}`,
  amount: bigint,
  fee: bigint,
  tokenAddress: `0x${string}`
): Promise<{ hash: string; guid: string }> {
  const config = getChainConfig(chainId);
  if (!config) throw new Error(`Unsupported chain: ${chainId}`);

  const [account] = await walletClient.getAddresses();
  const total = amount + fee;

  const allowance = await publicClient.readContract({
    address: tokenAddress,
    abi: ERC20ABI,
    functionName: "allowance",
    args: [account, config.edgeContract],
  });

  if (allowance < total) {
    const approveHash = await walletClient.writeContract({
      address: tokenAddress,
      abi: ERC20ABI,
      functionName: "approve",
      args: [config.edgeContract, total],
      account,
      chain: walletClient.chain,
    });
    await publicClient.waitForTransactionReceipt({ hash: approveHash });
  }

  const lzFee = await quoteLzFee(
    publicClient,
    chainId,
    paymentId,
    merchant,
    amount,
    fee
  );

  const hash = await walletClient.writeContract({
    address: config.edgeContract,
    abi: EdgePaymentABI,
    functionName: "pay",
    args: [paymentId, merchant, amount, fee],
    value: lzFee,
    account,
    chain: walletClient.chain,
  });

  const receipt = await publicClient.waitForTransactionReceipt({ hash });

  let guid = "0x";
  for (const log of receipt.logs) {
    try {
      if (log.topics[0] === "0x" + "MessageSent".padEnd(64, "0")) {
        guid = log.data;
        break;
      }
    } catch {}
  }

  return { hash, guid };
}

export async function getTokenBalances(
  client: PublicClient,
  userAddress: `0x${string}`,
  tokens: TokenConfig[]
): Promise<Map<string, bigint>> {
  const balances = new Map<string, bigint>();

  for (const token of tokens) {
    const balance = await client.readContract({
      address: token.address,
      abi: ERC20ABI,
      functionName: "balanceOf",
      args: [userAddress],
    });
    balances.set(token.address, balance);
  }

  return balances;
}

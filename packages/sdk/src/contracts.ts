import type { PublicClient, WalletClient } from "viem";
import { parseEventLogs } from "viem";
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
      { name: "token", type: "address" },
      { name: "tokenAmount", type: "uint256" },
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
  tokenAddress: `0x${string}`,
  tokenAmount: bigint
): Promise<{ hash: string; guid: string }> {
  console.log("=== executePayment START ===");
  console.log("chainId:", chainId);
  console.log("paymentId:", paymentId);
  console.log("merchant:", merchant);
  console.log("amount:", amount.toString());
  console.log("fee:", fee.toString());
  console.log("tokenAddress:", tokenAddress);
  console.log("tokenAmount:", tokenAmount.toString());

  const config = getChainConfig(chainId);
  if (!config) throw new Error(`Unsupported chain: ${chainId}`);

  console.log("edgeContract:", config.edgeContract);

  const [account] = await walletClient.getAddresses();
  console.log("account:", account);

  const allowance = await publicClient.readContract({
    address: tokenAddress,
    abi: ERC20ABI,
    functionName: "allowance",
    args: [account, config.edgeContract],
  });

  console.log("current allowance:", allowance.toString());
  console.log("need allowance:", tokenAmount.toString());

  if (allowance < tokenAmount) {
    console.log("=== APPROVING ===");
    console.log("approve token:", tokenAddress);
    console.log("approve spender:", config.edgeContract);
    console.log("approve amount:", tokenAmount.toString());

    const approveHash = await walletClient.writeContract({
      address: tokenAddress,
      abi: ERC20ABI,
      functionName: "approve",
      args: [config.edgeContract, tokenAmount],
      account,
      chain: walletClient.chain,
    });
    console.log("approve tx hash:", approveHash);
    await publicClient.waitForTransactionReceipt({ hash: approveHash });
    console.log("approve confirmed");
  } else {
    console.log("allowance sufficient, skipping approve");
  }

  console.log("=== GETTING LZ FEE ===");
  const lzFee = await quoteLzFee(
    publicClient,
    chainId,
    paymentId,
    merchant,
    amount,
    fee
  );
  console.log("lzFee:", lzFee.toString());

  console.log("=== CALLING PAY ===");
  console.log("pay args:", {
    paymentId,
    merchant,
    amount: amount.toString(),
    fee: fee.toString(),
    tokenAddress,
    tokenAmount: tokenAmount.toString(),
  });

  const hash = await walletClient.writeContract({
    address: config.edgeContract,
    abi: EdgePaymentABI,
    functionName: "pay",
    args: [paymentId, merchant, amount, fee, tokenAddress, tokenAmount],
    value: lzFee,
    account,
    chain: walletClient.chain,
  });
  console.log("tx hash:", hash);

  const receipt = await publicClient.waitForTransactionReceipt({ hash });

  // Parse MessageSent event to get the guid
  let guid = "0x";
  try {
    const messageSentLogs = parseEventLogs({
      abi: EdgePaymentABI,
      logs: receipt.logs,
      eventName: 'MessageSent'
    });

    if (messageSentLogs.length > 0) {
      guid = messageSentLogs[0].args.guid;
      console.log("Extracted guid from MessageSent event:", guid);
    } else {
      console.warn("No MessageSent event found in receipt logs");
    }
  } catch (e) {
    console.error("Failed to parse MessageSent event:", e);
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

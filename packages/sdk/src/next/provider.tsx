"use client";

import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  useMemo,
} from "react";
import { useAccount, useSwitchChain, useConfig } from "wagmi";
import { getWalletClient } from "wagmi/actions";
import { createPublicClient, http } from "viem";
import { arbitrum, polygon } from "viem/chains";
import { Omni402Client } from "../client";
import { executePayment } from "../contracts";
import { PaymentModal } from "./PaymentModal";
import type { Invoice, PaymentOption, ChainConfig } from "../types";

const chainById: Record<number, any> = {
  42161: arbitrum,
  137: polygon,
};

interface Omni402ContextValue {
  client: Omni402Client;
}

const Omni402Context = createContext<Omni402ContextValue | null>(null);

interface Omni402ProviderProps {
  children: React.ReactNode;
  facilitatorUrl: string;
  chains?: ChainConfig[];
}

export function Omni402Provider({
  children,
  facilitatorUrl,
}: Omni402ProviderProps) {
  const { address, chain, isConnected } = useAccount();
  const { switchChainAsync } = useSwitchChain();
  const config = useConfig();

  const client = useMemo(
    () => new Omni402Client({ facilitatorUrl }),
    [facilitatorUrl]
  );

  const [invoice, setInvoice] = useState<Invoice | null>(null);
  const [options, setOptions] = useState<PaymentOption[]>([]);
  const [status, setStatus] = useState<
    "idle" | "pending" | "success" | "error"
  >("idle");
  const [txHash, setTxHash] = useState<string | null>(null);
  const [txGuid, setTxGuid] = useState<string | null>(null);
  const [txChainId, setTxChainId] = useState<number | null>(null);
  const [pendingResolve, setPendingResolve] = useState<
    ((value: Response) => void) | null
  >(null);
  const [pendingRequest, setPendingRequest] = useState<RequestInfo | null>(
    null
  );
  const [pendingInit, setPendingInit] = useState<RequestInit | undefined>(
    undefined
  );

  useEffect(() => {
    const originalFetch = window.fetch;

    window.fetch = async function (
      input: RequestInfo | URL,
      init?: RequestInit
    ): Promise<Response> {
      const response = await originalFetch(input, init);

      if (response.status !== 402) {
        return response;
      }

      const inv = await client.parseInvoice(response.clone());
      const opts = address
        ? await client.getPaymentOptions(inv, address)
        : inv.availablePaymentOptions;

      setInvoice(inv);
      setOptions(opts);
      setStatus("idle");
      setTxHash(null);

      return new Promise<Response>((resolve) => {
        setPendingResolve(() => resolve);
        setPendingRequest(input);
        setPendingInit(init);
      });
    };

    return () => {
      window.fetch = originalFetch;
    };
  }, [client, address]);

  const handleSelect = useCallback(
    async (option: PaymentOption) => {
      console.log("handleSelect called", { option, invoice, isConnected, pendingResolve });

      if (!invoice) {
        console.error("No invoice");
        return;
      }
      if (!isConnected) {
        console.error("Wallet not connected");
        return;
      }
      if (!pendingResolve) {
        console.error("No pendingResolve");
        return;
      }

      setStatus("pending");

      try {
        // Switch to the payment chain if needed
        if (chain?.id !== option.chainId) {
          await switchChainAsync({ chainId: option.chainId });
        }

        // Get wallet client for the target chain
        const walletClient = await getWalletClient(config, { chainId: option.chainId });
        if (!walletClient) {
          throw new Error("Failed to get wallet client");
        }

        // Create public client for the payment chain
        const targetChain = chainById[option.chainId];
        if (!targetChain) throw new Error(`Unsupported chain: ${option.chainId}`);

        const publicClient = createPublicClient({
          chain: targetChain,
          transport: http(),
        });

        const requirement = invoice.accepts[0];
        const amount = BigInt(requirement.maxAmountRequired);
        const fee = (amount * 7n) / 1000n;

        // Generate random paymentId
        const randomBytes = crypto.getRandomValues(new Uint8Array(32));
        const paymentId = ("0x" +
          Array.from(randomBytes)
            .map((b) => b.toString(16).padStart(2, "0"))
            .join("")) as `0x${string}`;

        // option.estimatedAmount is the token amount in native decimals
        // For USDC, it equals amount+fee. For other tokens, it's the equivalent amount.
        const tokenAmount = option.estimatedAmount
          ? BigInt(option.estimatedAmount)
          : amount + fee;

        console.log("Payment debug:", {
          token: option.token,
          symbol: option.symbol,
          tokenAmount: tokenAmount.toString(),
          estimatedAmount: option.estimatedAmount,
        });

        const { hash, guid } = await executePayment(
          walletClient,
          publicClient,
          option.chainId,
          paymentId,
          requirement.payTo as `0x${string}`,
          amount,
          fee,
          option.token as `0x${string}`,
          tokenAmount
        );

        setTxHash(hash);
        setTxGuid(guid);
        setTxChainId(option.chainId);

        const header = client.createPaymentHeader(
          invoice,
          hash,
          option.chainId,
          guid,
          paymentId
        );

        const retryResponse = await fetch(pendingRequest!, {
          ...pendingInit,
          headers: {
            ...(pendingInit?.headers || {}),
            "X-PAYMENT": header,
          },
        });

        setStatus("success");
        pendingResolve(retryResponse);

        // Don't auto-close - let user see the links and close manually
      } catch (error) {
        console.error("Payment failed:", error);
        setStatus("error");
      }
    },
    [client, invoice, isConnected, config, chain, switchChainAsync, pendingResolve, pendingRequest, pendingInit]
  );

  const handleClose = useCallback(() => {
    setInvoice(null);
    if (pendingResolve) {
      pendingResolve(new Response("Payment cancelled", { status: 402 }));
    }
    setPendingResolve(null);
    setPendingRequest(null);
    setPendingInit(undefined);
  }, [pendingResolve]);

  return (
    <Omni402Context.Provider value={{ client }}>
      {children}
      {invoice && (
        <PaymentModal
          invoice={invoice}
          options={options}
          onSelect={handleSelect}
          onClose={handleClose}
          status={status}
          txHash={txHash}
          guid={txGuid}
          chainId={txChainId}
        />
      )}
    </Omni402Context.Provider>
  );
}

export function useOmni402Client() {
  const context = useContext(Omni402Context);
  if (!context)
    throw new Error("useOmni402Client must be used within Omni402Provider");
  return context.client;
}

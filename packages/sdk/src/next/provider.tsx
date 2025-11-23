"use client";

import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  useMemo,
} from "react";
import { useAccount, useWalletClient, usePublicClient } from "wagmi";
import { Omni402Client } from "../client";
import { executePayment } from "../contracts";
import { PaymentModal } from "./PaymentModal";
import type { Invoice, PaymentOption, ChainConfig } from "../types";

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
  const { address } = useAccount();
  const { data: walletClient } = useWalletClient();
  const publicClient = usePublicClient();

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
      if (!invoice || !walletClient || !publicClient || !pendingResolve) return;

      setStatus("pending");

      try {
        const requirement = invoice.accepts[0];
        const amount = BigInt(requirement.maxAmountRequired);
        const fee = (amount * 7n) / 1000n;

        const timestamp = new Date().getTime();
        const paymentId = ("0x" +
          Array.from(
            new TextEncoder().encode(
              requirement.payTo + ":" + timestamp.toString()
            )
          )
            .map((b) => b.toString(16).padStart(2, "0"))
            .join("")
            .slice(0, 64)
            .padEnd(64, "0")) as `0x${string}`;

        const { hash, guid } = await executePayment(
          walletClient,
          publicClient,
          option.chainId,
          paymentId,
          requirement.payTo as `0x${string}`,
          amount,
          fee,
          option.token as `0x${string}`
        );

        setTxHash(hash);

        const header = client.createPaymentHeader(
          invoice,
          hash,
          option.chainId,
          guid
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

        setTimeout(() => {
          setInvoice(null);
          setPendingResolve(null);
          setPendingRequest(null);
          setPendingInit(undefined);
        }, 3000);
      } catch (error) {
        console.error("Payment failed:", error);
        setStatus("error");
      }
    },
    [client, invoice, walletClient, publicClient, pendingResolve, pendingRequest, pendingInit]
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

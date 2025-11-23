"use client";

import React from "react";
import type { Invoice, PaymentOption } from "../types";

interface PaymentModalProps {
  invoice: Invoice;
  options: PaymentOption[];
  onSelect: (option: PaymentOption) => void;
  onClose: () => void;
  status: "idle" | "pending" | "success" | "error";
  txHash: string | null;
  guid: string | null;
  chainId: number | null;
}

export function PaymentModal({
  invoice,
  options,
  onSelect,
  onClose,
  status,
  txHash,
  guid,
  chainId,
}: PaymentModalProps) {
  const getExplorerUrl = (hash: string) => {
    if (chainId === 42161) return `https://arbiscan.io/tx/${hash}`;
    if (chainId === 137) return `https://polygonscan.com/tx/${hash}`;
    return `https://etherscan.io/tx/${hash}`;
  };

  const getExplorerName = () => {
    if (chainId === 42161) return "Arbiscan";
    if (chainId === 137) return "Polygonscan";
    return "Etherscan";
  };
  const requirement = invoice.accepts[0];
  const amountUsd = (Number(requirement.maxAmountRequired) / 1e6).toFixed(2);

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        backgroundColor: "rgba(0, 0, 0, 0.7)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 9999,
      }}
    >
      <div
        style={{
          backgroundColor: "#141414",
          borderRadius: "12px",
          padding: "24px",
          maxWidth: "400px",
          width: "100%",
          boxShadow: "0 20px 25px -5px rgba(0, 0, 0, 0.3)",
          border: "1px solid #2a2a2a",
          color: "white",
        }}
      >
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: "16px",
          }}
        >
          <h2 style={{ margin: 0, fontSize: "20px", fontWeight: 600 }}>
            Payment Required
          </h2>
          <button
            onClick={onClose}
            style={{
              background: "none",
              border: "none",
              fontSize: "24px",
              cursor: "pointer",
              padding: 0,
            }}
          >
            ×
          </button>
        </div>

        <div
          style={{
            backgroundColor: "#1a1a1a",
            borderRadius: "8px",
            padding: "16px",
            marginBottom: "16px",
            border: "1px solid #2a2a2a",
          }}
        >
          <div style={{ fontSize: "14px", color: "#9ca3af" }}>Amount</div>
          <div style={{ fontSize: "24px", fontWeight: 700, color: "white" }}>${amountUsd}</div>
        </div>

        {status === "idle" && (
          <>
            <div
              style={{ fontSize: "14px", color: "#6b7280", marginBottom: "8px" }}
            >
              Select payment method
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
              {options.map((option) => {
                const balance = option.userBalance
                  ? (
                      Number(option.userBalance) /
                      Math.pow(10, option.decimals)
                    ).toFixed(4)
                  : "0";

                return (
                  <button
                    key={`${option.chainId}-${option.token}`}
                    onClick={() => onSelect(option)}
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      padding: "12px 16px",
                      border: "1px solid #2a2a2a",
                      borderRadius: "8px",
                      backgroundColor: "#1a1a1a",
                      cursor: "pointer",
                      transition: "all 0.15s",
                      color: "white",
                    }}
                    onMouseOver={(e) => {
                      e.currentTarget.style.borderColor = "#0052FF";
                      e.currentTarget.style.backgroundColor = "#0052FF15";
                    }}
                    onMouseOut={(e) => {
                      e.currentTarget.style.borderColor = "#2a2a2a";
                      e.currentTarget.style.backgroundColor = "#1a1a1a";
                    }}
                  >
                    <div>
                      <div style={{ fontWeight: 600, color: "white" }}>{option.symbol}</div>
                      <div style={{ fontSize: "12px", color: "#9ca3af" }}>
                        {option.chainId === 42161 ? "Arbitrum" : "Polygon"}
                      </div>
                    </div>
                    <div style={{ textAlign: "right" }}>
                      <div style={{ fontSize: "14px", color: "white" }}>{balance}</div>
                      <div style={{ fontSize: "12px", color: "#9ca3af" }}>
                        Balance
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          </>
        )}

        {status === "pending" && (
          <div style={{ textAlign: "center", padding: "20px" }}>
            <div
              style={{
                width: "40px",
                height: "40px",
                border: "3px solid #2a2a2a",
                borderTopColor: "#0052FF",
                borderRadius: "50%",
                animation: "spin 1s linear infinite",
                margin: "0 auto 16px",
              }}
            />
            <div style={{ fontWeight: 600, color: "white" }}>Processing Payment</div>
            <div style={{ fontSize: "14px", color: "#9ca3af" }}>
              Please confirm in your wallet
            </div>
            <style>{`
              @keyframes spin {
                to { transform: rotate(360deg); }
              }
            `}</style>
          </div>
        )}

        {status === "success" && (
          <div style={{ textAlign: "center", padding: "20px" }}>
            <div
              style={{
                width: "40px",
                height: "40px",
                backgroundColor: "#10b981",
                borderRadius: "50%",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                margin: "0 auto 16px",
                color: "white",
                fontSize: "20px",
              }}
            >
              ✓
            </div>
            <div style={{ fontWeight: 600, color: "white", marginBottom: "12px" }}>Payment Successful</div>
            <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
              {txHash && (
                <a
                  href={getExplorerUrl(txHash)}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{
                    fontSize: "14px",
                    color: "#0052FF",
                    textDecoration: "none",
                  }}
                >
                  View on {getExplorerName()} →
                </a>
              )}
              {txHash && (
                <a
                  href={`https://layerzeroscan.com/tx/${txHash}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{
                    fontSize: "14px",
                    color: "#0052FF",
                    textDecoration: "none",
                  }}
                >
                  View on LayerZero Scan →
                </a>
              )}
            </div>
          </div>
        )}

        {status === "error" && (
          <div style={{ textAlign: "center", padding: "20px" }}>
            <div
              style={{
                width: "40px",
                height: "40px",
                backgroundColor: "#ef4444",
                borderRadius: "50%",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                margin: "0 auto 16px",
                color: "white",
                fontSize: "20px",
              }}
            >
              ✕
            </div>
            <div style={{ fontWeight: 600, color: "white" }}>Payment Failed</div>
            <div style={{ fontSize: "14px", color: "#9ca3af" }}>
              Please try again
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

"use client";

import { useState, useEffect } from "react";
import { SignIn } from "@coinbase/cdp-react";
import { useIsSignedIn, useEvmAddress, useSignOut } from "@coinbase/cdp-hooks";
import { createPublicClient, http, formatUnits } from "viem";
import { base } from "viem/chains";
import {
  Copy,
  ArrowLeft,
  LogOut,
  TrendingUp,
  DollarSign,
  ArrowUpRight,
  ArrowDownRight,
  ExternalLink,
  Code,
  ChevronRight,
  Clock,
  CheckCircle,
  XCircle
} from "lucide-react";

const USDC_ADDRESS = "0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913";
const HUB_ADDRESS = "0x78f0d4741f6d4a37a5f1448577f69bC1df74a349";

const client = createPublicClient({
  chain: base,
  transport: http(),
});

interface Payment {
  paymentId: string;
  amount: bigint;
  timestamp: Date;
  txHash: string;
  sourceChain: number;
  status: string;
}

export default function MerchantPage() {
  const { isSignedIn } = useIsSignedIn();
  const { evmAddress } = useEvmAddress();
  const { signOut } = useSignOut();
  const [copied, setCopied] = useState(false);
  const [activeTab, setActiveTab] = useState<"overview" | "payments" | "developers">("overview");
  const [balance, setBalance] = useState<bigint>(BigInt(0));
  const [payments, setPayments] = useState<Payment[]>([]);
  const [loading, setLoading] = useState(false);

  // Fetch USDC balance and payment history
  useEffect(() => {
    if (!evmAddress) return;

    const fetchData = async () => {
      setLoading(true);
      try {
        // Fetch USDC balance
        const balanceResult = await client.readContract({
          address: USDC_ADDRESS,
          abi: [{
            name: "balanceOf",
            type: "function",
            stateMutability: "view",
            inputs: [{ name: "account", type: "address" }],
            outputs: [{ name: "", type: "uint256" }],
          }],
          functionName: "balanceOf",
          args: [evmAddress as `0x${string}`],
        });
        setBalance(balanceResult as bigint);

        // Fetch payments from facilitator
        const historyRes = await fetch(`/api/balance-history?address=${evmAddress}`);
        if (historyRes.ok) {
          const data = await historyRes.json();
          console.log("Payments data:", data);

          if (data.payments && Array.isArray(data.payments)) {
            const mappedPayments: Payment[] = data.payments.map((p: any) => ({
              paymentId: p.invoiceId,
              amount: BigInt(p.amount),
              timestamp: new Date(p.createdAt),
              txHash: p.settlementTxHash || p.edgeTxHash,
              sourceChain: p.sourceChain,
              status: p.status,
            }));
            setPayments(mappedPayments);
          }
        }
      } catch (error) {
        console.error("Error fetching data:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [evmAddress]);

  const copyAddress = () => {
    if (evmAddress) {
      navigator.clipboard.writeText(evmAddress);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  if (!isSignedIn) {
    return (
      <main className="min-h-screen flex items-center justify-center px-8 bg-bg-primary">
        <div className="max-w-md w-full text-center">
          <SignIn />

          <div className="mt-8">
            <a href="/" className="text-gray-400 hover:text-white text-sm transition flex items-center justify-center gap-2">
              <ArrowLeft className="w-4 h-4" />
              Back to home
            </a>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-bg-primary">
      <nav className="border-b border-gray-800">
        <div className="max-w-6xl mx-auto px-6">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-8">
              <a href="/" className="text-xl font-bold">omni402</a>
              <div className="flex items-center gap-1">
                <button
                  onClick={() => setActiveTab("overview")}
                  className={`px-4 py-2 text-sm font-medium rounded-lg transition ${
                    activeTab === "overview" ? "bg-bg-secondary text-white" : "text-gray-400 hover:text-white"
                  }`}
                >
                  Overview
                </button>
                <button
                  onClick={() => setActiveTab("payments")}
                  className={`px-4 py-2 text-sm font-medium rounded-lg transition ${
                    activeTab === "payments" ? "bg-bg-secondary text-white" : "text-gray-400 hover:text-white"
                  }`}
                >
                  Payments
                </button>
                <button
                  onClick={() => setActiveTab("developers")}
                  className={`px-4 py-2 text-sm font-medium rounded-lg transition ${
                    activeTab === "developers" ? "bg-bg-secondary text-white" : "text-gray-400 hover:text-white"
                  }`}
                >
                  Developers
                </button>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <div className="text-sm text-gray-400">
                {evmAddress?.slice(0, 6)}...{evmAddress?.slice(-4)}
              </div>
              <button
                onClick={() => signOut()}
                className="p-2 hover:bg-bg-secondary rounded-lg transition"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </nav>

      <div className="max-w-6xl mx-auto px-6 py-8">
        {activeTab === "overview" && (
          <>
            <div className="mb-8">
              <h1 className="text-2xl font-bold mb-2">Good morning</h1>
              <p className="text-gray-400">Here's what's happening with your payments.</p>
            </div>

            <div className="grid md:grid-cols-3 gap-6 mb-8">
              <div className="bg-bg-secondary rounded-xl p-6">
                <div className="flex items-center justify-between mb-4">
                  <span className="text-gray-400 text-sm">Balance</span>
                  <DollarSign className="w-4 h-4 text-gray-500" />
                </div>
                <div className="text-3xl font-bold mb-2">
                  {loading ? "..." : `$${formatUnits(balance, 6)}`}
                </div>
                <div className="text-sm text-gray-500">USDC on Base</div>
              </div>

              <div className="bg-bg-secondary rounded-xl p-6">
                <div className="flex items-center justify-between mb-4">
                  <span className="text-gray-400 text-sm">Total Volume</span>
                  <TrendingUp className="w-4 h-4 text-gray-500" />
                </div>
                <div className="text-3xl font-bold mb-2">
                  {loading ? "..." : `$${formatUnits(payments.reduce((acc, p) => acc + p.amount, BigInt(0)), 6)}`}
                </div>
                <div className="text-sm text-gray-500">All time</div>
              </div>

              <div className="bg-bg-secondary rounded-xl p-6">
                <div className="flex items-center justify-between mb-4">
                  <span className="text-gray-400 text-sm">Payments</span>
                  <CheckCircle className="w-4 h-4 text-gray-500" />
                </div>
                <div className="text-3xl font-bold mb-2">{loading ? "..." : payments.length}</div>
                <div className="text-sm text-gray-500">Successful</div>
              </div>
            </div>

            <div className="grid md:grid-cols-2 gap-6">
              <div className="bg-bg-secondary rounded-xl p-6">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="font-semibold">Recent Payments</h2>
                  <button
                    onClick={() => setActiveTab("payments")}
                    className="text-sm text-base-blue hover:text-base-blue-light transition"
                  >
                    View all
                  </button>
                </div>
                {loading ? (
                  <div className="text-center py-8">
                    <p className="text-gray-400 text-sm">Loading...</p>
                  </div>
                ) : payments.length === 0 ? (
                  <div className="text-center py-8">
                    <div className="w-12 h-12 bg-bg-tertiary rounded-full flex items-center justify-center mx-auto mb-4">
                      <Clock className="w-6 h-6 text-gray-500" />
                    </div>
                    <p className="text-gray-400 text-sm">No payments yet</p>
                    <p className="text-gray-500 text-xs mt-1">Payments will appear here once you integrate</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {payments.slice(0, 3).map((payment) => (
                      <div key={payment.paymentId} className="flex items-center justify-between p-3 bg-bg-tertiary rounded-lg">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 bg-green-500/20 rounded-full flex items-center justify-center">
                            <ArrowDownRight className="w-4 h-4 text-green-400" />
                          </div>
                          <div>
                            <div className="text-sm font-medium">+${formatUnits(payment.amount, 6)} USDC</div>
                            <div className="text-xs text-gray-500">{payment.timestamp.toLocaleDateString()}</div>
                          </div>
                        </div>
                        <a
                          href={`https://basescan.org/tx/${payment.txHash}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-gray-400 hover:text-white"
                        >
                          <ExternalLink className="w-4 h-4" />
                        </a>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="bg-bg-secondary rounded-xl p-6">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="font-semibold">Quick Actions</h2>
                </div>
                <div className="space-y-3">
                  <button
                    onClick={() => setActiveTab("developers")}
                    className="w-full flex items-center justify-between p-4 bg-bg-tertiary rounded-lg hover:bg-gray-800 transition"
                  >
                    <div className="flex items-center gap-3">
                      <Code className="w-5 h-5 text-base-blue" />
                      <span className="text-sm">View integration code</span>
                    </div>
                    <ChevronRight className="w-4 h-4 text-gray-500" />
                  </button>
                  <button
                    onClick={copyAddress}
                    className="w-full flex items-center justify-between p-4 bg-bg-tertiary rounded-lg hover:bg-gray-800 transition"
                  >
                    <div className="flex items-center gap-3">
                      <Copy className="w-5 h-5 text-green-400" />
                      <span className="text-sm">{copied ? "Copied!" : "Copy payment address"}</span>
                    </div>
                    <ChevronRight className="w-4 h-4 text-gray-500" />
                  </button>
                  <a
                    href={`https://basescan.org/address/${evmAddress}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-full flex items-center justify-between p-4 bg-bg-tertiary rounded-lg hover:bg-gray-800 transition"
                  >
                    <div className="flex items-center gap-3">
                      <ExternalLink className="w-5 h-5 text-purple-400" />
                      <span className="text-sm">View on BaseScan</span>
                    </div>
                    <ChevronRight className="w-4 h-4 text-gray-500" />
                  </a>
                </div>
              </div>
            </div>
          </>
        )}

        {activeTab === "payments" && (
          <>
            <div className="flex items-center justify-between mb-8">
              <div>
                <h1 className="text-2xl font-bold mb-2">Payments</h1>
                <p className="text-gray-400">View and manage all your payments.</p>
              </div>
              <div className="flex items-center gap-3">
                <select className="bg-bg-secondary border border-gray-700 rounded-lg px-4 py-2 text-sm">
                  <option>All time</option>
                  <option>Last 7 days</option>
                  <option>Last 30 days</option>
                </select>
              </div>
            </div>

            <div className="bg-bg-secondary rounded-xl overflow-hidden">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-800">
                    <th className="text-left text-sm font-medium text-gray-400 px-6 py-4">Amount</th>
                    <th className="text-left text-sm font-medium text-gray-400 px-6 py-4">Status</th>
                    <th className="text-left text-sm font-medium text-gray-400 px-6 py-4">Source Chain</th>
                    <th className="text-left text-sm font-medium text-gray-400 px-6 py-4">Date</th>
                    <th className="text-left text-sm font-medium text-gray-400 px-6 py-4"></th>
                  </tr>
                </thead>
                <tbody>
                  {loading ? (
                    <tr>
                      <td colSpan={5} className="px-6 py-16 text-center">
                        <p className="text-gray-400">Loading...</p>
                      </td>
                    </tr>
                  ) : payments.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="px-6 py-16 text-center">
                        <div className="w-12 h-12 bg-bg-tertiary rounded-full flex items-center justify-center mx-auto mb-4">
                          <DollarSign className="w-6 h-6 text-gray-500" />
                        </div>
                        <p className="text-gray-400 mb-1">No payments yet</p>
                        <p className="text-gray-500 text-sm">When you receive payments, they'll show up here.</p>
                      </td>
                    </tr>
                  ) : (
                    payments.map((payment) => (
                      <tr key={payment.paymentId} className="border-b border-gray-800 last:border-0">
                        <td className="px-6 py-4">
                          <div className="font-medium">${formatUnits(payment.amount, 6)}</div>
                          <div className="text-sm text-gray-500">USDC</div>
                        </td>
                        <td className="px-6 py-4">
                          <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 text-sm rounded-full ${
                            payment.status === "settled"
                              ? "bg-green-500/20 text-green-400"
                              : "bg-yellow-500/20 text-yellow-400"
                          }`}>
                            {payment.status === "settled" ? (
                              <CheckCircle className="w-3 h-3" />
                            ) : (
                              <Clock className="w-3 h-3" />
                            )}
                            {payment.status === "settled" ? "Settled" : "Pending"}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-400">
                          {payment.sourceChain === 42161 ? "Arbitrum" : payment.sourceChain === 137 ? "Polygon" : `Chain ${payment.sourceChain}`}
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-400">
                          {payment.timestamp.toLocaleString()}
                        </td>
                        <td className="px-6 py-4">
                          <a
                            href={`https://basescan.org/tx/${payment.txHash}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-gray-400 hover:text-white"
                          >
                            <ExternalLink className="w-4 h-4" />
                          </a>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </>
        )}

        {activeTab === "developers" && (
          <>
            <div className="mb-8">
              <h1 className="text-2xl font-bold mb-2">Developers</h1>
              <p className="text-gray-400">Everything you need to integrate omni402.</p>
            </div>

            <div className="space-y-6">
              <div className="bg-bg-secondary rounded-xl p-6">
                <h2 className="font-semibold mb-4">Your Payment Address</h2>
                <div className="flex items-center gap-3 bg-bg-tertiary rounded-lg p-4">
                  <code className="text-sm flex-1 break-all font-mono">{evmAddress}</code>
                  <button
                    onClick={copyAddress}
                    className="p-2 hover:bg-white/10 rounded-lg transition"
                  >
                    <Copy className="w-4 h-4" />
                  </button>
                </div>
                {copied && (
                  <p className="text-green-400 text-sm mt-2">Copied to clipboard!</p>
                )}
              </div>

              <div className="bg-bg-secondary rounded-xl p-6">
                <h2 className="font-semibold mb-2">Protect your API route</h2>
                <p className="text-gray-400 text-sm mb-4">
                  Wrap your API handler with requirePayment to enforce x402 payments.
                </p>
                <div className="bg-bg-tertiary rounded-lg p-4 overflow-x-auto">
                  <pre className="text-sm">
                    <code className="text-gray-300">
{`import { requirePayment } from "@omni402/sdk/next";

export const GET = requirePayment({
  amount: "100000", // 0.1 USDC (6 decimals)
  payTo: "${evmAddress}",
}, async (req) => {
  // Your protected logic here
  return Response.json({
    content: "Premium content"
  });
});`}
                    </code>
                  </pre>
                </div>
              </div>

              <div className="bg-bg-secondary rounded-xl p-6">
                <h2 className="font-semibold mb-2">Wrap your app</h2>
                <p className="text-gray-400 text-sm mb-4">
                  Add the provider to your layout to enable the payment modal.
                </p>
                <div className="bg-bg-tertiary rounded-lg p-4 overflow-x-auto">
                  <pre className="text-sm">
                    <code className="text-gray-300">
{`import { Omni402Provider } from "@omni402/sdk/next";

export default function Layout({ children }) {
  return (
    <Omni402Provider facilitatorUrl="https://...">
      {children}
    </Omni402Provider>
  );
}`}
                    </code>
                  </pre>
                </div>
              </div>

              <div className="bg-bg-secondary rounded-xl p-6">
                <h2 className="font-semibold mb-4">Resources</h2>
                <div className="space-y-3">
                  <a
                    href="#"
                    className="flex items-center justify-between p-4 bg-bg-tertiary rounded-lg hover:bg-gray-800 transition"
                  >
                    <span className="text-sm">Documentation</span>
                    <ExternalLink className="w-4 h-4 text-gray-500" />
                  </a>
                  <a
                    href="#"
                    className="flex items-center justify-between p-4 bg-bg-tertiary rounded-lg hover:bg-gray-800 transition"
                  >
                    <span className="text-sm">API Reference</span>
                    <ExternalLink className="w-4 h-4 text-gray-500" />
                  </a>
                  <a
                    href="#"
                    className="flex items-center justify-between p-4 bg-bg-tertiary rounded-lg hover:bg-gray-800 transition"
                  >
                    <span className="text-sm">GitHub</span>
                    <ExternalLink className="w-4 h-4 text-gray-500" />
                  </a>
                </div>
              </div>
            </div>
          </>
        )}
      </div>
    </main>
  );
}

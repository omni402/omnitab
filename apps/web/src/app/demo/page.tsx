"use client";

import { useState } from "react";
import { useAccount, useConnect, useDisconnect } from "wagmi";
import { ArrowLeft, Wallet, Loader2, CheckCircle, XCircle, Lock } from "lucide-react";

export default function DemoPage() {
  const { address, isConnected, chain } = useAccount();
  const { connect, connectors } = useConnect();
  const { disconnect } = useDisconnect();

  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<{ success: boolean; content?: string; error?: string } | null>(null);
  const [paymentRequired, setPaymentRequired] = useState<any>(null);

  const fetchProtectedContent = async () => {
    setLoading(true);
    setResult(null);
    setPaymentRequired(null);

    try {
      const response = await fetch("/api/demo");

      if (response.status === 402) {
        const data = await response.json();
        setPaymentRequired(data);
        setResult({ success: false, error: "Payment required" });
      } else if (response.ok) {
        const data = await response.json();
        setResult({ success: true, content: data.content });
      } else {
        setResult({ success: false, error: "Request failed" });
      }
    } catch (error) {
      setResult({ success: false, error: "Network error" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-bg-primary">
      <nav className="border-b border-gray-800">
        <div className="max-w-4xl mx-auto px-6">
          <div className="flex items-center justify-between h-16">
            <a href="/" className="text-xl font-bold">omni402</a>
            {isConnected ? (
              <div className="flex items-center gap-4">
                <div className="text-sm">
                  <span className="text-gray-400">{chain?.name} • </span>
                  <span className="text-white">{address?.slice(0, 6)}...{address?.slice(-4)}</span>
                </div>
                <button
                  onClick={() => disconnect()}
                  className="text-sm text-gray-400 hover:text-white transition"
                >
                  Disconnect
                </button>
              </div>
            ) : (
              <button
                onClick={() => connect({ connector: connectors[0] })}
                className="px-4 py-2 bg-base-blue hover:bg-base-blue-light rounded-lg text-sm font-medium transition"
              >
                Connect Wallet
              </button>
            )}
          </div>
        </div>
      </nav>

      <div className="max-w-4xl mx-auto px-6 py-12">
        <div className="mb-8">
          <a href="/" className="text-gray-400 hover:text-white text-sm transition flex items-center gap-2 mb-6">
            <ArrowLeft className="w-4 h-4" />
            Back to home
          </a>
          <h1 className="text-3xl font-bold mb-4">x402 Payment Demo</h1>
          <p className="text-gray-400">
            This demo shows how omni402 handles x402 payments. Click the button below to access protected content.
          </p>
        </div>

        <div className="bg-bg-secondary rounded-xl p-8">
          <div className="text-center">
            <div className="w-16 h-16 bg-bg-tertiary rounded-full flex items-center justify-center mx-auto mb-6">
              <Lock className="w-8 h-8 text-base-blue" />
            </div>

            <h2 className="text-xl font-semibold mb-2">Protected Content</h2>
            <p className="text-gray-400 mb-6">
              This endpoint requires a payment of 0.1 USDC to access.
            </p>

            {!isConnected ? (
              <p className="text-yellow-400 text-sm mb-6">
                Connect your wallet to make a payment
              </p>
            ) : null}

            <button
              onClick={fetchProtectedContent}
              disabled={loading}
              className="px-6 py-3 bg-base-blue hover:bg-base-blue-light rounded-xl font-semibold transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 mx-auto"
            >
              {loading ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Loading...
                </>
              ) : (
                <>
                  <Wallet className="w-5 h-5" />
                  Access Content
                </>
              )}
            </button>
          </div>

          {result && (
            <div className={`mt-8 p-4 rounded-lg ${result.success ? "bg-green-500/10 border border-green-500/20" : "bg-red-500/10 border border-red-500/20"}`}>
              <div className="flex items-start gap-3">
                {result.success ? (
                  <CheckCircle className="w-5 h-5 text-green-400 flex-shrink-0 mt-0.5" />
                ) : (
                  <XCircle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
                )}
                <div>
                  <p className={`font-medium ${result.success ? "text-green-400" : "text-red-400"}`}>
                    {result.success ? "Success!" : "Payment Required"}
                  </p>
                  <p className="text-sm text-gray-400 mt-1">
                    {result.success ? result.content : result.error}
                  </p>
                </div>
              </div>
            </div>
          )}

          {paymentRequired && (
            <div className="mt-6 p-4 bg-bg-tertiary rounded-lg">
              <h3 className="font-semibold mb-3">Payment Details</h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-400">Amount:</span>
                  <span>0.1 USDC</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Network:</span>
                  <span>Base</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Scheme:</span>
                  <span>{paymentRequired.accepts?.[0]?.scheme || "omni402"}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Facilitator:</span>
                  <span className="text-xs font-mono truncate max-w-[200px]">{paymentRequired.facilitator}</span>
                </div>
              </div>

              {paymentRequired.availablePaymentOptions && (
                <div className="mt-4 pt-4 border-t border-gray-700">
                  <h4 className="text-sm font-medium mb-2">Available Payment Options</h4>
                  <div className="space-y-2">
                    {paymentRequired.availablePaymentOptions.map((option: any, i: number) => (
                      <div key={i} className="flex items-center justify-between text-sm">
                        <span className="text-gray-400">{option.symbol}</span>
                        <span className="text-xs font-mono">{option.token.slice(0, 8)}...</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

            </div>
          )}
        </div>

        <div className="mt-8 bg-bg-secondary rounded-xl p-6">
          <h3 className="font-semibold mb-4">How it works</h3>
          <ol className="space-y-3 text-sm text-gray-400">
            <li className="flex gap-3">
              <span className="text-base-blue font-bold">1.</span>
              <span>Client requests protected resource without payment header</span>
            </li>
            <li className="flex gap-3">
              <span className="text-base-blue font-bold">2.</span>
              <span>Server responds with 402 and payment requirements</span>
            </li>
            <li className="flex gap-3">
              <span className="text-base-blue font-bold">3.</span>
              <span>User pays from any chain/token via omni402 facilitator</span>
            </li>
            <li className="flex gap-3">
              <span className="text-base-blue font-bold">4.</span>
              <span>Client retries request with X-PAYMENT header</span>
            </li>
            <li className="flex gap-3">
              <span className="text-base-blue font-bold">5.</span>
              <span>Server verifies payment and returns content</span>
            </li>
          </ol>
        </div>
      </div>
    </main>
  );
}

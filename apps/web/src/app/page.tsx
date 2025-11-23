"use client";

import { useState, useEffect } from "react";
import { Zap, Code, Wallet, TrendingUp, CircleDollarSign, Droplets } from "lucide-react";

export default function Home() {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 100);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <main className="min-h-screen">
      <nav className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        scrolled ? "bg-bg-primary/95 backdrop-blur-sm border-b border-gray-800" : "bg-transparent"
      }`}>
        <div className="flex items-center justify-between px-8 py-6 max-w-7xl mx-auto">
          <div className="text-2xl font-bold text-white">omni402</div>
          <div className="flex items-center gap-8">
            <a href="#how-it-works" className="text-white hover:text-white/70 transition">How It Works</a>
            <a href="#merchants" className="text-white hover:text-white/70 transition">Merchants</a>
            <a href="#liquidity" className="text-white hover:text-white/70 transition">LPs</a>
            <a href="#integration" className="text-white hover:text-white/70 transition">Integrate</a>
          </div>
          <button className={`px-4 py-2 rounded-lg font-medium transition ${
            scrolled
              ? "bg-base-blue hover:bg-base-blue-light text-white"
              : "bg-white hover:bg-white/90 text-base-blue"
          }`}>
            Launch App
          </button>
        </div>
      </nav>

      <section className="bg-base-blue pt-32 pb-40 px-8">
        <div className="max-w-7xl mx-auto text-center">
          <div className="inline-block px-4 py-2 bg-white/10 rounded-full text-white text-sm font-medium mb-8">
            Omnichain x402 Payment Facilitator
          </div>
          <h1 className="text-6xl md:text-8xl font-bold mb-6 leading-tight tracking-tight text-white">
            Pay from any chain,<br />
            any token
          </h1>
          <p className="text-xl text-white/80 max-w-3xl mx-auto mb-12">
            The clearing layer between fragmented user liquidity and x402 USDC invoices.
            Instant settlement on Base, regardless of where your users pay from.
          </p>
          <div className="flex items-center justify-center gap-4">
            <button className="bg-white text-base-blue hover:bg-white/90 px-8 py-4 rounded-xl font-semibold text-lg transition">
              Start Building
            </button>
            <button className="bg-white/10 hover:bg-white/20 border border-white/20 px-8 py-4 rounded-xl font-semibold text-lg transition text-white">
              View Demo
            </button>
          </div>
        </div>
      </section>

      <section id="how-it-works" className="py-32 px-8">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-4xl md:text-5xl font-bold mb-20 text-center">How It Works</h2>

          <div className="space-y-16">
            <div className="flex items-start gap-8">
              <div className="text-5xl font-bold text-base-blue">1</div>
              <div>
                <h3 className="text-2xl font-semibold mb-2">User Pays</h3>
                <p className="text-gray-400 text-lg">
                  Any token, any chain. ETH on Arbitrum, MATIC on Polygon, whatever they have.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-8">
              <div className="text-5xl font-bold text-base-blue">2</div>
              <div>
                <h3 className="text-2xl font-semibold mb-2">Swap & Bridge</h3>
                <p className="text-gray-400 text-lg">
                  Edge contract swaps to USDC via 1inch Aqua. LayerZero message sent to Base.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-8">
              <div className="text-5xl font-bold text-base-blue">3</div>
              <div>
                <h3 className="text-2xl font-semibold mb-2">Instant Settlement</h3>
                <p className="text-gray-400 text-lg">
                  Settlement Pool pays merchant immediately. No waiting for bridges.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-8">
              <div className="text-5xl font-bold text-base-blue">4</div>
              <div>
                <h3 className="text-2xl font-semibold mb-2">Replenish</h3>
                <p className="text-gray-400 text-lg">
                  Accumulated USDC bridged back via 1inch Fusion+ to replenish the pool.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section id="merchants" className="py-32 px-8 bg-bg-secondary">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold mb-6">For Merchants</h2>
            <p className="text-xl text-gray-400 max-w-2xl mx-auto">
              Accept any token from any chain. Receive USDC on Base instantly.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8 mb-16">
            <div className="bg-bg-tertiary rounded-2xl p-6">
              <Zap className="w-8 h-8 text-base-blue mb-4" />
              <h3 className="text-lg font-semibold mb-2">Instant Settlement</h3>
              <p className="text-gray-400 text-sm">
                USDC in your wallet within seconds. No waiting for bridges.
              </p>
            </div>

            <div className="bg-bg-tertiary rounded-2xl p-6">
              <Code className="w-8 h-8 text-base-blue mb-4" />
              <h3 className="text-lg font-semibold mb-2">Single Integration</h3>
              <p className="text-gray-400 text-sm">
                One SDK, one chain. No multi-chain infrastructure.
              </p>
            </div>

            <div className="bg-bg-tertiary rounded-2xl p-6">
              <Wallet className="w-8 h-8 text-base-blue mb-4" />
              <h3 className="text-lg font-semibold mb-2">Managed Wallet</h3>
              <p className="text-gray-400 text-sm">
                CDP-powered wallet with full transaction history.
              </p>
            </div>
          </div>
        </div>
      </section>

      <section id="liquidity" className="py-32 px-8">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold mb-6">For Liquidity Providers</h2>
            <p className="text-xl text-gray-400 max-w-2xl mx-auto">
              Deposit USDC to the settlement pool. Earn fees from every payment.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8 mb-16">
            <div className="bg-bg-secondary rounded-2xl p-6">
              <TrendingUp className="w-8 h-8 text-green-400 mb-4" />
              <h3 className="text-lg font-semibold mb-2">High APY</h3>
              <p className="text-gray-400 text-sm">
                0.7% protocol fee on all payments flows to LPs.
              </p>
            </div>

            <div className="bg-bg-secondary rounded-2xl p-6">
              <CircleDollarSign className="w-8 h-8 text-green-400 mb-4" />
              <h3 className="text-lg font-semibold mb-2">Simple Deposit</h3>
              <p className="text-gray-400 text-sm">
                Just deposit USDC on Base. No complex strategies.
              </p>
            </div>

            <div className="bg-bg-secondary rounded-2xl p-6">
              <Droplets className="w-8 h-8 text-green-400 mb-4" />
              <h3 className="text-lg font-semibold mb-2">Liquid Position</h3>
              <p className="text-gray-400 text-sm">
                Withdraw anytime, subject to pool utilization.
              </p>
            </div>
          </div>
        </div>
      </section>

      <section id="integration" className="py-32 px-8 bg-bg-secondary">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-4xl md:text-5xl font-bold mb-6 text-center">Integration</h2>
          <p className="text-xl text-gray-400 mb-16 text-center">
            Two lines of code. That's it.
          </p>

          <div className="space-y-8">
            <div>
              <div className="text-sm text-gray-400 mb-3">Protect your API route</div>
              <div className="bg-bg-tertiary rounded-xl p-6 overflow-x-auto">
                <pre className="text-sm">
                  <code className="text-gray-300">
{`import { requirePayment } from "@omni402/sdk/next";

export const GET = requirePayment({
  amount: "100000",
  payTo: "0xYourAddress",
}, async (req) => {
  return Response.json({ content: "Premium content" });
});`}
                  </code>
                </pre>
              </div>
            </div>

            <div>
              <div className="text-sm text-gray-400 mb-3">Wrap your app</div>
              <div className="bg-bg-tertiary rounded-xl p-6 overflow-x-auto">
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
          </div>
        </div>
      </section>

      <section className="py-32 px-8">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-4xl md:text-5xl font-bold mb-6 text-center">Powered By</h2>
          <p className="text-xl text-gray-400 mb-16 text-center">
            Built on battle-tested infrastructure.
          </p>

          <div className="grid md:grid-cols-3 gap-8">
            <div className="bg-bg-secondary rounded-2xl p-6">
              <h3 className="text-xl font-semibold mb-3">Coinbase CDP</h3>
              <p className="text-gray-400 text-sm">
                Managed wallets for merchants. Secure custody, transaction history, and easy withdrawals.
              </p>
            </div>

            <div className="bg-bg-secondary rounded-2xl p-6">
              <h3 className="text-xl font-semibold mb-3">LayerZero V2</h3>
              <p className="text-gray-400 text-sm">
                Cross-chain messaging for instant settlement. Payment confirmations arrive on Base in seconds.
              </p>
            </div>

            <div className="bg-bg-secondary rounded-2xl p-6">
              <h3 className="text-xl font-semibold mb-3">1inch</h3>
              <p className="text-gray-400 text-sm">
                Aqua for capital-efficient swaps. Fusion+ for batched bridging back to the settlement pool.
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className="py-32 px-8 bg-bg-secondary">
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="text-4xl md:text-5xl font-bold mb-6">Start Building</h2>
          <p className="text-xl text-gray-400 mb-10">
            Accept omnichain payments today.
          </p>
          <div className="flex items-center justify-center gap-4">
            <button className="bg-base-blue hover:bg-base-blue-light px-8 py-4 rounded-xl font-semibold text-lg transition">
              Read the Docs
            </button>
            <button className="bg-white/5 hover:bg-white/10 border border-white/10 px-8 py-4 rounded-xl font-semibold text-lg transition">
              View Demo
            </button>
          </div>
        </div>
      </section>

      <footer className="border-t border-gray-800 py-8 px-8">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="text-gray-400 text-sm">
            © 2025 omni402. Built for winning ETHGlobal Buenos Aires and beyond.
          </div>
          <div className="flex items-center gap-6 text-sm">
            <a href="#" className="text-gray-400 hover:text-white transition">GitHub</a>
            <a href="#" className="text-gray-400 hover:text-white transition">Docs</a>
            <a href="#" className="text-gray-400 hover:text-white transition">Twitter</a>
          </div>
        </div>
      </footer>
    </main>
  );
}

import { Store, Landmark, ArrowLeftRight } from "lucide-react";

export default function AppPage() {
  return (
    <main className="min-h-screen flex items-center justify-center px-8 bg-bg-primary">
      <div className="max-w-lg w-full">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold mb-4">Get Started</h1>
          <p className="text-gray-400">Choose how you want to participate in omni402</p>
        </div>

        <div className="space-y-4">
          <a
            href="/merchant"
            className="block bg-bg-secondary p-6 rounded-2xl hover:bg-bg-tertiary transition border border-transparent hover:border-base-blue/50"
          >
            <div className="flex items-center gap-4">
              <Store className="w-8 h-8 text-base-blue flex-shrink-0" />
              <div>
                <h3 className="font-semibold text-lg mb-1">Accept Payments</h3>
                <p className="text-gray-400 text-sm">
                  Sign up with email, get a wallet, start accepting x402 payments from any chain
                </p>
              </div>
            </div>
          </a>

          <a
            href="/lp/settlement"
            className="block bg-bg-secondary p-6 rounded-2xl hover:bg-bg-tertiary transition border border-transparent hover:border-green-500/50"
          >
            <div className="flex items-center gap-4">
              <Landmark className="w-8 h-8 text-green-400 flex-shrink-0" />
              <div>
                <h3 className="font-semibold text-lg mb-1">Settlement LP</h3>
                <p className="text-gray-400 text-sm">
                  Deposit USDC on Base, earn fees from every payment that flows through
                </p>
              </div>
            </div>
          </a>

          <a
            href="/lp/aqua"
            className="block bg-bg-secondary p-6 rounded-2xl hover:bg-bg-tertiary transition border border-transparent hover:border-white/50"
          >
            <div className="flex items-center gap-4">
              <ArrowLeftRight className="w-8 h-8 text-white flex-shrink-0" />
              <div>
                <h3 className="font-semibold text-lg mb-1">Aqua LP</h3>
                <p className="text-gray-400 text-sm">
                  Provide swap liquidity on edge chains, earn from token conversions
                </p>
              </div>
            </div>
          </a>
        </div>

        <div className="mt-8 text-center">
          <a href="/" className="text-gray-400 hover:text-white text-sm transition">
            ← Back to home
          </a>
        </div>
      </div>
    </main>
  );
}

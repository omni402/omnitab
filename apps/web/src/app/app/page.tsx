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

          <div
            className="block bg-bg-secondary p-6 rounded-2xl border border-transparent opacity-50 cursor-not-allowed"
          >
            <div className="flex items-center gap-4">
              <Landmark className="w-8 h-8 text-green-400/50 flex-shrink-0" />
              <div>
                <h3 className="font-semibold text-lg mb-1 text-gray-500">Settlement LP</h3>
                <p className="text-gray-500 text-sm">
                  Coming soon - Deposit USDC on Base, earn fees from every payment
                </p>
              </div>
            </div>
          </div>

          <div
            className="block bg-bg-secondary p-6 rounded-2xl border border-transparent opacity-50 cursor-not-allowed"
          >
            <div className="flex items-center gap-4">
              <ArrowLeftRight className="w-8 h-8 text-white/50 flex-shrink-0" />
              <div>
                <h3 className="font-semibold text-lg mb-1 text-gray-500">Aqua LP</h3>
                <p className="text-gray-500 text-sm">
                  Coming soon - Provide swap liquidity on edge chains
                </p>
              </div>
            </div>
          </div>
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

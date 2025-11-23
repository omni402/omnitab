"use client";

import { useState, useEffect } from "react";
import { Zap, Code, Wallet, TrendingUp, CircleDollarSign, Droplets, Repeat, Layers, ArrowLeftRight } from "lucide-react";

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
          <a href="/app" className={`px-4 py-2 rounded-lg font-medium transition ${
            scrolled
              ? "bg-base-blue hover:bg-base-blue-light text-white"
              : "bg-white hover:bg-white/90 text-base-blue"
          }`}>
            Launch App
          </a>
        </div>
      </nav>

      <section className="bg-base-blue min-h-screen flex items-center px-8">
        <div className="max-w-7xl mx-auto text-center w-full">
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
            <a href="/app" className="bg-white text-base-blue hover:bg-white/90 px-8 py-4 rounded-xl font-semibold text-lg transition">
              Launch App
            </a>
            <a href="/demo" className="bg-white/10 hover:bg-white/20 border border-white/20 px-8 py-4 rounded-xl font-semibold text-lg transition text-white">
              View Demo
            </a>
          </div>
        </div>
      </section>

      <section id="how-it-works" className="min-h-screen flex items-center px-8">
        <div className="max-w-5xl mx-auto w-full">
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

      <section id="merchants" className="min-h-screen flex items-center px-8 bg-bg-secondary">
        <div className="max-w-6xl mx-auto w-full">
          <div className="grid md:grid-cols-2 gap-16 items-center">
            <div className="aspect-square bg-gray-800 rounded-2xl overflow-hidden">
              <img
                src="https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?w=800&h=800&fit=crop"
                alt="Payment"
                className="w-full h-full object-cover"
              />
            </div>

            <div>
              <h2 className="text-4xl md:text-5xl font-bold mb-4">For Merchants</h2>
              <p className="text-xl text-gray-400 mb-12">
                Accept any token from any chain. Receive USDC on Base instantly.
              </p>

              <div className="space-y-8">
                <div>
                  <h3 className="font-semibold text-2xl mb-2">Instant Settlement</h3>
                  <p className="text-gray-400 text-xl">
                    USDC in your wallet within seconds. No waiting for bridges.
                  </p>
                </div>

                <div>
                  <h3 className="font-semibold text-2xl mb-2">Single Integration</h3>
                  <p className="text-gray-400 text-xl">
                    One SDK, one chain. No multi-chain infrastructure.
                  </p>
                </div>

                <div>
                  <h3 className="font-semibold text-2xl mb-2">Managed Wallet</h3>
                  <p className="text-gray-400 text-xl">
                    CDP-powered wallet with full transaction history.
                  </p>
                </div>
              </div>

              <a href="/merchant" className="inline-block mt-8 bg-base-blue hover:bg-base-blue-light px-6 py-3 rounded-xl font-semibold transition">
                Start Accepting Payments
              </a>
            </div>
          </div>
        </div>
      </section>

      <section id="liquidity" className="min-h-screen flex items-center px-8">
        <div className="max-w-6xl mx-auto w-full">
          <div className="grid md:grid-cols-2 gap-16 items-center">
            <div className="order-2 md:order-1">
              <h2 className="text-4xl md:text-5xl font-bold mb-4">For Settlement LPs</h2>
              <p className="text-xl text-gray-400 mb-12">
                Deposit USDC to the settlement pool. Earn fees from every payment.
              </p>

              <div className="space-y-8">
                <div>
                  <h3 className="font-semibold text-2xl mb-2">High APY</h3>
                  <p className="text-gray-400 text-xl">
                    0.7% protocol fee on all payments flows to LPs.
                  </p>
                </div>

                <div>
                  <h3 className="font-semibold text-2xl mb-2">Simple Deposit</h3>
                  <p className="text-gray-400 text-xl">
                    Just deposit USDC on Base. No complex strategies.
                  </p>
                </div>

                <div>
                  <h3 className="font-semibold text-2xl mb-2">Liquid Position</h3>
                  <p className="text-gray-400 text-xl">
                    Withdraw anytime, subject to pool utilization.
                  </p>
                </div>
              </div>

              <a href="/lp/settlement" className="inline-block mt-8 bg-green-500 hover:bg-green-600 px-6 py-3 rounded-xl font-semibold transition">
                Deposit Liquidity
              </a>
            </div>

            <div className="order-1 md:order-2 aspect-square bg-gray-800 rounded-2xl overflow-hidden">
              <img
                src="https://images.unsplash.com/photo-1642790106117-e829e14a795f?w=800&h=800&fit=crop"
                alt="Liquidity"
                className="w-full h-full object-cover"
              />
            </div>
          </div>
        </div>
      </section>

      <section id="aqua" className="min-h-screen flex items-center px-8 bg-bg-secondary">
        <div className="max-w-6xl mx-auto w-full">
          <div className="grid md:grid-cols-2 gap-16 items-center">
            <div className="aspect-square bg-gray-800 rounded-2xl overflow-hidden">
              <img
                src="https://images.unsplash.com/photo-1639762681485-074b7f938ba0?w=800&h=800&fit=crop"
                alt="Swap"
                className="w-full h-full object-cover"
              />
            </div>

            <div>
              <h2 className="text-4xl md:text-5xl font-bold mb-4">For Aqua LPs</h2>
              <p className="text-xl text-gray-400 mb-12">
                Provide swap liquidity on edge chains. Earn from every payment that needs a token swap.
              </p>

              <div className="space-y-8">
                <div>
                  <h3 className="font-semibold text-2xl mb-2">Swap Volume</h3>
                  <p className="text-gray-400 text-xl">
                    Earn fees from users paying with non-USDC tokens.
                  </p>
                </div>

                <div>
                  <h3 className="font-semibold text-2xl mb-2">Multiple Chains</h3>
                  <p className="text-gray-400 text-xl">
                    Deploy strategies on Arbitrum, Polygon, and more.
                  </p>
                </div>

                <div>
                  <h3 className="font-semibold text-2xl mb-2">Capital Efficient</h3>
                  <p className="text-gray-400 text-xl">
                    1inch Aqua optimizes your capital across strategies.
                  </p>
                </div>
              </div>

              <a href="/lp/aqua" className="inline-block mt-8 bg-white text-black hover:bg-gray-200 px-6 py-3 rounded-xl font-semibold transition">
                Provide Swap Liquidity
              </a>
            </div>
          </div>
        </div>
      </section>

      <section id="integration" className="min-h-screen flex items-center px-8">
        <div className="max-w-4xl mx-auto w-full">
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

      <section className="min-h-screen flex items-center px-8">
        <div className="max-w-5xl mx-auto w-full">
          <h2 className="text-4xl md:text-5xl font-bold mb-6 text-center">Powered By</h2>
          <p className="text-xl text-gray-400 mb-16 text-center">
            Built on battle-tested infrastructure.
          </p>

          <div className="grid md:grid-cols-3 gap-8">
            <div className="bg-bg-secondary rounded-2xl p-6">
              <img
                src="https://avatars.githubusercontent.com/u/18060234?s=200&v=4"
                alt="Coinbase"
                className="w-12 h-12 rounded-lg mb-4"
              />
              <p className="text-gray-400 text-sm">
                Coinbase brings managed wallets for merchants. Secure custody, transaction history, and easy withdrawals.
              </p>
            </div>

            <div className="bg-bg-secondary rounded-2xl p-6">
              <div className="h-12 mb-4 flex items-center">
                <svg width="125" height="34" viewBox="0 0 125 34" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M9.51364 8.3127e-07C8.25792 0.00626346 7.01571 0.26115 5.85798 0.75015C4.70025 1.23915 3.64967 1.95272 2.76624 2.85C1.8828 3.74727 1.18382 4.81074 0.709201 5.97964C0.234586 7.14855 -0.00635202 8.40001 0.00012729 9.66256V12.8542H7.72992V8.23017C7.72983 8.01301 7.7723 7.79797 7.8549 7.59732C7.9375 7.39667 8.05862 7.21436 8.21132 7.06079C8.36403 6.90722 8.54535 6.78546 8.74489 6.70237C8.94444 6.61927 9.15832 6.57654 9.37431 6.57658H9.65298C9.86897 6.57654 10.0829 6.61928 10.2824 6.70237C10.482 6.78546 10.6633 6.90722 10.8161 7.06079C10.9688 7.21435 11.0899 7.39667 11.1726 7.59732C11.2552 7.79797 11.2977 8.013 11.2977 8.23017V20.626C12.3128 20.626 13.318 20.425 14.2558 20.0345C15.1936 19.6439 16.0458 19.0714 16.7636 18.3498C17.4814 17.6281 18.0507 16.7713 18.4392 15.8284C18.8276 14.8855 19.0275 13.8748 19.0275 12.8542V9.66256C19.033 7.10448 18.0311 4.6482 16.2408 2.83057C15.3624 1.93362 14.3152 1.22142 13.1602 0.735457C12.0053 0.249496 10.7657 -0.000526135 9.51364 8.3127e-07Z" fill="white"/>
                  <path d="M9.65335 26.9007H9.37468C9.15872 26.9007 8.94487 26.8579 8.74535 26.7749C8.54582 26.6918 8.36452 26.57 8.21182 26.4164C8.05911 26.2629 7.93799 26.0807 7.85537 25.8801C7.77275 25.6795 7.73024 25.4644 7.73029 25.2473V12.8516C6.71517 12.8515 5.70997 13.0524 4.77211 13.4429C3.83425 13.8335 2.98211 14.4059 2.26431 15.1276C1.54652 15.8493 0.977135 16.7061 0.588708 17.6491C0.20028 18.592 0.00041149 19.6027 0.000498842 20.6233V23.7705C-0.0123788 25.0349 0.22419 26.2893 0.696522 27.4612C1.16885 28.6331 1.86757 29.6992 2.75228 30.5979C3.63698 31.4965 4.69011 32.2099 5.85076 32.6968C7.01141 33.1837 8.25656 33.4344 9.51417 33.4344C10.7718 33.4344 12.0169 33.1837 13.1776 32.6968C14.3382 32.2099 15.3914 31.4965 16.2761 30.5979C17.1608 29.6992 17.8595 28.6331 18.3318 27.4612C18.8042 26.2893 19.0407 25.0349 19.0278 23.7705V20.6233H11.2981V25.2473C11.2981 25.4645 11.2555 25.6795 11.1729 25.8801C11.0902 26.0807 10.969 26.263 10.8163 26.4165C10.6636 26.5701 10.4823 26.6918 10.2827 26.7749C10.0832 26.8579 9.86932 26.9007 9.65335 26.9007Z" fill="white"/>
                  <path d="M32.2404 9.8125H29.5312V23.6309H37.4828V21.0257H32.2407L32.2404 9.8125Z" fill="white"/>
                  <path d="M46.1589 14.9305C45.7768 14.453 45.2875 14.0734 44.7312 13.823C44.1749 13.5725 43.5674 13.4582 42.9586 13.4894C42.3225 13.4844 41.6928 13.6166 41.1119 13.8772C40.531 14.1378 40.0125 14.5207 39.5914 15C38.6872 16.0186 38.1875 17.3361 38.1875 18.7015C38.1875 20.0668 38.6872 21.3843 39.5914 22.403C40.0126 22.8821 40.5312 23.2648 41.1121 23.5253C41.693 23.7857 42.3226 23.9179 42.9586 23.9129C44.3331 23.9129 45.3999 23.4325 46.1589 22.4719V23.6367H48.6919V13.7665H46.1589V14.9305ZM45.3838 20.7049C45.1283 20.962 44.8231 21.1637 44.4872 21.2978C44.1512 21.4319 43.7915 21.4954 43.4302 21.4845C43.0702 21.4961 42.7118 21.4329 42.3772 21.2987C42.0427 21.1646 41.7394 20.9624 41.4861 20.7049C40.9931 20.1552 40.7203 19.4412 40.7203 18.701C40.7203 17.9607 40.9931 17.2468 41.4861 16.6971C41.7395 16.4398 42.0429 16.2378 42.3774 16.1037C42.7118 15.9696 43.0703 15.9063 43.4302 15.9177C43.7914 15.907 44.1511 15.9706 44.487 16.1046C44.823 16.2386 45.1282 16.4402 45.3838 16.6971C45.8824 17.2441 46.1589 17.959 46.1589 18.701C46.1589 19.4429 45.8824 20.1579 45.3838 20.7049Z" fill="white"/>
                  <path d="M55.2195 20.3919L52.659 13.7578H49.8906L53.9143 23.3126C53.7459 23.8828 53.4148 24.3907 52.962 24.7734C52.4861 25.0979 51.9152 25.251 51.3418 25.208V27.5772C52.4597 27.6811 53.5773 27.3759 54.4893 26.7176C55.3317 26.0783 56.0084 25.0541 56.5194 23.645L60.0985 13.7585H57.389L55.2195 20.3919Z" fill="white"/>
                  <path d="M65.5816 13.4875C64.8911 13.4631 64.2031 13.5829 63.561 13.8395C62.919 14.0961 62.3369 14.4839 61.8515 14.9783C60.9143 15.9913 60.3949 17.3245 60.3985 18.7081C60.402 20.0916 60.9283 21.4221 61.8708 22.4302C62.8527 23.4169 64.1551 23.9104 65.7781 23.9106C67.6625 23.9106 69.0892 23.2067 70.0582 21.7989L68.0164 20.614C67.7568 20.9453 67.421 21.2082 67.0379 21.3801C66.6549 21.5521 66.236 21.6279 65.8173 21.601C64.3118 21.601 63.389 20.9826 63.0487 19.7457H70.4509C70.5141 19.4004 70.547 19.05 70.549 18.6989C70.5865 17.324 70.082 15.9901 69.1454 14.9877C68.6917 14.497 68.1392 14.1093 67.5246 13.8506C66.91 13.5919 66.2476 13.4681 65.5816 13.4875ZM63.0097 17.7714C63.1218 17.1914 63.4347 16.6702 63.893 16.3003C64.3802 15.9382 64.9757 15.7536 65.5813 15.7773C66.1347 15.7701 66.6756 15.9434 67.1229 16.2712C67.5986 16.6395 67.9178 17.1755 68.0161 17.7711L63.0097 17.7714Z" fill="white"/>
                  <path d="M74.8454 15.4575V13.7593H72.3125V23.6298H74.8454V18.9119C74.8454 17.9644 75.1497 17.2866 75.7582 16.8785C76.3676 16.4704 77.105 16.3017 77.83 16.4047V13.5628C77.1933 13.5547 76.5661 13.7183 76.0136 14.0365C75.468 14.3548 75.0537 14.8589 74.8454 15.4575Z" fill="white"/>
                  <path d="M90.1775 11.9496V9.81244H81.1684V12.4184H86.7447L81.0234 21.4546V23.6305H90.2869V21.0253H84.4556L90.1775 11.9496Z" fill="white"/>
                  <path d="M96.2695 13.4875C95.579 13.4631 94.8909 13.5829 94.2488 13.8395C93.6067 14.0961 93.0246 14.4839 92.5391 14.9783C91.6018 15.9913 91.0823 17.3246 91.086 18.7082C91.0896 20.0917 91.6161 21.4222 92.5587 22.4302C93.5406 23.4169 94.8429 23.9104 96.4657 23.9106C98.3501 23.9106 99.7769 23.2067 100.746 21.7989L98.704 20.614C98.4444 20.9452 98.1087 21.2081 97.7257 21.38C97.3427 21.552 96.9239 21.6278 96.5053 21.601C94.9996 21.601 94.0768 20.9826 93.7369 19.7457H101.139C101.202 19.4003 101.235 19.05 101.237 18.6989C101.274 17.324 100.77 15.9901 99.8333 14.9877C99.3797 14.497 98.8271 14.1093 98.2125 13.8506C97.5979 13.5919 96.9355 13.4681 96.2695 13.4875ZM93.6977 17.7714C93.8097 17.1914 94.1228 16.6701 94.5812 16.3003C95.0685 15.938 95.664 15.7535 96.2695 15.7774C96.823 15.7699 97.3639 15.9432 97.8111 16.2712C98.2869 16.6395 98.606 17.1755 98.704 17.7711L93.6977 17.7714Z" fill="white"/>
                  <path d="M105.533 15.4575V13.7593H103V23.6298H105.533V18.9119C105.533 17.9644 105.837 17.2866 106.446 16.8785C107.055 16.4704 107.792 16.3018 108.517 16.4047V13.5628C107.881 13.5547 107.253 13.7183 106.701 14.0365C106.155 14.3548 105.741 14.8588 105.533 15.4575Z" fill="white"/>
                  <path d="M114.293 13.4857C113.104 13.4989 111.957 13.9252 111.046 14.6923C110.135 15.4594 109.515 16.52 109.294 17.6939C109.072 18.8678 109.261 20.0827 109.829 21.1324C110.397 22.1821 111.309 23.0017 112.409 23.4522C113.51 23.9026 114.732 23.9562 115.868 23.6037C117.003 23.2512 117.982 22.5143 118.639 21.5183C119.296 20.5223 119.589 19.3286 119.47 18.1397C119.35 16.9508 118.825 15.8402 117.984 14.9963C117.504 14.5037 116.929 14.1155 116.294 13.8556C115.659 13.5958 114.978 13.4699 114.293 13.4857ZM116.197 20.6517C115.949 20.9038 115.652 21.1021 115.324 21.2344C114.997 21.3666 114.646 21.43 114.293 21.4206C113.941 21.4307 113.591 21.3676 113.265 21.2353C112.939 21.1029 112.643 20.9043 112.397 20.6517C111.911 20.1182 111.641 19.4208 111.641 18.6972C111.641 17.9737 111.911 17.2764 112.397 16.7428C112.643 16.4903 112.939 16.2917 113.265 16.1594C113.591 16.0271 113.941 15.9638 114.293 15.9738C114.646 15.9645 114.996 16.028 115.324 16.1603C115.652 16.2925 115.949 16.4908 116.197 16.7428C116.689 17.2733 116.963 17.9718 116.963 18.6972C116.963 19.4227 116.689 20.1212 116.197 20.6517Z" fill="white"/>
                  <path d="M124.809 20.5938H121.727V23.6339H124.809V20.5938Z" fill="white"/>
                </svg>
              </div>
              <p className="text-gray-400 text-sm">
                LayerZero enables cross-chain messaging for instant settlement. Payment confirmations arrive on Base in seconds.
              </p>
            </div>

            <div className="bg-bg-secondary rounded-2xl p-6">
              <div className="h-12 mb-4 flex items-center">
                <svg width="84" height="24" viewBox="0 0 84 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M80.8657 6.78481V0H84V6.78481H80.8657ZM75.3493 6.78481V0H78.4836V6.78481H75.3493ZM59.5836 23.6624H63.5015V15.1224C63.5015 11.4768 65.3821 9.82279 67.0746 9.82279C68.7672 9.82279 69.8642 10.9705 69.8642 13.7384V23.6624H73.7821V12.8945C73.7821 8.94515 71.7761 6.44726 68.5164 6.44726C66.2284 6.44726 64.4731 7.72996 63.5015 10.5316V0H59.5836V23.6624ZM-5.72205e-06 23.6624H14.8881V20.2869H9.40298V0H6.14328C6.0179 2.83544 5.26567 3.5443 1.66119 3.5443H-5.72205e-06V6.78481H5.48507V20.2869H-5.72205e-06V23.6624ZM49.6164 9.82279C51.5597 9.82279 53.0955 11.4768 53.2836 13.8397H57.3269C56.7627 9.35021 53.691 6.44726 49.6164 6.44726C45.197 6.44726 41.6866 10.1266 41.6866 15.2236C41.6866 20.3207 45.197 24 49.6164 24C53.691 24 56.7627 21.1308 57.3269 16.6413H53.2836C53.0955 19.0042 51.5597 20.6245 49.6164 20.6245C47.6731 20.6245 45.6985 18.7679 45.6985 15.2236C45.6985 11.6793 47.6104 9.82279 49.6164 9.82279ZM25.0746 23.6624H28.9925V15.1224C28.9925 11.4768 30.8731 9.82279 32.5657 9.82279C34.2582 9.82279 35.3552 10.9705 35.3552 13.7384V23.6624H39.2731V12.8945C39.2731 8.94515 37.2672 6.44726 34.0075 6.44726C31.7194 6.44726 29.9642 7.72996 28.9925 10.5316V6.78481H25.0746V23.6624ZM17.2388 0V4.21941H21.1567V0H17.2388ZM17.2388 6.78481V23.6624H21.1567V6.78481H17.2388Z" fill="white"/>
                </svg>
              </div>
              <p className="text-gray-400 text-sm">
                1inch Aqua powers capital-efficient swaps. Fusion+ handles batched bridging back to the settlement pool.
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className="min-h-screen flex items-center px-8 bg-bg-secondary">
        <div className="max-w-3xl mx-auto text-center w-full">
          <h2 className="text-4xl md:text-5xl font-bold mb-6">Start Building</h2>
          <p className="text-xl text-gray-400 mb-10">
            Accept omnichain payments today.
          </p>
          <div className="flex items-center justify-center gap-4">
            <a href="/app" className="bg-base-blue hover:bg-base-blue-light px-8 py-4 rounded-xl font-semibold text-lg transition">
              Launch App
            </a>
            <a href="/demo" className="bg-white/5 hover:bg-white/10 border border-white/10 px-8 py-4 rounded-xl font-semibold text-lg transition">
              View Demo
            </a>
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

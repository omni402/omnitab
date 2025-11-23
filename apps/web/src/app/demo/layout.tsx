"use client";

import { WagmiProvider } from "@/providers/WagmiProvider";
import { Omni402Provider } from "@omni402/sdk/next";

export default function DemoLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <WagmiProvider>
      <Omni402Provider facilitatorUrl="http://localhost:3001">
        {children}
      </Omni402Provider>
    </WagmiProvider>
  );
}

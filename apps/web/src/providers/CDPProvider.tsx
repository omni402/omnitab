"use client";

import { ReactNode } from "react";
import { CDPReactProvider, type Config, type Theme } from "@coinbase/cdp-react";

const config: Config = {
  projectId: process.env.NEXT_PUBLIC_CDP_PROJECT_ID || "",
  ethereum: {
    createOnLogin: "smart",
  },
  appName: "omni402",
  appLogoUrl: "",
  authMethods: ["email", "oauth:google"],
  showCoinbaseFooter: false,
};

const theme: Partial<Theme> = {
  "colors-bg-default": "#0a0a0a",
  "colors-bg-alternate": "#111111",
  "colors-bg-primary": "#0052FF",
  "colors-bg-secondary": "#1a1a1a",
  "colors-fg-default": "#ffffff",
  "colors-fg-muted": "#9ca3af",
  "colors-fg-primary": "#0052FF",
  "colors-fg-onPrimary": "#ffffff",
  "colors-fg-onSecondary": "#ffffff",
  "colors-fg-positive": "#22c55e",
  "colors-fg-negative": "#ef4444",
  "colors-fg-warning": "#f59e0b",
  "colors-line-default": "#1a1a1a",
  "colors-line-heavy": "#374151",
  "borderRadius-cta": "var(--cdp-web-borderRadius-lg)",
  "borderRadius-link": "var(--cdp-web-borderRadius-lg)",
  "borderRadius-input": "var(--cdp-web-borderRadius-lg)",
  "borderRadius-select-trigger": "var(--cdp-web-borderRadius-lg)",
  "borderRadius-select-list": "var(--cdp-web-borderRadius-lg)",
  "borderRadius-modal": "var(--cdp-web-borderRadius-xl)",
  "font-family-sans": "var(--font-space-grotesk), ui-sans-serif, system-ui, sans-serif",
};

interface CDPProviderProps {
  children: ReactNode;
}

export function CDPProvider({ children }: CDPProviderProps) {
  return (
    <CDPReactProvider config={config} theme={theme}>
      {children}
    </CDPReactProvider>
  );
}

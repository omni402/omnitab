import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "OmniTab",
  description: "Omnichain x402 payments from any chain, any token",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}

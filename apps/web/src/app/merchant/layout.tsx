import { CDPProvider } from "@/providers/CDPProvider";

export default function MerchantLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <CDPProvider>{children}</CDPProvider>;
}

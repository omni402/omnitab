import { ethers } from "hardhat";
import "dotenv/config";

const ADDRESSES = {
  arbitrum: {
    edge: process.env.ARBITRUM_EDGE_ADDRESS!,
    usdc: process.env.ARBITRUM_USDC_ADDRESS!,
  },
};

async function main() {
  const [payer] = await ethers.getSigners();
  const network = await ethers.provider.getNetwork();

  if (network.chainId !== 42161n) {
    throw new Error("This script must run on Arbitrum (chainId 42161)");
  }

  console.log("Test Payment from", payer.address);

  const usdc = await ethers.getContractAt("IERC20", ADDRESSES.arbitrum.usdc);
  const edge = await ethers.getContractAt("EdgePayment", ADDRESSES.arbitrum.edge);

  const usdcBalance = await usdc.balanceOf(payer.address);
  const ethBalance = await ethers.provider.getBalance(payer.address);

  console.log("USDC:", ethers.formatUnits(usdcBalance, 6));
  console.log("ETH:", ethers.formatEther(ethBalance));

  const paymentId = ethers.keccak256(ethers.toUtf8Bytes(`test-payment-${Date.now()}`));
  const merchant = payer.address;
  const amount = ethers.parseUnits("0.05", 6);
  const fee = ethers.parseUnits("0.0004", 6);
  const total = amount + fee;

  console.log("\nPayment ID:", paymentId);
  console.log("Amount:", ethers.formatUnits(amount, 6), "USDC");
  console.log("Fee:", ethers.formatUnits(fee, 6), "USDC");

  const quoteFee = await edge.quote(paymentId, merchant, amount, fee);
  console.log("LZ fee:", ethers.formatEther(quoteFee.nativeFee), "ETH");

  if (usdcBalance < total) {
    throw new Error(`Insufficient USDC. Need ${ethers.formatUnits(total, 6)}`);
  }
  if (ethBalance < quoteFee.nativeFee) {
    throw new Error(`Insufficient ETH. Need ${ethers.formatEther(quoteFee.nativeFee)}`);
  }

  console.log("\nApproving USDC...");
  let tx = await usdc.approve(ADDRESSES.arbitrum.edge, total);
  await tx.wait();
  console.log("Approved:", tx.hash);

  console.log("Sending payment...");
  tx = await edge.pay(paymentId, merchant, amount, fee, {
    value: quoteFee.nativeFee,
  });
  const receipt = await tx.wait();
  console.log("Payment sent:", tx.hash);

  const messageEvent = receipt?.logs.find((log: any) => {
    try {
      const parsed = edge.interface.parseLog(log);
      return parsed?.name === "MessageSent";
    } catch {
      return false;
    }
  });

  if (messageEvent) {
    const parsed = edge.interface.parseLog(messageEvent);
    console.log("LZ GUID:", parsed?.args.guid);
  }

  const status = await edge.getInvoiceStatus(paymentId);
  const statusNames = ["None", "Pending", "Settled"];
  console.log("Invoice status:", statusNames[status]);

  console.log("\nTrack at: https://layerzeroscan.com/tx/" + tx.hash);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });

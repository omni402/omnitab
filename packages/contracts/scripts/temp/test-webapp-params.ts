import { ethers } from "hardhat";
import "dotenv/config";

async function main() {
  // Use test taker wallet - same as web app user
  const takerKey = process.env.TAKER_PRIVATE_KEY_TEST!;
  const provider = ethers.provider;
  const taker = new ethers.Wallet(takerKey, provider);

  const EDGE_PAYMENT = process.env.ARBITRUM_EDGE_ADDRESS!;
  const ARB = "0x912CE59144191C1204E64559FE8253a0e49E6548";

  console.log("Testing with exact web app params...");
  console.log("Taker:", taker.address);

  const edge = await ethers.getContractAt("EdgePayment", EDGE_PAYMENT);

  // Exact params from web app logs
  const paymentId = "0x3078643261323635343135313862653238303261343163303239656537393433";
  const merchant = "0xd2a26541518be2802a41c029ee7943994b996763";
  const amount = 100000n;
  const fee = 700n;
  const tokenAddress = ARB;
  const tokenAmount = 604200000000000000n;

  console.log("\nParams:");
  console.log("  paymentId:", paymentId);
  console.log("  merchant:", merchant);
  console.log("  amount:", amount.toString());
  console.log("  fee:", fee.toString());
  console.log("  tokenAddress:", tokenAddress);
  console.log("  tokenAmount:", tokenAmount.toString());

  // Get LZ quote
  const lzFee = await edge.quote(paymentId, merchant, amount, fee);
  console.log("\nLZ fee:", ethers.formatEther(lzFee.nativeFee), "ETH");

  // Try to estimate gas
  console.log("\nEstimating gas...");
  try {
    const gasEstimate = await edge.pay.estimateGas(
      paymentId,
      merchant,
      amount,
      fee,
      tokenAddress,
      tokenAmount,
      { value: lzFee.nativeFee, from: taker.address }
    );
    console.log("Gas estimate:", gasEstimate.toString());
  } catch (e: any) {
    console.log("Gas estimation failed:", e.message);

    // Try static call
    try {
      await edge.connect(taker).pay.staticCall(
        paymentId,
        merchant,
        amount,
        fee,
        tokenAddress,
        tokenAmount,
        { value: lzFee.nativeFee }
      );
      console.log("Static call succeeded");
    } catch (e2: any) {
      console.log("\nStatic call error:", e2.message);
      if (e2.data) {
        console.log("Error data:", e2.data);
      }
    }
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });

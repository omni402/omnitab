import { ethers } from "hardhat";
import "dotenv/config";

async function main() {
  const [deployer] = await ethers.getSigners();

  const EDGE_PAYMENT = process.env.ARBITRUM_EDGE_ADDRESS!;
  const ARB = "0x912CE59144191C1204E64559FE8253a0e49E6548";
  const USDC = process.env.ARBITRUM_USDC_ADDRESS!;

  console.log("Testing payment with ARB...");
  console.log("EdgePayment:", EDGE_PAYMENT);
  console.log("Deployer:", deployer.address);

  const edge = await ethers.getContractAt("EdgePayment", EDGE_PAYMENT);
  const arb = await ethers.getContractAt("IERC20", ARB);

  // Check balances
  const arbBalance = await arb.balanceOf(deployer.address);
  console.log("\nARB balance:", ethers.formatUnits(arbBalance, 18));

  // Check swap order is set
  const swapOrder = await edge.swapOrder();
  console.log("\nSwap order maker:", swapOrder.maker);
  console.log("Swap tokenIn:", await edge.swapTokenIn());
  console.log("Swap tokenOut:", await edge.swapTokenOut());

  // Try to estimate gas for a small payment
  const paymentId = ethers.keccak256(ethers.toUtf8Bytes("test-" + Date.now()));
  const merchant = deployer.address;
  const amount = ethers.parseUnits("0.001", 6); // 0.001 USDC worth
  const fee = ethers.parseUnits("0.0001", 6);

  // For ARB, we need more tokens (ARB is ~$0.8, so need ~1.25 ARB per USDC)
  // total = amount + fee = 0.0011 USDC, need ~0.0014 ARB
  const arbAmount = ethers.parseUnits("0.01", 18); // 0.01 ARB (plenty of buffer)

  // Approve
  const allowance = await arb.allowance(deployer.address, EDGE_PAYMENT);
  if (allowance < arbAmount) {
    console.log("\nApproving ARB...");
    const tx = await arb.approve(EDGE_PAYMENT, ethers.MaxUint256);
    await tx.wait();
    console.log("Approved");
  }

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
      ARB,
      arbAmount,
      { value: lzFee.nativeFee }
    );
    console.log("Gas estimate:", gasEstimate.toString());
  } catch (e: any) {
    console.log("Gas estimation failed:", e.message);

    // Try to get more details
    try {
      await edge.pay.staticCall(
        paymentId,
        merchant,
        amount,
        fee,
        ARB,
        arbAmount,
        { value: lzFee.nativeFee }
      );
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

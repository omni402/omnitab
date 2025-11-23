import { ethers } from "hardhat";
import "dotenv/config";

async function main() {
  // Use test taker wallet
  const takerKey = process.env.TAKER_PRIVATE_KEY_TEST!;
  const provider = ethers.provider;
  const taker = new ethers.Wallet(takerKey, provider);

  const EDGE_PAYMENT = process.env.ARBITRUM_EDGE_ADDRESS!;
  const ARB = "0x912CE59144191C1204E64559FE8253a0e49E6548";
  const USDC = process.env.ARBITRUM_USDC_ADDRESS!;

  console.log("Actual swap test with taker wallet...");
  console.log("EdgePayment:", EDGE_PAYMENT);
  console.log("Taker:", taker.address);

  const edge = await ethers.getContractAt("EdgePayment", EDGE_PAYMENT);
  const arb = await ethers.getContractAt("IERC20", ARB);
  const usdc = await ethers.getContractAt("IERC20", USDC);

  // Check balances before
  const arbBalanceBefore = await arb.balanceOf(taker.address);
  const usdcBalanceBefore = await usdc.balanceOf(taker.address);
  const ethBalanceBefore = await provider.getBalance(taker.address);

  console.log("\nBalances before:");
  console.log("  ARB:", ethers.formatUnits(arbBalanceBefore, 18));
  console.log("  USDC:", ethers.formatUnits(usdcBalanceBefore, 6));
  console.log("  ETH:", ethers.formatEther(ethBalanceBefore));

  // Payment params
  const paymentId = ethers.keccak256(ethers.toUtf8Bytes("test-" + Date.now()));
  const merchant = "0xF54ec0f6996b46B71B8D0c05F8430D2e8eD9413c"; // deployer
  const amount = ethers.parseUnits("0.1", 6); // 0.1 USDC
  const fee = ethers.parseUnits("0.001", 6);
  const arbAmount = ethers.parseUnits("0.2", 18); // 0.2 ARB

  // Approve ARB
  const allowance = await arb.allowance(taker.address, EDGE_PAYMENT);
  if (allowance < arbAmount) {
    console.log("\nApproving ARB...");
    const tx = await arb.connect(taker).approve(EDGE_PAYMENT, ethers.MaxUint256);
    await tx.wait();
    console.log("Approved:", tx.hash);
  }

  // Get LZ quote
  const lzFee = await edge.quote(paymentId, merchant, amount, fee);
  console.log("\nLZ fee:", ethers.formatEther(lzFee.nativeFee), "ETH");

  // Execute payment
  console.log("\nExecuting payment...");
  const tx = await edge.connect(taker).pay(
    paymentId,
    merchant,
    amount,
    fee,
    ARB,
    arbAmount,
    { value: lzFee.nativeFee }
  );
  console.log("Tx hash:", tx.hash);

  const receipt = await tx.wait();
  console.log("Gas used:", receipt?.gasUsed.toString());

  // Check balances after
  const arbBalanceAfter = await arb.balanceOf(taker.address);
  const usdcBalanceAfter = await usdc.balanceOf(taker.address);

  console.log("\nBalances after:");
  console.log("  ARB:", ethers.formatUnits(arbBalanceAfter, 18));
  console.log("  USDC:", ethers.formatUnits(usdcBalanceAfter, 6));
  console.log("\nARB spent:", ethers.formatUnits(arbBalanceBefore - arbBalanceAfter, 18));
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });

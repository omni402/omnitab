import { ethers } from "hardhat";
import "dotenv/config";

async function main() {
  const edge = await ethers.getContractAt("EdgePayment", "0x8c88c82ae8a2dB2142520d6725E3b4f863dD0cFf");
  const arb = await ethers.getContractAt("IERC20", "0x912CE59144191C1204E64559FE8253a0e49E6548");

  // Check swap order
  const swapOrder = await edge.swapOrder();
  console.log("Swap order maker:", swapOrder.maker);
  console.log("Swap tokenIn:", await edge.swapTokenIn());
  console.log("Swap tokenOut:", await edge.swapTokenOut());

  // Check user's ARB balance and allowance
  const user = "0xd2274D8c6Aa96Fbe9cEa3612fE5c4CA619c380ad";
  const balance = await arb.balanceOf(user);
  const allowance = await arb.allowance(user, "0x8c88c82ae8a2dB2142520d6725E3b4f863dD0cFf");
  console.log("\nUser ARB balance:", ethers.formatUnits(balance, 18));
  console.log("User ARB allowance to Edge:", ethers.formatUnits(allowance, 18));

  // Try to estimate gas from user's perspective
  const paymentId = ethers.keccak256(ethers.toUtf8Bytes("test-" + Date.now()));
  const merchant = "0xF54ec0f6996b46B71B8D0c05F8430D2e8eD9413c";
  const amount = ethers.parseUnits("0.1", 6); // 0.1 USDC
  const fee = ethers.parseUnits("0.001", 6);
  const arbAmount = ethers.parseUnits("0.2", 18); // 0.2 ARB

  console.log("\nTrying to estimate gas for user...");
  try {
    // We can't actually call from user, but we can check if they have enough balance
    if (balance < arbAmount) {
      console.log("User has insufficient ARB balance!");
      console.log("Need:", ethers.formatUnits(arbAmount, 18));
      console.log("Have:", ethers.formatUnits(balance, 18));
    } else {
      console.log("User has sufficient ARB balance");
    }
  } catch (e: any) {
    console.log("Error:", e.message);
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });

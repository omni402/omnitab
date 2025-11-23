import { ethers } from "hardhat";
import "dotenv/config";

async function main() {
  const [deployer] = await ethers.getSigners();

  const EDGE_PAYMENT = process.env.ARBITRUM_EDGE_ADDRESS!;
  const OMNITAB_AMM = process.env.OMNITAB_AMM_ADDRESS!;

  const ARB = "0x912CE59144191C1204E64559FE8253a0e49E6548";
  const USDC = process.env.ARBITRUM_USDC_ADDRESS!;

  console.log("Setting swap order on EdgePayment...");
  console.log("EdgePayment:", EDGE_PAYMENT);

  // Build the order using OmniTabAMM
  const omniTabAMM = await ethers.getContractAt("OmniTabAMM", OMNITAB_AMM);

  const maker = deployer.address;
  const feeBpsIn = 10;
  const salt = 3n;

  // Order direction: taker sends ARB, receives USDC
  // So maker receives ARB, provides USDC
  const order = await omniTabAMM.buildProgram(
    maker,
    ARB,   // tokenA (what maker receives from taker)
    USDC,  // tokenB (what maker provides to taker)
    feeBpsIn,
    salt
  );

  console.log("\nOrder built:");
  console.log("  Maker:", order.maker);
  console.log("  Traits:", order.traits.toString());
  console.log("  Data length:", order.data.length, "bytes");

  // Set the swap order on EdgePayment
  const edge = await ethers.getContractAt("EdgePayment", EDGE_PAYMENT);

  const tx = await edge.setSwapOrder(
    order.maker,
    order.traits,
    order.data,
    ARB,   // tokenIn (what EdgePayment sends)
    USDC   // tokenOut (what EdgePayment receives)
  );
  await tx.wait();

  console.log("\nSwap order set:", tx.hash);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });

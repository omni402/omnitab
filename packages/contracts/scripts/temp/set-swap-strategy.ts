import { ethers } from "hardhat";

async function main() {
  const [deployer] = await ethers.getSigners();
  
  const EDGE_PAYMENT = "0xCbe67998afBA63A46B29467B827868906350549d";
  
  const edge = await ethers.getContractAt("EdgePayment", EDGE_PAYMENT);
  
  // Strategy parameters from deploy-swapvm-strategy
  const maker = "0xF54ec0f6996b46B71B8D0c05F8430D2e8eD9413c";
  const token0 = "0x912CE59144191C1204E64559FE8253a0e49E6548"; // ARB
  const token1 = "0xaf88d065e77c8cC2239327C5EDb3A432268e5831"; // USDC
  const feeBps = 10;
  const salt = "0x0000000000000000000000000000000000000000000000000000000000000003";
  
  console.log("Setting swap strategy on EdgePayment...");
  const tx = await edge.setSwapStrategy(maker, token0, token1, feeBps, salt);
  await tx.wait();
  console.log("Done:", tx.hash);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });

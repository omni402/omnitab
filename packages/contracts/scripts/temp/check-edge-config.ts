import { ethers } from "hardhat";

async function main() {
  const EDGE = "0xCbe67998afBA63A46B29467B827868906350549d";
  const ARB = "0x912CE59144191C1204E64559FE8253a0e49E6548";
  const WETH = "0x82aF49447D8a07e3bd95BD0d56f35241523fBab1";

  const edge = await ethers.getContractAt("EdgePayment", EDGE);

  const arbSupported = await edge.supportedTokens(ARB);
  const wethSupported = await edge.supportedTokens(WETH);

  console.log("ARB supported:", arbSupported);
  console.log("WETH supported:", wethSupported);

  const strategy = await edge.swapStrategy();
  console.log("\nSwap strategy:");
  console.log("  maker:", strategy.maker);
  console.log("  token0:", strategy.token0);
  console.log("  token1:", strategy.token1);
  console.log("  feeBps:", strategy.feeBps.toString());
  console.log("  salt:", strategy.salt);

  // Set ARB and WETH as supported if not already
  if (!arbSupported) {
    console.log("\nSetting ARB as supported...");
    const tx = await edge.setSupportedToken(ARB, true);
    await tx.wait();
    console.log("ARB supported:", tx.hash);
  }

  if (!wethSupported) {
    console.log("\nSetting WETH as supported...");
    const tx = await edge.setSupportedToken(WETH, true);
    await tx.wait();
    console.log("WETH supported:", tx.hash);
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });

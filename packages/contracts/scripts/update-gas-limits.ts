import { ethers } from "hardhat";
import "dotenv/config";

async function main() {
  const [deployer] = await ethers.getSigners();

  const network = await ethers.provider.getNetwork();
  console.log("Network:", network.name, "ChainId:", network.chainId);

  if (Number(network.chainId) !== 42161) {
    throw new Error("This script is only for Arbitrum");
  }

  const EDGE_ADDRESS = process.env.ARBITRUM_EDGE_ADDRESS!;

  const edge = await ethers.getContractAt(
    [
      "function lzGasLimit() view returns (uint128)",
      "function lzComposeGasLimit() view returns (uint128)",
      "function setLzGasLimit(uint128) external",
      "function setLzComposeGasLimit(uint128) external",
    ],
    EDGE_ADDRESS
  );

  const currentGasLimit = await edge.lzGasLimit();
  const currentComposeGasLimit = await edge.lzComposeGasLimit();

  console.log("\nCurrent gas limits:");
  console.log("  lzGasLimit:", currentGasLimit.toString());
  console.log("  lzComposeGasLimit:", currentComposeGasLimit.toString());

  // Increase compose gas limit
  const newComposeGasLimit = 500000;

  if (Number(currentComposeGasLimit) < newComposeGasLimit) {
    console.log("\nIncreasing lzComposeGasLimit to", newComposeGasLimit);
    const tx = await edge.setLzComposeGasLimit(newComposeGasLimit);
    await tx.wait();
    console.log("Done!");

    const updated = await edge.lzComposeGasLimit();
    console.log("New lzComposeGasLimit:", updated.toString());
  } else {
    console.log("\nGas limit already sufficient");
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });

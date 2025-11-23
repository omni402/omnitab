import { ethers } from "hardhat";

async function main() {
  const HUB_ADDRESS = "0x78f0d4741f6d4a37a5f1448577f69bC1df74a349";

  const hub = await ethers.getContractAt(
    ["function settlementPool() view returns (address)"],
    HUB_ADDRESS
  );

  const pool = await hub.settlementPool();
  console.log("Hub settlementPool address:", pool);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });

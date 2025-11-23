import { ethers } from "hardhat";
import "dotenv/config";

async function main() {
  const [deployer] = await ethers.getSigners();
  console.log("Deploying with:", deployer.address);

  const network = await ethers.provider.getNetwork();
  console.log("Network:", network.name, "ChainId:", network.chainId);

  if (Number(network.chainId) !== 8453) {
    throw new Error("This script is only for Base mainnet");
  }

  const USDC = "0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913";
  const LZ_ENDPOINT = "0x1a44076050125825900e736c501f859c50fE728c";
  const POOL_ADDRESS = process.env.BASE_POOL_ADDRESS!;
  const ARBITRUM_EDGE = process.env.ARBITRUM_EDGE_ADDRESS!;
  const ARBITRUM_EID = 30110;

  console.log("\nUsing existing pool:", POOL_ADDRESS);

  console.log("\nDeploying new OmniTabHub...");
  const OmniTabHub = await ethers.getContractFactory("OmniTabHub");
  const hub = await OmniTabHub.deploy(
    LZ_ENDPOINT,
    deployer.address,
    USDC,
    POOL_ADDRESS
  );
  await hub.waitForDeployment();
  const hubAddress = await hub.getAddress();
  console.log("OmniTabHub:", hubAddress);

  // Update pool to use new hub
  console.log("\nUpdating pool to use new hub...");
  const pool = await ethers.getContractAt(
    ["function setHub(address) external"],
    POOL_ADDRESS
  );
  await pool.setHub(hubAddress);
  console.log("Hub set in pool");

  // Set trusted edge for Arbitrum
  console.log("\nSetting trusted edge for Arbitrum...");
  await hub.setTrustedEdge(ARBITRUM_EID, true);
  console.log("Arbitrum edge trusted");

  // Set peer for Arbitrum EdgePayment
  console.log("\nSetting peer for Arbitrum...");
  const peerBytes32 = ethers.zeroPadValue(ARBITRUM_EDGE, 32);
  await hub.setPeer(ARBITRUM_EID, peerBytes32);
  console.log("Peer set for Arbitrum:", ARBITRUM_EDGE);

  // Fund hub with some ETH for return messages
  console.log("\nFunding hub with ETH for return messages...");
  const tx = await deployer.sendTransaction({
    to: hubAddress,
    value: ethers.parseEther("0.001"),
  });
  await tx.wait();
  console.log("Hub funded with 0.001 ETH");

  console.log("\n=== Update .env ===");
  console.log(`BASE_HUB_ADDRESS=${hubAddress}`);

  console.log("\n=== Wire EdgePayment on Arbitrum ===");
  console.log(`npx hardhat run scripts/wire-peers.ts --network arbitrum`);

  console.log("\nDone!");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });

import { ethers } from "hardhat";
import "dotenv/config";

async function main() {
  const HUB_ADDRESS = process.env.BASE_HUB_ADDRESS!;
  const EDGE_ADDRESS = process.env.ARBITRUM_EDGE_ADDRESS!;
  const ARBITRUM_EID = 30110;
  const BASE_EID = 30184;

  const network = await ethers.provider.getNetwork();
  console.log("Network:", network.name, "ChainId:", network.chainId);

  if (Number(network.chainId) === 8453) {
    // Check Hub's peer for Arbitrum
    console.log("\nChecking Hub peer configuration...");
    console.log("Hub:", HUB_ADDRESS);
    console.log("Expected Edge:", EDGE_ADDRESS);

    const hub = await ethers.getContractAt(
      [
        "function peers(uint32) view returns (bytes32)",
        "function trustedEdges(uint32) view returns (bool)",
      ],
      HUB_ADDRESS
    );

    const peer = await hub.peers(ARBITRUM_EID);
    const expectedPeer = ethers.zeroPadValue(EDGE_ADDRESS, 32);

    console.log("\nHub peer for Arbitrum (30110):", peer);
    console.log("Expected:", expectedPeer);
    console.log("Match:", peer === expectedPeer);

    const trusted = await hub.trustedEdges(ARBITRUM_EID);
    console.log("Trusted edge:", trusted);
  } else if (Number(network.chainId) === 42161) {
    // Check Edge's peer for Base
    console.log("\nChecking Edge peer configuration...");
    console.log("Edge:", EDGE_ADDRESS);
    console.log("Expected Hub:", HUB_ADDRESS);

    const edge = await ethers.getContractAt(
      ["function peers(uint32) view returns (bytes32)"],
      EDGE_ADDRESS
    );

    const peer = await edge.peers(BASE_EID);
    const expectedPeer = ethers.zeroPadValue(HUB_ADDRESS, 32);

    console.log("\nEdge peer for Base (30184):", peer);
    console.log("Expected:", expectedPeer);
    console.log("Match:", peer === expectedPeer);
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });

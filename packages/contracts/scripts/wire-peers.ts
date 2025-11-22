import { ethers } from "hardhat";
import "dotenv/config";

const ADDRESSES = {
  base: {
    hub: process.env.BASE_HUB_ADDRESS!,
  },
  arbitrum: {
    edge: process.env.ARBITRUM_EDGE_ADDRESS!,
  },
};

const EID = {
  base: Number(process.env.BASE_EID),
  arbitrum: Number(process.env.ARBITRUM_EID),
};

async function main() {
  const [deployer] = await ethers.getSigners();
  const network = await ethers.provider.getNetwork();

  console.log("Wiring peers on", network.name);

  if (network.chainId === 8453n) {
    const hub = await ethers.getContractAt("OmniTabHub", ADDRESSES.base.hub);
    const peerBytes = ethers.zeroPadValue(ADDRESSES.arbitrum.edge, 32);

    let tx = await hub.setPeer(EID.arbitrum, peerBytes);
    await tx.wait();
    console.log("Peer set:", tx.hash);

    tx = await hub.setTrustedEdge(EID.arbitrum, true);
    await tx.wait();
    console.log("Edge trusted:", tx.hash);

  } else if (network.chainId === 42161n) {
    const edge = await ethers.getContractAt("EdgePayment", ADDRESSES.arbitrum.edge);
    const peerBytes = ethers.zeroPadValue(ADDRESSES.base.hub, 32);

    const tx = await edge.setPeer(EID.base, peerBytes);
    await tx.wait();
    console.log("Peer set:", tx.hash);

  } else {
    throw new Error(`Unknown network: ${network.chainId}`);
  }

  console.log("Done!");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });

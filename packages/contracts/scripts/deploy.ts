import { ethers } from "hardhat";

async function main() {
  const [deployer] = await ethers.getSigners();
  console.log("Deploying contracts with account:", deployer.address);

  const network = await ethers.provider.getNetwork();
  console.log("Network:", network.name, "ChainId:", network.chainId);

  // Network-specific configuration
  const config: Record<number, {
    usdc: string;
    lzEndpoint: string;
    hubEid?: number;
  }> = {
    // Base Sepolia
    84532: {
      usdc: "0x036CbD53842c5426634e7929541eC2318f3dCF7e",
      lzEndpoint: "0x6EDCE65403992e310A62460808c4b910D972f10f",
    },
    // Arbitrum Sepolia
    421614: {
      usdc: "0x75faf114eafb1BDbe2F0316DF893fd58CE46AA4d",
      lzEndpoint: "0x6EDCE65403992e310A62460808c4b910D972f10f",
      hubEid: 40245, // Base Sepolia EID
    },
    // Polygon Amoy
    80002: {
      usdc: "0x41E94Eb019C0762f9Bfcf9Fb1E58725BfB0e7582",
      lzEndpoint: "0x6EDCE65403992e310A62460808c4b910D972f10f",
      hubEid: 40245, // Base Sepolia EID
    },
  };

  const networkConfig = config[Number(network.chainId)];
  if (!networkConfig) {
    throw new Error(`Unsupported network: ${network.chainId}`);
  }

  // Deploy based on network type
  if (network.chainId === 84532n) {
    // Base Sepolia - Deploy Hub and Settlement Pool
    console.log("\nDeploying Settlement Pool...");
    const poolCap = ethers.parseUnits("100000", 6); // 100k USDC cap
    const SettlementPool = await ethers.getContractFactory("SettlementPool");
    const pool = await SettlementPool.deploy(networkConfig.usdc, poolCap);
    await pool.waitForDeployment();
    console.log("SettlementPool deployed to:", await pool.getAddress());

    console.log("\nDeploying OmniTab Hub...");
    const OmniTabHub = await ethers.getContractFactory("OmniTabHub");
    const hub = await OmniTabHub.deploy(
      networkConfig.lzEndpoint,
      deployer.address,
      networkConfig.usdc,
      await pool.getAddress()
    );
    await hub.waitForDeployment();
    console.log("OmniTabHub deployed to:", await hub.getAddress());

    // Set hub in pool
    console.log("\nSetting hub in settlement pool...");
    await pool.setHub(await hub.getAddress());
    console.log("Hub set successfully");

  } else {
    // Edge chains - Deploy EdgePayment
    console.log("\nDeploying Edge Payment...");
    const EdgePayment = await ethers.getContractFactory("EdgePayment");
    const edge = await EdgePayment.deploy(
      networkConfig.lzEndpoint,
      deployer.address,
      networkConfig.usdc,
      networkConfig.hubEid!
    );
    await edge.waitForDeployment();
    console.log("EdgePayment deployed to:", await edge.getAddress());
  }

  console.log("\nDeployment complete!");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });

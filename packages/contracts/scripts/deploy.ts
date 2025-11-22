import { ethers } from "hardhat";

async function main() {
  const [deployer] = await ethers.getSigners();
  console.log("Deploying with:", deployer.address);

  const network = await ethers.provider.getNetwork();
  console.log("Network:", network.name, "ChainId:", network.chainId);

  const config: Record<number, {
    usdc: string;
    lzEndpoint: string;
    hubEid?: number;
    isHub?: boolean;
  }> = {
    8453: {
      usdc: "0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913",
      lzEndpoint: "0x1a44076050125825900e736c501f859c50fE728c",
      isHub: true,
    },
    42161: {
      usdc: "0xaf88d065e77c8cC2239327C5EDb3A432268e5831",
      lzEndpoint: "0x1a44076050125825900e736c501f859c50fE728c",
      hubEid: 30184,
    },
    137: {
      usdc: "0x3c499c542cEF5E3811e1192ce70d8cC03d5c3359",
      lzEndpoint: "0x1a44076050125825900e736c501f859c50fE728c",
      hubEid: 30184,
    },
    84532: {
      usdc: "0x036CbD53842c5426634e7929541eC2318f3dCF7e",
      lzEndpoint: "0x6EDCE65403992e310A62460808c4b910D972f10f",
      isHub: true,
    },
    421614: {
      usdc: "0x75faf114eafb1BDbe2F0316DF893fd58CE46AA4d",
      lzEndpoint: "0x6EDCE65403992e310A62460808c4b910D972f10f",
      hubEid: 40245,
    },
    80002: {
      usdc: "0x41E94Eb019C0762f9Bfcf9Fb1E58725BfB0e7582",
      lzEndpoint: "0x6EDCE65403992e310A62460808c4b910D972f10f",
      hubEid: 40245,
    },
  };

  const networkConfig = config[Number(network.chainId)];
  if (!networkConfig) {
    throw new Error(`Unsupported network: ${network.chainId}`);
  }

  if (networkConfig.isHub) {
    console.log("\nDeploying SettlementPool...");
    const poolCap = ethers.parseUnits("100000", 6);
    const SettlementPool = await ethers.getContractFactory("SettlementPool");
    const pool = await SettlementPool.deploy(networkConfig.usdc, poolCap);
    await pool.waitForDeployment();
    console.log("SettlementPool:", await pool.getAddress());

    console.log("\nDeploying OmniTabHub...");
    const OmniTabHub = await ethers.getContractFactory("OmniTabHub");
    const hub = await OmniTabHub.deploy(
      networkConfig.lzEndpoint,
      deployer.address,
      networkConfig.usdc,
      await pool.getAddress()
    );
    await hub.waitForDeployment();
    console.log("OmniTabHub:", await hub.getAddress());

    await pool.setHub(await hub.getAddress());
    console.log("Hub set in pool");
  } else {
    console.log("\nDeploying EdgePayment...");
    const EdgePayment = await ethers.getContractFactory("EdgePayment");
    const edge = await EdgePayment.deploy(
      networkConfig.lzEndpoint,
      deployer.address,
      networkConfig.usdc,
      networkConfig.hubEid!
    );
    await edge.waitForDeployment();
    console.log("EdgePayment:", await edge.getAddress());
  }

  console.log("\nDone!");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });

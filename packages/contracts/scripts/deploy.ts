import { ethers } from "hardhat";

async function main() {
  const [deployer] = await ethers.getSigners();
  console.log("Deploying with:", deployer.address);

  const network = await ethers.provider.getNetwork();
  console.log("Network:", network.name, "ChainId:", network.chainId);

  const SWAPVM_ROUTER = "0x8fdd04dbf6111437b44bbca99c28882434e0958f";

  const config: Record<number, {
    usdc: string;
    lzEndpoint: string;
    hubEid?: number;
    isHub?: boolean;
    swapVM?: string;
    supportedTokens?: string[];
  }> = {
    // Base (Hub)
    8453: {
      usdc: "0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913",
      lzEndpoint: "0x1a44076050125825900e736c501f859c50fE728c",
      isHub: true,
    },
    // Arbitrum (Edge)
    42161: {
      usdc: "0xaf88d065e77c8cC2239327C5EDb3A432268e5831",
      lzEndpoint: "0x1a44076050125825900e736c501f859c50fE728c",
      hubEid: 30184,
      swapVM: SWAPVM_ROUTER,
      supportedTokens: [
        "0x912CE59144191C1204E64559FE8253a0e49E6548", // ARB
        "0x82aF49447D8a07e3bd95BD0d56f35241523fBab1", // WETH
      ],
    },
    // Polygon (Edge)
    137: {
      usdc: "0x3c499c542cEF5E3811e1192ce70d8cC03d5c3359",
      lzEndpoint: "0x1a44076050125825900e736c501f859c50fE728c",
      hubEid: 30184,
      swapVM: SWAPVM_ROUTER,
      supportedTokens: [
        "0x0d500B1d8E8eF31E21C99d1Db9A6444d3ADf1270", // WMATIC
      ],
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
      networkConfig.hubEid!,
      networkConfig.swapVM!
    );
    await edge.waitForDeployment();
    const edgeAddress = await edge.getAddress();
    console.log("EdgePayment:", edgeAddress);

    // Set supported tokens
    if (networkConfig.supportedTokens && networkConfig.supportedTokens.length > 0) {
      console.log("\nSetting supported tokens...");
      for (const token of networkConfig.supportedTokens) {
        await edge.setSupportedToken(token, true);
        console.log("  Added:", token);
      }
    }
  }

  console.log("\nDone!");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });

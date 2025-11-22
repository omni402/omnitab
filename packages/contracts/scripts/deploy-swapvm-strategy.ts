import { ethers } from "hardhat";
import "dotenv/config";

const AQUA_ADDRESS = process.env.AQUA_ADDRESS!;
const SWAPVM_ROUTER = process.env.SWAPVM_ROUTER_ADDRESS!;

const TOKENS = {
  ARB: "0x912CE59144191C1204E64559FE8253a0e49E6548",
  USDC: process.env.ARBITRUM_USDC_ADDRESS!,
};

async function main() {
  const [deployer] = await ethers.getSigners();
  const network = await ethers.provider.getNetwork();

  if (network.chainId !== 42161n) {
    throw new Error("This script must run on Arbitrum (chainId 42161)");
  }

  console.log("Deploying SwapVM Strategy");
  console.log("Deployer:", deployer.address);

  const existingAMM = process.env.OMNITAB_AMM_ADDRESS;
  let omniTabAMM;
  let ammAddress;

  if (existingAMM) {
    omniTabAMM = await ethers.getContractAt("OmniTabAMM", existingAMM);
    ammAddress = existingAMM;
    console.log("Using existing OmniTabAMM:", ammAddress);
  } else {
    const OmniTabAMM = await ethers.getContractFactory("OmniTabAMM");
    omniTabAMM = await OmniTabAMM.deploy(AQUA_ADDRESS);
    await omniTabAMM.waitForDeployment();
    ammAddress = await omniTabAMM.getAddress();
    console.log("OmniTabAMM deployed:", ammAddress);
  }

  const aqua = await ethers.getContractAt("@1inch/aqua/src/interfaces/IAqua.sol:IAqua", AQUA_ADDRESS);
  const arb = await ethers.getContractAt("IERC20", TOKENS.ARB);
  const usdc = await ethers.getContractAt("IERC20", TOKENS.USDC);

  const arbBalance = await arb.balanceOf(deployer.address);
  const usdcBalance = await usdc.balanceOf(deployer.address);
  console.log("ARB:", ethers.formatUnits(arbBalance, 18));
  console.log("USDC:", ethers.formatUnits(usdcBalance, 6));

  const feeBpsIn = 10;
  const salt = 1n;

  const order = await omniTabAMM.buildProgram(
    deployer.address,
    TOKENS.ARB,
    TOKENS.USDC,
    feeBpsIn,
    salt
  );
  console.log("\nProgram built");
  console.log("Maker:", order.maker);
  console.log("Program length:", order.data.length, "bytes");

  const arbLiquidity = ethers.parseUnits("5", 18);
  const usdcLiquidity = ethers.parseUnits("1", 6);

  const arbAllowance = await arb.allowance(deployer.address, AQUA_ADDRESS);
  if (arbAllowance < arbLiquidity) {
    const tx = await arb.approve(AQUA_ADDRESS, ethers.MaxUint256);
    await tx.wait();
    console.log("ARB approved");
  }

  const usdcAllowance = await usdc.allowance(deployer.address, AQUA_ADDRESS);
  if (usdcAllowance < usdcLiquidity) {
    const tx = await usdc.approve(AQUA_ADDRESS, ethers.MaxUint256);
    await tx.wait();
    console.log("USDC approved");
  }

  console.log("\nShipping liquidity to Aqua...");
  console.log("ARB:", ethers.formatUnits(arbLiquidity, 18));
  console.log("USDC:", ethers.formatUnits(usdcLiquidity, 6));

  const orderStruct = {
    maker: order.maker,
    traits: order.traits,
    data: order.data
  };

  const encodedOrder = ethers.AbiCoder.defaultAbiCoder().encode(
    ["tuple(address maker, uint256 traits, bytes data)"],
    [orderStruct]
  );

  const shipTx = await aqua.ship(
    SWAPVM_ROUTER,
    encodedOrder,
    [TOKENS.ARB, TOKENS.USDC],
    [arbLiquidity, usdcLiquidity]
  );
  const receipt = await shipTx.wait();
  console.log("Shipped:", receipt?.hash);

  const strategyHash = ethers.keccak256(encodedOrder);
  console.log("\nOmniTabAMM:", ammAddress);
  console.log("Strategy Hash:", strategyHash);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });

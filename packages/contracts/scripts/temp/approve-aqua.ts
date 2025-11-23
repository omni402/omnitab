import { ethers } from "hardhat";
import "dotenv/config";

async function main() {
  const [deployer] = await ethers.getSigners();

  const AQUA = process.env.AQUA_ADDRESS!;
  const USDC = process.env.ARBITRUM_USDC_ADDRESS!;

  const usdc = await ethers.getContractAt("IERC20", USDC);

  // Check current allowance
  const allowance = await usdc.allowance(deployer.address, AQUA);
  console.log("Current USDC allowance to Aqua:", ethers.formatUnits(allowance, 6));

  if (allowance < ethers.parseUnits("1000", 6)) {
    console.log("Approving USDC to Aqua...");
    const tx = await usdc.approve(AQUA, ethers.MaxUint256);
    await tx.wait();
    console.log("Approved:", tx.hash);
  } else {
    console.log("Already approved");
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });

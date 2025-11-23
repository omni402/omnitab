import { ethers } from "hardhat";
import "dotenv/config";

async function main() {
  const [deployer] = await ethers.getSigners();
  console.log("Funding pool with account:", deployer.address);

  const POOL_ADDRESS = ethers.getAddress(process.env.BASE_POOL_ADDRESS!);
  const USDC_ADDRESS = ethers.getAddress(process.env.BASE_USDC_ADDRESS!);

  // Amount to deposit (1 USDC = 1_000_000)
  const depositAmount = 5_000_000n; // 5 USDC

  // Get USDC contract
  const usdc = await ethers.getContractAt(
    ["function approve(address,uint256) returns (bool)", "function balanceOf(address) view returns (uint256)"],
    USDC_ADDRESS
  );

  // Get Pool contract
  const pool = await ethers.getContractAt(
    ["function deposit(uint256) external", "function totalLiquidity() view returns (uint256)"],
    POOL_ADDRESS
  );

  // Check current liquidity
  const currentLiquidity = await pool.totalLiquidity();
  console.log("Current pool liquidity:", currentLiquidity.toString(), "USDC (6 decimals)");

  // Check deployer USDC balance
  const balance = await usdc.balanceOf(deployer.address);
  console.log("Deployer USDC balance:", balance.toString());

  if (balance < depositAmount) {
    console.log("Insufficient USDC balance to fund pool!");
    return;
  }

  // Approve USDC
  console.log("Approving USDC...");
  const approveTx = await usdc.approve(POOL_ADDRESS, depositAmount);
  await approveTx.wait();
  console.log("Approved");

  // Deposit
  console.log("Depositing", depositAmount.toString(), "USDC...");
  const depositTx = await pool.deposit(depositAmount);
  await depositTx.wait();
  console.log("Deposited!");

  // Check new liquidity
  const newLiquidity = await pool.totalLiquidity();
  console.log("New pool liquidity:", newLiquidity.toString(), "USDC");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });

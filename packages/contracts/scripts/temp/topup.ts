import { ethers } from "hardhat";
import "dotenv/config";

const ADDRESSES = {
  base: {
    pool: process.env.BASE_POOL_ADDRESS!,
    hub: process.env.BASE_HUB_ADDRESS!,
    usdc: process.env.BASE_USDC_ADDRESS!,
  },
  arbitrum: {
    edge: process.env.ARBITRUM_EDGE_ADDRESS!,
    usdc: process.env.ARBITRUM_USDC_ADDRESS!,
  },
};

async function main() {
  const [deployer] = await ethers.getSigners();
  const network = await ethers.provider.getNetwork();

  console.log("Topup on", network.name, "ChainId:", network.chainId);
  console.log("Account:", deployer.address);

  if (network.chainId === 8453n) {
    const usdc = await ethers.getContractAt("IERC20", ADDRESSES.base.usdc);
    const pool = await ethers.getContractAt("SettlementPool", ADDRESSES.base.pool);

    const usdcBalance = await usdc.balanceOf(deployer.address);
    const poolLiquidity = await pool.totalLiquidity();

    console.log("Your USDC:", ethers.formatUnits(usdcBalance, 6));
    console.log("Pool liquidity:", ethers.formatUnits(poolLiquidity, 6));

    const depositAmount = ethers.parseUnits("10", 6);

    if (usdcBalance >= depositAmount) {
      console.log("\nDepositing $10 USDC...");
      let tx = await usdc.approve(ADDRESSES.base.pool, depositAmount);
      await tx.wait();
      console.log("Approved:", tx.hash);

      tx = await pool.deposit(depositAmount);
      await tx.wait();
      console.log("Deposited:", tx.hash);

      const newLiquidity = await pool.totalLiquidity();
      console.log("New pool liquidity:", ethers.formatUnits(newLiquidity, 6));
    } else {
      console.log("Insufficient USDC for deposit");
    }

    const hubEthBalance = await ethers.provider.getBalance(ADDRESSES.base.hub);
    console.log("\nHub ETH:", ethers.formatEther(hubEthBalance));

    const hubFundAmount = ethers.parseEther("0.001");
    if (hubEthBalance < hubFundAmount) {
      console.log("Funding hub with 0.001 ETH...");
      const tx = await deployer.sendTransaction({
        to: ADDRESSES.base.hub,
        value: hubFundAmount,
      });
      await tx.wait();
      console.log("Funded:", tx.hash);
    }

  } else if (network.chainId === 42161n) {
    const usdc = await ethers.getContractAt("IERC20", ADDRESSES.arbitrum.usdc);
    const edge = await ethers.getContractAt("EdgePayment", ADDRESSES.arbitrum.edge);

    const usdcBalance = await usdc.balanceOf(deployer.address);
    const vaultBalance = await edge.vault();

    console.log("Your USDC:", ethers.formatUnits(usdcBalance, 6));
    console.log("Edge vault:", ethers.formatUnits(vaultBalance, 6));

  } else {
    throw new Error(`Unknown network: ${network.chainId}`);
  }

  console.log("\nDone!");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });

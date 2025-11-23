import { ethers } from "hardhat";
import "dotenv/config";

async function main() {
  const maker = "0xF54ec0f6996b46B71B8D0c05F8430D2e8eD9413c";
  const aqua = "0x22D78cC3847b1dA7C3a48e6b95C6cB4BBCF5A187";
  const usdc = await ethers.getContractAt("IERC20", process.env.ARBITRUM_USDC_ADDRESS!);
  const arb = await ethers.getContractAt("IERC20", "0x912CE59144191C1204E64559FE8253a0e49E6548");

  console.log("Maker:", maker);
  console.log("USDC balance:", ethers.formatUnits(await usdc.balanceOf(maker), 6));
  console.log("ARB balance:", ethers.formatUnits(await arb.balanceOf(maker), 18));
  console.log("USDC allowance to Aqua:", ethers.formatUnits(await usdc.allowance(maker, aqua), 6));
  console.log("ARB allowance to Aqua:", ethers.formatUnits(await arb.allowance(maker, aqua), 18));
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });

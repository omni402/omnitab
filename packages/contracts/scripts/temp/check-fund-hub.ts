import { ethers } from "hardhat";
import "dotenv/config";

async function main() {
  const [deployer] = await ethers.getSigners();

  const HUB_ADDRESS = process.env.BASE_HUB_ADDRESS!;

  console.log("Hub address:", HUB_ADDRESS);

  // Check ETH balance
  const balance = await ethers.provider.getBalance(HUB_ADDRESS);
  console.log("Hub ETH balance:", ethers.formatEther(balance), "ETH");

  if (balance === 0n) {
    console.log("\nHub has no ETH! Funding with 0.002 ETH...");
    const tx = await deployer.sendTransaction({
      to: HUB_ADDRESS,
      value: ethers.parseEther("0.002"),
    });
    await tx.wait();
    console.log("Hub funded!");

    const newBalance = await ethers.provider.getBalance(HUB_ADDRESS);
    console.log("New Hub ETH balance:", ethers.formatEther(newBalance), "ETH");
  } else {
    console.log("\nHub has ETH. If you want to add more, run with --fund flag.");

    // Check if --fund flag is passed
    if (process.argv.includes("--fund")) {
      console.log("\nFunding with additional 0.002 ETH...");
      const tx = await deployer.sendTransaction({
        to: HUB_ADDRESS,
        value: ethers.parseEther("0.002"),
      });
      await tx.wait();
      const newBalance = await ethers.provider.getBalance(HUB_ADDRESS);
      console.log("New Hub ETH balance:", ethers.formatEther(newBalance), "ETH");
    }
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });

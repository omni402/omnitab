import { ethers } from "hardhat";

async function main() {
  const AQUA = "0x499943e74fb0ce105688beee8ef2abec5d936d31";
  const SWAPVM_ROUTER = "0x8fdd04dbf6111437b44bbca99c28882434e0958f";
  const ARB = "0x912CE59144191C1204E64559FE8253a0e49E6548";
  const USDC = "0xaf88d065e77c8cC2239327C5EDb3A432268e5831";
  const OMNITAB_SWAP = "0x3206c01e9fC86A0954A4B70aA4c60b807924300B";

  const [deployer] = await ethers.getSigners();

  // Get the strategy hash
  const MAKER = "0xF54ec0f6996b46B71B8D0c05F8430D2e8eD9413c";
  const FEE_BPS = 10;
  const SALT = "0x0000000000000000000000000000000000000000000000000000000000000003";

  const ammAddress = "0xc332C786B583c592C9B3831DD8406E533558e001";
  const omniTabAMM = await ethers.getContractAt("OmniTabAMM", ammAddress);

  const order = await omniTabAMM.buildProgram(
    deployer.address,
    ARB,
    USDC,
    FEE_BPS,
    3n
  );

  const orderStruct = {
    maker: order.maker,
    traits: order.traits,
    data: order.data
  };

  const encodedOrder = ethers.AbiCoder.defaultAbiCoder().encode(
    ["tuple(address maker, uint256 traits, bytes data)"],
    [orderStruct]
  );

  const strategyHash = ethers.keccak256(encodedOrder);
  console.log("Strategy Hash:", strategyHash);

  // Check Aqua balances
  const aqua = await ethers.getContractAt("@1inch/aqua/src/interfaces/IAqua.sol:IAqua", AQUA);

  const [arbBalance, usdcBalance] = await aqua.safeBalances(
    deployer.address,
    SWAPVM_ROUTER,
    strategyHash,
    ARB,
    USDC
  );

  console.log("\nAqua Strategy Balances:");
  console.log("ARB:", ethers.formatUnits(arbBalance, 18));
  console.log("USDC:", ethers.formatUnits(usdcBalance, 6));

  // Try to quote a swap
  const omniSwap = await ethers.getContractAt("OmniTabSwap", OMNITAB_SWAP);

  const strategy = {
    maker: MAKER,
    token0: ARB,
    token1: USDC,
    feeBps: FEE_BPS,
    salt: SALT
  };

  // Check strategy hash from OmniTabSwap
  const swapStrategyHash = ethers.keccak256(
    ethers.AbiCoder.defaultAbiCoder().encode(
      ["tuple(address maker, address token0, address token1, uint256 feeBps, bytes32 salt)"],
      [strategy]
    )
  );
  console.log("\nSwap Strategy Hash:", swapStrategyHash);
  console.log("Order Strategy Hash:", strategyHash);

  // Check balances with swap strategy hash
  const [arbBalSwap, usdcBalSwap] = await aqua.safeBalances(
    MAKER,
    OMNITAB_SWAP,
    swapStrategyHash,
    ARB,
    USDC
  );
  console.log("\nBalances with Swap Strategy Hash:");
  console.log("ARB:", ethers.formatUnits(arbBalSwap, 18));
  console.log("USDC:", ethers.formatUnits(usdcBalSwap, 6));

  try {
    const amountIn = ethers.parseUnits("0.1", 18); // 0.1 ARB
    const quote = await omniSwap.quoteExactIn(strategy, true, amountIn);
    console.log("\nQuote for 0.1 ARB:", ethers.formatUnits(quote, 6), "USDC");
  } catch (e: any) {
    console.log("\nQuote failed:", e.message);
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });

import { ethers } from "hardhat";
import "dotenv/config";

const AQUA_ADDRESS = process.env.AQUA_ADDRESS!;
const SWAPVM_ROUTER = process.env.SWAPVM_ROUTER_ADDRESS!;

const TOKENS = {
  ARB: "0x912CE59144191C1204E64559FE8253a0e49E6548",
  USDC: process.env.ARBITRUM_USDC_ADDRESS!,
};

function buildTakerTraits(params: {
  taker: string;
  isExactIn: boolean;
  threshold: bigint;
  useTransferFromAndAquaPush?: boolean;
}): string {
  const IS_EXACT_IN_BIT_FLAG = 0x0001;
  const USE_TRANSFER_FROM_AND_AQUA_PUSH_FLAG = 0x0040;

  let flags = 0;
  if (params.isExactIn) flags |= IS_EXACT_IN_BIT_FLAG;
  if (params.useTransferFromAndAquaPush) flags |= USE_TRANSFER_FROM_AND_AQUA_PUSH_FLAG;

  let thresholdBytes: string;
  let index0: number;

  if (params.threshold > 0n) {
    thresholdBytes = ethers.zeroPadValue(ethers.toBeHex(params.threshold), 32);
    index0 = 32;
  } else {
    thresholdBytes = "0x";
    index0 = 0;
  }

  const slicesIndexes = BigInt(index0);
  const packed = ethers.concat([
    ethers.zeroPadValue(ethers.toBeHex(slicesIndexes), 18),
    ethers.zeroPadValue(ethers.toBeHex(flags), 2),
    thresholdBytes
  ]);

  return ethers.hexlify(packed);
}

async function main() {
  const network = await ethers.provider.getNetwork();

  if (network.chainId !== 42161n) {
    throw new Error("This script must run on Arbitrum (chainId 42161)");
  }

  const OMNITAB_AMM_ADDRESS = process.env.OMNITAB_AMM_ADDRESS!;

  const takerPrivateKey = process.env.TAKER_PRIVATE_KEY_TEST;
  let trader: any;
  if (takerPrivateKey) {
    const provider = ethers.provider;
    trader = new ethers.Wallet(takerPrivateKey.startsWith('0x') ? takerPrivateKey : '0x' + takerPrivateKey, provider);
    console.log("Using separate taker wallet");
  } else {
    const signers = await ethers.getSigners();
    trader = signers[0];
    console.log("Using default signer as taker");
  }

  console.log("Executing Swap via SwapVM");
  console.log("Trader:", trader.address);

  const omniTabAMM = await ethers.getContractAt("OmniTabAMM", OMNITAB_AMM_ADDRESS);
  const swapVMRouter = await ethers.getContractAt("@1inch/swap-vm/src/interfaces/ISwapVM.sol:ISwapVM", SWAPVM_ROUTER);
  const arb = await ethers.getContractAt("IERC20", TOKENS.ARB);
  const usdc = await ethers.getContractAt("IERC20", TOKENS.USDC);

  const arbBefore = await arb.balanceOf(trader.address);
  const usdcBefore = await usdc.balanceOf(trader.address);
  console.log("\nBalances before:");
  console.log("  ARB:", ethers.formatUnits(arbBefore, 18));
  console.log("  USDC:", ethers.formatUnits(usdcBefore, 6));

  const maker = process.env.MAKER_ADDRESS!;
  const feeBpsIn = 10;
  const salt = 1n;

  console.log("\nMaker (LP):", maker);

  const order = await omniTabAMM.buildProgram(
    maker,
    TOKENS.ARB,
    TOKENS.USDC,
    feeBpsIn,
    salt
  );

  const orderStruct = {
    maker: order.maker,
    traits: order.traits,
    data: order.data
  };

  const amountIn = ethers.parseUnits("0.1", 6);
  const minAmountOut = ethers.parseUnits("0.3", 18);

  console.log("\nSwap: 0.1 USDC -> ARB");
  console.log("Min output:", ethers.formatUnits(minAmountOut, 18), "ARB");

  const allowance = await usdc.allowance(trader.address, SWAPVM_ROUTER);
  if (allowance < amountIn) {
    console.log("Approving USDC...");
    const tx = await usdc.connect(trader).approve(SWAPVM_ROUTER, ethers.MaxUint256);
    const approveReceipt = await tx.wait();
    console.log("Approved:", approveReceipt?.hash);
  }

  const takerData = buildTakerTraits({
    taker: trader.address,
    isExactIn: true,
    threshold: 0n,
    useTransferFromAndAquaPush: true
  });

  console.log("\nExecuting swap...");
  const swapTx = await swapVMRouter.connect(trader).swap(
    orderStruct,
    TOKENS.USDC,
    TOKENS.ARB,
    amountIn,
    takerData
  );
  const receipt = await swapTx.wait();
  console.log("Swap executed:", receipt?.hash);

  await new Promise(resolve => setTimeout(resolve, 2000));

  const arbAfter = await arb.balanceOf(trader.address);
  const usdcAfter = await usdc.balanceOf(trader.address);

  const makerArbAfter = await arb.balanceOf(maker);
  const makerUsdcAfter = await usdc.balanceOf(maker);
  console.log("\nMaker balances:");
  console.log("  ARB:", ethers.formatUnits(makerArbAfter, 18));
  console.log("  USDC:", ethers.formatUnits(makerUsdcAfter, 6));

  console.log("\nTrader balances:");
  console.log("  ARB:", ethers.formatUnits(arbAfter, 18));
  console.log("  USDC:", ethers.formatUnits(usdcAfter, 6));

  const arbReceived = arbAfter - arbBefore;
  const usdcSpent = usdcBefore - usdcAfter;
  console.log("\nResult:");
  console.log("  USDC spent:", ethers.formatUnits(usdcSpent, 6));
  console.log("  ARB received:", ethers.formatUnits(arbReceived, 18));
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });

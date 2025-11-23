import { ethers } from "hardhat";

async function main() {
  // Build taker traits the TypeScript way
  const flags = 0x0041;
  const slicesIndexes = 0;

  const packed = ethers.concat([
    ethers.zeroPadValue(ethers.toBeHex(slicesIndexes), 18),
    ethers.zeroPadValue(ethers.toBeHex(flags), 2)
  ]);

  console.log("JS takerData:", packed);
  console.log("JS length:", (packed.length - 2) / 2, "bytes");

  // What Solidity would produce with abi.encodePacked(bytes18(0), uint16(0x0041))
  // bytes18(0) = 18 zero bytes
  // uint16(0x0041) = 0x0041 (2 bytes, big-endian)
  const solidityPacked = "0x" + "00".repeat(18) + "0041";

  console.log("\nSolidity takerData:", solidityPacked);
  console.log("Solidity length:", (solidityPacked.length - 2) / 2, "bytes");

  console.log("\nMatch:", packed === solidityPacked);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });

// SPDX-License-Identifier: MIT
pragma solidity 0.8.30;

/// @title OmniTabAMM - SwapVM-powered AMM for OmniTab
/// @notice Uses SwapVM bytecode instructions for pricing instead of hardcoded AMM logic

import { SafeCast } from "@openzeppelin/contracts/utils/math/SafeCast.sol";

import { AquaOpcodes } from "@1inch/swap-vm/src/opcodes/AquaOpcodes.sol";
import { SwapVM, ISwapVM } from "@1inch/swap-vm/src/SwapVM.sol";
import { MakerTraitsLib } from "@1inch/swap-vm/src/libs/MakerTraits.sol";
import { ProgramBuilder, Program } from "@1inch/swap-vm/test/utils/ProgramBuilder.sol";

import { XYCConcentrateArgsBuilder, ONE } from "@1inch/swap-vm/src/instructions/XYCConcentrate.sol";
import { FeeArgsBuilder, BPS } from "@1inch/swap-vm/src/instructions/Fee.sol";
import { ControlsArgsBuilder } from "@1inch/swap-vm/src/instructions/Controls.sol";

contract OmniTabAMM is AquaOpcodes {
    using SafeCast for uint256;
    using ProgramBuilder for Program;

    error ProtocolFeesExceedMakerFees(uint256 protocolFeeBps, uint256 makerFeeBps);

    constructor(address aqua) AquaOpcodes(aqua) {}

    /// @notice Build a SwapVM program for an AMM order
    /// @param maker The liquidity provider address
    /// @param token0 First token in the pair
    /// @param token1 Second token in the pair
    /// @param feeBpsIn Fee in basis points (e.g., 10 = 0.1%)
    /// @param salt Unique identifier for the strategy
    /// @return order The SwapVM order struct ready to be shipped to Aqua
    function buildProgram(
        address maker,
        address token0,
        address token1,
        uint16 feeBpsIn,
        uint64 salt
    ) external pure returns (ISwapVM.Order memory) {
        Program memory program = ProgramBuilder.init(_opcodes());

        // Build bytecode program using SwapVM instructions
        // This replaces hardcoded x*y=k with composable bytecode
        // Order matters: fee before swap, salt at end
        bytes memory bytecode = bytes.concat(
            // Apply fee on input amount first
            (feeBpsIn > 0) ? program.build(_flatFeeAmountInXD, FeeArgsBuilder.buildFlatFee(feeBpsIn)) : bytes(""),
            // XYC swap instruction - constant product AMM
            program.build(_xycSwapXD),
            // Salt for unique strategy identification
            (salt > 0) ? program.build(_salt, ControlsArgsBuilder.buildSalt(salt)) : bytes("")
        );

        // Build the complete order with MakerTraits
        return MakerTraitsLib.build(MakerTraitsLib.Args({
            maker: maker,
            shouldUnwrapWeth: false,
            useAquaInsteadOfSignature: true, // Use Aqua for auth instead of signatures
            allowZeroAmountIn: false,
            receiver: address(0),
            hasPreTransferInHook: false,
            hasPostTransferInHook: false,
            hasPreTransferOutHook: false,
            hasPostTransferOutHook: false,
            preTransferInTarget: address(0),
            preTransferInData: "",
            postTransferInTarget: address(0),
            postTransferInData: "",
            preTransferOutTarget: address(0),
            preTransferOutData: "",
            postTransferOutTarget: address(0),
            postTransferOutData: "",
            program: bytecode
        }));
    }

    /// @notice Build a program with additional features (concentration, protocol fee)
    /// @param maker The liquidity provider address
    /// @param token0 First token in the pair
    /// @param token1 Second token in the pair
    /// @param feeBpsIn Maker fee in basis points
    /// @param delta0 Concentration parameter for token0
    /// @param delta1 Concentration parameter for token1
    /// @param protocolFeeBpsIn Protocol fee in basis points
    /// @param feeReceiver Address to receive protocol fees
    /// @param salt Unique identifier for the strategy
    /// @param deadline Order expiration timestamp (0 for no deadline)
    /// @return order The SwapVM order struct
    function buildAdvancedProgram(
        address maker,
        address token0,
        address token1,
        uint16 feeBpsIn,
        uint256 delta0,
        uint256 delta1,
        uint16 protocolFeeBpsIn,
        address feeReceiver,
        uint64 salt,
        uint32 deadline
    ) external pure returns (ISwapVM.Order memory) {
        require(protocolFeeBpsIn <= feeBpsIn, ProtocolFeesExceedMakerFees(protocolFeeBpsIn, feeBpsIn));

        Program memory program = ProgramBuilder.init(_opcodes());

        bytes memory bytecode = bytes.concat(
            // Deadline check
            (deadline > 0) ? program.build(_deadline, ControlsArgsBuilder.buildDeadline(deadline)) : bytes(""),
            // Liquidity concentration (2D)
            (delta0 != 0 || delta1 != 0) ? program.build(_xycConcentrateGrowLiquidity2D, XYCConcentrateArgsBuilder.build2D(token0, token1, delta0, delta1)) : bytes(""),
            // Maker fee
            (feeBpsIn > 0) ? program.build(_flatFeeAmountInXD, FeeArgsBuilder.buildFlatFee(feeBpsIn)) : bytes(""),
            // Protocol fee
            (protocolFeeBpsIn > 0) ? program.build(_aquaProtocolFeeAmountOutXD, FeeArgsBuilder.buildProtocolFee(protocolFeeBpsIn, feeReceiver)) : bytes(""),
            // XYC swap
            program.build(_xycSwapXD),
            // Salt
            (salt > 0) ? program.build(_salt, ControlsArgsBuilder.buildSalt(salt)) : bytes("")
        );

        return MakerTraitsLib.build(MakerTraitsLib.Args({
            maker: maker,
            shouldUnwrapWeth: false,
            useAquaInsteadOfSignature: true,
            allowZeroAmountIn: false,
            receiver: address(0),
            hasPreTransferInHook: false,
            hasPostTransferInHook: false,
            hasPreTransferOutHook: false,
            hasPostTransferOutHook: false,
            preTransferInTarget: address(0),
            preTransferInData: "",
            postTransferInTarget: address(0),
            postTransferInData: "",
            preTransferOutTarget: address(0),
            preTransferOutData: "",
            postTransferOutTarget: address(0),
            postTransferOutData: "",
            program: bytecode
        }));
    }
}

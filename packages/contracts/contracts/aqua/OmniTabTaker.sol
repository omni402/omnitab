// SPDX-License-Identifier: MIT
pragma solidity ^0.8.22;

import { IERC20 } from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import { SafeERC20 } from "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";

interface IAqua {
    function push(address maker, address app, bytes32 strategyHash, address token, uint256 amount) external;
}

interface IOmniTabSwap {
    struct Strategy {
        address maker;
        address token0;
        address token1;
        uint256 feeBps;
        bytes32 salt;
    }

    function swapExactIn(
        Strategy calldata strategy,
        bool zeroForOne,
        uint256 amountIn,
        uint256 amountOutMin,
        address to,
        bytes calldata takerData
    ) external returns (uint256 amountOut);

    function quoteExactIn(
        Strategy calldata strategy,
        bool zeroForOne,
        uint256 amountIn
    ) external view returns (uint256 amountOut);
}

/// @title OmniTabTaker - Execute swaps on OmniTabSwap
contract OmniTabTaker {
    using SafeERC20 for IERC20;

    IAqua public immutable AQUA;

    constructor(address aqua_) {
        AQUA = IAqua(aqua_);
    }

    /// @notice Execute a swap
    function swap(
        address omniTabSwap,
        IOmniTabSwap.Strategy calldata strategy,
        bool zeroForOne,
        uint256 amountIn,
        uint256 amountOutMin
    ) external returns (uint256 amountOut) {
        address tokenIn = zeroForOne ? strategy.token0 : strategy.token1;

        // Transfer tokens from user to this contract
        IERC20(tokenIn).safeTransferFrom(msg.sender, address(this), amountIn);

        // Approve Aqua to pull tokens
        IERC20(tokenIn).forceApprove(address(AQUA), amountIn);

        // Execute swap - callback will push tokens to Aqua
        amountOut = IOmniTabSwap(omniTabSwap).swapExactIn(
            strategy,
            zeroForOne,
            amountIn,
            amountOutMin,
            msg.sender, // Send output directly to user
            "" // No extra data needed
        );
    }

    /// @notice Callback from OmniTabSwap - push tokens to maker's strategy
    function xycSwapCallback(
        address tokenIn,
        address, // tokenOut
        uint256 amountIn,
        uint256, // amountOut
        address maker,
        address app,
        bytes32 strategyHash,
        bytes calldata // takerData
    ) external {
        // Push input tokens to maker's Aqua balance
        AQUA.push(maker, app, strategyHash, tokenIn, amountIn);
    }
}

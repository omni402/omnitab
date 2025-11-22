// SPDX-License-Identifier: MIT
pragma solidity ^0.8.22;

import { Math } from "@openzeppelin/contracts/utils/math/Math.sol";
import { IERC20 } from "@openzeppelin/contracts/token/ERC20/IERC20.sol";

interface IAqua {
    function ship(address app, bytes calldata strategy, address[] calldata tokens, uint256[] calldata amounts) external returns(bytes32 strategyHash);
    function dock(address app, bytes32 strategyHash, address[] calldata tokens) external;
    function pull(address maker, bytes32 strategyHash, address token, uint256 amount, address to) external;
    function push(address maker, address app, bytes32 strategyHash, address token, uint256 amount) external;
    function safeBalances(address maker, address app, bytes32 strategyHash, address token0, address token1) external view returns (uint256 balance0, uint256 balance1);
    function rawBalances(address maker, address app, bytes32 strategyHash, address token) external view returns (uint248 balance, uint8 tokensCount);
}

interface IXYCSwapCallback {
    function xycSwapCallback(
        address tokenIn,
        address tokenOut,
        uint256 amountIn,
        uint256 amountOut,
        address maker,
        address app,
        bytes32 strategyHash,
        bytes calldata takerData
    ) external;
}

/// @title OmniTabSwap - Simple constant product AMM for Aqua
/// @notice OmniTab's AMM app for the Aqua protocol
contract OmniTabSwap {
    using Math for uint256;

    error InsufficientOutputAmount(uint256 amountOut, uint256 amountOutMin);
    error ExcessiveInputAmount(uint256 amountIn, uint256 amountInMax);
    error ReentrancyGuard();

    struct Strategy {
        address maker;
        address token0;
        address token1;
        uint256 feeBps;
        bytes32 salt;
    }

    uint256 internal constant BPS_BASE = 10_000;

    IAqua public immutable AQUA;

    mapping(bytes32 => bool) private _locks;

    constructor(address aqua_) {
        AQUA = IAqua(aqua_);
    }

    modifier nonReentrantStrategy(bytes32 strategyHash) {
        require(!_locks[strategyHash], "ReentrancyGuard");
        _locks[strategyHash] = true;
        _;
        _locks[strategyHash] = false;
    }

    function quoteExactIn(
        Strategy calldata strategy,
        bool zeroForOne,
        uint256 amountIn
    ) external view returns (uint256 amountOut) {
        bytes32 strategyHash = keccak256(abi.encode(strategy));
        (,, uint256 balanceIn, uint256 balanceOut) = _getInAndOut(strategy, strategyHash, zeroForOne);
        amountOut = _quoteExactIn(strategy, balanceIn, balanceOut, amountIn);
    }

    function quoteExactOut(
        Strategy calldata strategy,
        bool zeroForOne,
        uint256 amountOut
    ) external view returns (uint256 amountIn) {
        bytes32 strategyHash = keccak256(abi.encode(strategy));
        (,, uint256 balanceIn, uint256 balanceOut) = _getInAndOut(strategy, strategyHash, zeroForOne);
        amountIn = _quoteExactOut(strategy, balanceIn, balanceOut, amountOut);
    }

    function swapExactIn(
        Strategy calldata strategy,
        bool zeroForOne,
        uint256 amountIn,
        uint256 amountOutMin,
        address to,
        bytes calldata takerData
    ) external returns (uint256 amountOut) {
        bytes32 strategyHash = keccak256(abi.encode(strategy));
        return _swapExactIn(strategy, strategyHash, zeroForOne, amountIn, amountOutMin, to, takerData);
    }

    function _swapExactIn(
        Strategy calldata strategy,
        bytes32 strategyHash,
        bool zeroForOne,
        uint256 amountIn,
        uint256 amountOutMin,
        address to,
        bytes calldata takerData
    )
        private
        nonReentrantStrategy(strategyHash)
        returns (uint256 amountOut)
    {
        (address tokenIn, address tokenOut, uint256 balanceIn, uint256 balanceOut) = _getInAndOut(strategy, strategyHash, zeroForOne);
        amountOut = _quoteExactIn(strategy, balanceIn, balanceOut, amountIn);
        require(amountOut >= amountOutMin, "InsufficientOutputAmount");

        address maker = strategy.maker;
        AQUA.pull(maker, strategyHash, tokenOut, amountOut, to);
        IXYCSwapCallback(msg.sender).xycSwapCallback(tokenIn, tokenOut, amountIn, amountOut, maker, address(this), strategyHash, takerData);

        // Check that tokens were pushed
        (uint248 newBalance,) = AQUA.rawBalances(maker, address(this), strategyHash, tokenIn);
        require(newBalance >= balanceIn + amountIn, "Insufficient push");
    }

    function swapExactOut(
        Strategy calldata strategy,
        bool zeroForOne,
        uint256 amountOut,
        uint256 amountInMax,
        address to,
        bytes calldata takerData
    ) external returns (uint256 amountIn) {
        bytes32 strategyHash = keccak256(abi.encode(strategy));
        return _swapExactOut(strategy, strategyHash, zeroForOne, amountOut, amountInMax, to, takerData);
    }

    function _swapExactOut(
        Strategy calldata strategy,
        bytes32 strategyHash,
        bool zeroForOne,
        uint256 amountOut,
        uint256 amountInMax,
        address to,
        bytes calldata takerData
    )
        private
        nonReentrantStrategy(strategyHash)
        returns (uint256 amountIn)
    {
        (address tokenIn, address tokenOut, uint256 balanceIn, uint256 balanceOut) = _getInAndOut(strategy, strategyHash, zeroForOne);
        amountIn = _quoteExactOut(strategy, balanceIn, balanceOut, amountOut);
        require(amountIn <= amountInMax, "ExcessiveInputAmount");

        address maker = strategy.maker;
        AQUA.pull(maker, strategyHash, tokenOut, amountOut, to);
        IXYCSwapCallback(msg.sender).xycSwapCallback(tokenIn, tokenOut, amountIn, amountOut, maker, address(this), strategyHash, takerData);

        // Check that tokens were pushed
        (uint248 newBalance,) = AQUA.rawBalances(maker, address(this), strategyHash, tokenIn);
        require(newBalance >= balanceIn + amountIn, "Insufficient push");
    }

    function _quoteExactIn(
        Strategy calldata strategy,
        uint256 balanceIn,
        uint256 balanceOut,
        uint256 amountIn
    ) internal pure returns (uint256 amountOut) {
        uint256 amountInWithFee = amountIn * (BPS_BASE - strategy.feeBps) / BPS_BASE;
        amountOut = Math.mulDiv(amountInWithFee, balanceOut, balanceIn + amountInWithFee);
    }

    function _quoteExactOut(
        Strategy calldata strategy,
        uint256 balanceIn,
        uint256 balanceOut,
        uint256 amountOut
    ) internal pure returns (uint256 amountIn) {
        uint256 amountOutWithFee = amountOut * BPS_BASE / (BPS_BASE - strategy.feeBps);
        amountIn = Math.mulDiv(balanceIn, amountOutWithFee, balanceOut - amountOutWithFee, Math.Rounding.Ceil);
    }

    function _getInAndOut(Strategy calldata strategy, bytes32 strategyHash, bool zeroForOne) private view returns (address tokenIn, address tokenOut, uint256 balanceIn, uint256 balanceOut) {
        tokenIn = zeroForOne ? strategy.token0 : strategy.token1;
        tokenOut = zeroForOne ? strategy.token1 : strategy.token0;
        (balanceIn, balanceOut) = AQUA.safeBalances(strategy.maker, address(this), strategyHash, tokenIn, tokenOut);
    }
}

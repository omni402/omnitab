// SPDX-License-Identifier: MIT
pragma solidity ^0.8.22;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import { OApp, MessagingFee, Origin } from "@layerzerolabs/lz-evm-oapp-v2/contracts/oapp/OApp.sol";
import { OptionsBuilder } from "@layerzerolabs/lz-evm-oapp-v2/contracts/oapp/libs/OptionsBuilder.sol";

interface ISwapVM {
    struct Order {
        address maker;
        uint256 traits;
        bytes data;
    }
    function swap(
        Order calldata order,
        address tokenIn,
        address tokenOut,
        uint256 amount,
        bytes calldata takerData
    ) external returns (uint256 amountOut);
}

/// @title EdgePayment
/// @notice Edge chain contract for processing x402 payments and sending LayerZero messages to hub
/// @dev Deployed on source chains (Arbitrum, Polygon) to accept payments and notify Base hub
contract EdgePayment is OApp, ReentrancyGuard {
    using SafeERC20 for IERC20;
    using OptionsBuilder for bytes;

    IERC20 public immutable usdc;
    ISwapVM public immutable swapVM;

    uint32 public immutable hubEid;

    uint256 public vault;
    uint256 public replenishThreshold;

    uint128 public lzGasLimit = 200000;
    uint128 public lzComposeGasLimit = 150000;

    // SwapVM order for token swaps
    ISwapVM.Order public swapOrder;
    address public swapTokenIn;  // The non-USDC token (e.g., ARB)
    address public swapTokenOut; // USDC

    enum InvoiceStatus { None, Pending, Settled }

    struct Invoice {
        address payer;
        address merchant;
        uint256 amount;
        uint256 fee;
        address sourceToken;
        uint256 sourceAmount;
        InvoiceStatus status;
    }

    mapping(bytes32 => Invoice) public invoices;
    mapping(address => bool) public supportedTokens;

    event PaymentProcessed(
        bytes32 indexed paymentId,
        address indexed payer,
        address indexed merchant,
        uint256 amount,
        uint256 fee,
        address sourceToken,
        uint256 sourceAmount
    );
    event MessageSent(bytes32 indexed paymentId, bytes32 guid);
    event InvoiceSettled(bytes32 indexed paymentId);
    event VaultWithdrawn(address indexed to, uint256 amount);
    event ReplenishThresholdUpdated(uint256 oldThreshold, uint256 newThreshold);
    event ReplenishTriggered(uint256 vaultBalance);
    event TokenSupportUpdated(address indexed token, bool supported);
    event SwapOrderUpdated(address maker, address tokenIn, address tokenOut);

    constructor(
        address _endpoint,
        address _delegate,
        address _usdc,
        uint32 _hubEid,
        address _swapVM
    ) OApp(_endpoint, _delegate) Ownable(_delegate) {
        usdc = IERC20(_usdc);
        hubEid = _hubEid;
        swapVM = ISwapVM(_swapVM);
        supportedTokens[_usdc] = true;
    }

    function setSupportedToken(address token, bool supported) external onlyOwner {
        supportedTokens[token] = supported;
        emit TokenSupportUpdated(token, supported);
    }

    function setSwapOrder(
        address maker,
        uint256 traits,
        bytes calldata data,
        address tokenIn,
        address tokenOut
    ) external onlyOwner {
        swapOrder = ISwapVM.Order({
            maker: maker,
            traits: traits,
            data: data
        });
        swapTokenIn = tokenIn;
        swapTokenOut = tokenOut;
        emit SwapOrderUpdated(maker, tokenIn, tokenOut);
    }

    function pay(
        bytes32 paymentId,
        address merchant,
        uint256 amount,
        uint256 fee,
        address token,
        uint256 tokenAmount
    ) external payable nonReentrant {
        require(amount > 0, "Amount must be greater than 0");
        require(invoices[paymentId].status == InvoiceStatus.None, "Invoice already exists");
        require(supportedTokens[token], "Token not supported");

        uint256 usdcTotal = amount + fee;
        uint256 sourceAmount;
        address sourceToken = token;

        // If paying with USDC, tokenAmount should match
        if (token == address(usdc)) {
            sourceAmount = usdcTotal;
            IERC20(token).safeTransferFrom(msg.sender, address(this), usdcTotal);
        } else {
            // Paying with non-USDC token - need to swap
            require(token == swapTokenIn, "Token not configured for swap");
            require(tokenAmount > 0, "Token amount required for swap");

            sourceAmount = tokenAmount;

            // Transfer tokens from payer
            IERC20(token).safeTransferFrom(msg.sender, address(this), tokenAmount);

            // Approve SwapVM router to pull tokens
            IERC20(token).approve(address(swapVM), tokenAmount);

            // Build taker traits: IS_EXACT_IN | USE_TRANSFER_FROM_AND_AQUA_PUSH
            // Format: 18 bytes slicesIndexes + 2 bytes flags
            bytes memory takerData = abi.encodePacked(
                bytes18(0),      // slicesIndexes (no threshold)
                uint16(0x0041)   // flags: IS_EXACT_IN (0x0001) | USE_TRANSFER_FROM_AND_AQUA_PUSH (0x0040)
            );

            // Perform swap via SwapVM
            uint256 swappedUsdc = swapVM.swap(
                swapOrder,
                token,           // tokenIn (e.g., ARB)
                swapTokenOut,    // tokenOut (USDC)
                tokenAmount,
                takerData
            );

            // Verify we got enough USDC for the settlement
            require(swappedUsdc >= usdcTotal, "Insufficient swap output");

            // Keep original amount/fee (they're already in USDC)
            // Any excess from swap stays in vault as extra fee
        }

        vault += usdcTotal;

        // Store invoice
        invoices[paymentId] = Invoice({
            payer: msg.sender,
            merchant: merchant,
            amount: amount,
            fee: fee,
            sourceToken: sourceToken,
            sourceAmount: sourceAmount,
            status: InvoiceStatus.Pending
        });

        emit PaymentProcessed(paymentId, msg.sender, merchant, amount, fee, sourceToken, sourceAmount);

        // Encode payload with source chain EID for return message
        bytes memory payload = abi.encode(paymentId, merchant, amount, fee, endpoint.eid());

        // Options: lzReceive gas + lzCompose gas (for settlement + return message)
        bytes memory options = OptionsBuilder.newOptions()
            .addExecutorLzReceiveOption(lzGasLimit, 0)
            .addExecutorLzComposeOption(0, lzComposeGasLimit, 0);

        MessagingFee memory msgFee = _quote(hubEid, payload, options, false);
        require(msg.value >= msgFee.nativeFee, "Insufficient fee for LZ message");

        bytes32 guid = _lzSend(hubEid, payload, options, msgFee, payable(msg.sender)).guid;

        emit MessageSent(paymentId, guid);

        if (msg.value > msgFee.nativeFee) {
            payable(msg.sender).transfer(msg.value - msgFee.nativeFee);
        }
    }

    function quote(
        bytes32 paymentId,
        address merchant,
        uint256 amount,
        uint256 fee
    ) external view returns (MessagingFee memory) {
        bytes memory payload = abi.encode(paymentId, merchant, amount, fee, endpoint.eid());
        bytes memory options = OptionsBuilder.newOptions()
            .addExecutorLzReceiveOption(lzGasLimit, 0)
            .addExecutorLzComposeOption(0, lzComposeGasLimit, 0);
        return _quote(hubEid, payload, options, false);
    }

    function setLzComposeGasLimit(uint128 _gasLimit) external onlyOwner {
        lzComposeGasLimit = _gasLimit;
    }

    function setLzGasLimit(uint128 _gasLimit) external onlyOwner {
        lzGasLimit = _gasLimit;
    }

    function setReplenishThreshold(uint256 _threshold) external onlyOwner {
        uint256 oldThreshold = replenishThreshold;
        replenishThreshold = _threshold;
        emit ReplenishThresholdUpdated(oldThreshold, _threshold);
    }

    function withdrawVault(address to, uint256 amount) external onlyOwner nonReentrant {
        require(amount > 0 && amount <= vault, "Invalid amount");

        vault -= amount;
        usdc.safeTransfer(to, amount);

        emit VaultWithdrawn(to, amount);
    }

    function shouldReplenish() external view returns (bool) {
        return vault >= replenishThreshold && replenishThreshold > 0;
    }

    function triggerReplenish() external {
        require(vault >= replenishThreshold && replenishThreshold > 0, "Threshold not reached");
        emit ReplenishTriggered(vault);
    }

    function _lzReceive(
        Origin calldata _origin,
        bytes32 /*_guid*/,
        bytes calldata _message,
        address /*_executor*/,
        bytes calldata /*_extraData*/
    ) internal override {
        require(_origin.srcEid == hubEid, "Only hub can send");

        bytes32 paymentId = abi.decode(_message, (bytes32));

        require(invoices[paymentId].status == InvoiceStatus.Pending, "Invoice not pending");

        invoices[paymentId].status = InvoiceStatus.Settled;

        emit InvoiceSettled(paymentId);
    }

    function getInvoiceStatus(bytes32 paymentId) external view returns (InvoiceStatus) {
        return invoices[paymentId].status;
    }
}

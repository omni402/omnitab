// SPDX-License-Identifier: MIT
pragma solidity ^0.8.22;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import { OApp, MessagingFee, Origin } from "@layerzerolabs/lz-evm-oapp-v2/contracts/oapp/OApp.sol";
import { OptionsBuilder } from "@layerzerolabs/lz-evm-oapp-v2/contracts/oapp/libs/OptionsBuilder.sol";

/// @title EdgePayment
/// @notice Edge chain contract for processing x402 payments and sending LayerZero messages to hub
/// @dev Deployed on source chains (Arbitrum, Polygon) to accept payments and notify Base hub
contract EdgePayment is OApp, ReentrancyGuard {
    using SafeERC20 for IERC20;
    using OptionsBuilder for bytes;

    IERC20 public immutable usdc;

    uint32 public immutable hubEid;

    uint256 public vault;
    uint256 public replenishThreshold;

    uint128 public lzGasLimit = 200000;
    uint128 public lzComposeGasLimit = 150000;

    enum InvoiceStatus { None, Pending, Settled }

    struct Invoice {
        address payer;
        address merchant;
        uint256 amount;
        uint256 fee;
        InvoiceStatus status;
    }

    mapping(bytes32 => Invoice) public invoices;

    event PaymentProcessed(
        bytes32 indexed paymentId,
        address indexed payer,
        address indexed merchant,
        uint256 amount,
        uint256 fee
    );
    event MessageSent(bytes32 indexed paymentId, bytes32 guid);
    event InvoiceSettled(bytes32 indexed paymentId);
    event VaultWithdrawn(address indexed to, uint256 amount);
    event ReplenishThresholdUpdated(uint256 oldThreshold, uint256 newThreshold);
    event ReplenishTriggered(uint256 vaultBalance);

    constructor(
        address _endpoint,
        address _delegate,
        address _usdc,
        uint32 _hubEid
    ) OApp(_endpoint, _delegate) Ownable(_delegate) {
        usdc = IERC20(_usdc);
        hubEid = _hubEid;
    }

    function pay(
        bytes32 paymentId,
        address merchant,
        uint256 amount,
        uint256 fee
    ) external payable nonReentrant {
        require(amount > 0, "Amount must be greater than 0");
        require(invoices[paymentId].status == InvoiceStatus.None, "Invoice already exists");

        uint256 total = amount + fee;

        usdc.safeTransferFrom(msg.sender, address(this), total);

        vault += total;

        // Store invoice
        invoices[paymentId] = Invoice({
            payer: msg.sender,
            merchant: merchant,
            amount: amount,
            fee: fee,
            status: InvoiceStatus.Pending
        });

        emit PaymentProcessed(paymentId, msg.sender, merchant, amount, fee);

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

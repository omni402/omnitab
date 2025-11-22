// SPDX-License-Identifier: MIT
pragma solidity ^0.8.22;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import { OApp, MessagingFee, Origin } from "@layerzerolabs/lz-evm-oapp-v2/contracts/oapp/OApp.sol";
import { OptionsBuilder } from "@layerzerolabs/lz-evm-oapp-v2/contracts/oapp/libs/OptionsBuilder.sol";

contract EdgePayment is OApp, ReentrancyGuard {
    using SafeERC20 for IERC20;
    using OptionsBuilder for bytes;

    IERC20 public immutable usdc;

    uint32 public immutable hubEid;

    uint256 public vault;

    event PaymentProcessed(
        bytes32 indexed paymentId,
        address indexed payer,
        address indexed merchant,
        uint256 amount,
        uint256 fee
    );

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

        uint256 total = amount + fee;

        usdc.safeTransferFrom(msg.sender, address(this), total);

        vault += total;

        emit PaymentProcessed(paymentId, msg.sender, merchant, amount, fee);
    }

    function _lzReceive(
        Origin calldata /*_origin*/,
        bytes32 /*_guid*/,
        bytes calldata /*_message*/,
        address /*_executor*/,
        bytes calldata /*_extraData*/
    ) internal override {
        // Edge contracts don't receive messages from hub
        revert("Not implemented");
    }
}

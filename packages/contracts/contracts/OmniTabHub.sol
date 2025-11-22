// SPDX-License-Identifier: MIT
pragma solidity ^0.8.22;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import { OApp, MessagingFee, Origin } from "@layerzerolabs/lz-evm-oapp-v2/contracts/oapp/OApp.sol";
import { ILayerZeroComposer } from "@layerzerolabs/lz-evm-protocol-v2/contracts/interfaces/ILayerZeroComposer.sol";

interface ISettlementPool {
    function settle(address merchant, uint256 amount) external;
    function replenish(uint256 amount) external;
}

contract OmniTabHub is OApp, ReentrancyGuard, ILayerZeroComposer {
    using SafeERC20 for IERC20;

    IERC20 public immutable usdc;
    ISettlementPool public settlementPool;

    mapping(bytes32 => bool) public processedPayments;
    mapping(uint32 => bool) public trustedEdges;

    event ComposeReceived(address indexed from, bytes32 guid, bytes message);

    event PaymentReceived(
        bytes32 indexed paymentId,
        address indexed merchant,
        uint256 amount,
        uint256 fee,
        uint32 srcEid
    );

    constructor(
        address _endpoint,
        address _delegate,
        address _usdc,
        address _settlementPool
    ) OApp(_endpoint, _delegate) Ownable(_delegate) {
        usdc = IERC20(_usdc);
        settlementPool = ISettlementPool(_settlementPool);
    }

    function _lzReceive(
        Origin calldata _origin,
        bytes32 /*_guid*/,
        bytes calldata _message,
        address /*_executor*/,
        bytes calldata /*_extraData*/
    ) internal override {
        require(trustedEdges[_origin.srcEid], "Untrusted source");

        (
            bytes32 paymentId,
            address merchant,
            uint256 amount,
            uint256 fee
        ) = abi.decode(_message, (bytes32, address, uint256, uint256));

        require(!processedPayments[paymentId], "Payment already processed");
        processedPayments[paymentId] = true;

        settlementPool.settle(merchant, amount);

        emit PaymentReceived(paymentId, merchant, amount, fee, _origin.srcEid);
    }

    function lzCompose(
        address _from,
        bytes32 _guid,
        bytes calldata _message,
        address /*_executor*/,
        bytes calldata /*_extraData*/
    ) external payable override {
        require(msg.sender == address(endpoint), "Only endpoint");

        emit ComposeReceived(_from, _guid, _message);
    }
}

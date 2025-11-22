// SPDX-License-Identifier: MIT
pragma solidity ^0.8.22;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import { OApp, MessagingFee, Origin } from "@layerzerolabs/lz-evm-oapp-v2/contracts/oapp/OApp.sol";
import { ILayerZeroComposer } from "@layerzerolabs/lz-evm-protocol-v2/contracts/interfaces/ILayerZeroComposer.sol";
import { OptionsBuilder } from "@layerzerolabs/lz-evm-oapp-v2/contracts/oapp/libs/OptionsBuilder.sol";

interface ISettlementPool {
    function settle(address merchant, uint256 amount) external;
    function replenish(uint256 amount) external;
}

/// @title OmniTabHub
/// @notice Central hub on Base that receives cross-chain payment confirmations and triggers settlements
/// @dev Receives LayerZero messages from edge chains and coordinates with SettlementPool
contract OmniTabHub is OApp, ReentrancyGuard, ILayerZeroComposer {
    using SafeERC20 for IERC20;
    using OptionsBuilder for bytes;

    IERC20 public immutable usdc;
    ISettlementPool public settlementPool;

    uint128 public returnGasLimit = 100000;

    mapping(bytes32 => bool) public processedPayments;
    mapping(uint32 => bool) public trustedEdges;

    event PaymentReceived(
        bytes32 indexed paymentId,
        address indexed merchant,
        uint256 amount,
        uint256 fee,
        uint32 srcEid
    );
    event PaymentSettled(bytes32 indexed paymentId, address indexed merchant, uint256 amount);
    event SettlementConfirmationSent(bytes32 indexed paymentId, uint32 dstEid, bytes32 guid);
    event TrustedEdgeUpdated(uint32 indexed eid, bool trusted);
    event SettlementPoolUpdated(address oldPool, address newPool);

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
        bytes32 _guid,
        bytes calldata _message,
        address /*_executor*/,
        bytes calldata /*_extraData*/
    ) internal override {
        require(trustedEdges[_origin.srcEid], "Untrusted source");

        (
            bytes32 paymentId,
            address merchant,
            uint256 amount,
            uint256 fee,
            uint32 srcEid
        ) = abi.decode(_message, (bytes32, address, uint256, uint256, uint32));

        require(!processedPayments[paymentId], "Payment already processed");
        processedPayments[paymentId] = true;

        emit PaymentReceived(paymentId, merchant, amount, fee, srcEid);

        // Send compose message to self for settlement + return message
        endpoint.sendCompose(address(this), _guid, 0, _message);
    }

    function setTrustedEdge(uint32 _eid, bool _trusted) external onlyOwner {
        trustedEdges[_eid] = _trusted;
        emit TrustedEdgeUpdated(_eid, _trusted);
    }

    function setSettlementPool(address _settlementPool) external onlyOwner {
        address oldPool = address(settlementPool);
        settlementPool = ISettlementPool(_settlementPool);
        emit SettlementPoolUpdated(oldPool, _settlementPool);
    }

    function isPaymentProcessed(bytes32 paymentId) external view returns (bool) {
        return processedPayments[paymentId];
    }

    function lzCompose(
        address _from,
        bytes32 /*_guid*/,
        bytes calldata _message,
        address /*_executor*/,
        bytes calldata /*_extraData*/
    ) external payable override {
        require(msg.sender == address(endpoint), "Only endpoint");
        require(_from == address(this), "Invalid composer");

        (
            bytes32 paymentId,
            address merchant,
            uint256 amount,
            ,
            uint32 srcEid
        ) = abi.decode(_message, (bytes32, address, uint256, uint256, uint32));

        // Settle to merchant
        settlementPool.settle(merchant, amount);

        emit PaymentSettled(paymentId, merchant, amount);

        // Send confirmation back to source edge
        bytes memory returnPayload = abi.encode(paymentId);
        bytes memory options = OptionsBuilder.newOptions().addExecutorLzReceiveOption(returnGasLimit, 0);

        bytes32 guid = _lzSend(srcEid, returnPayload, options, MessagingFee(msg.value, 0), payable(address(this))).guid;

        emit SettlementConfirmationSent(paymentId, srcEid, guid);
    }

    function setReturnGasLimit(uint128 _gasLimit) external onlyOwner {
        returnGasLimit = _gasLimit;
    }

    receive() external payable {}
}

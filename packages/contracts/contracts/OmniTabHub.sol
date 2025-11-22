// SPDX-License-Identifier: MIT
pragma solidity ^0.8.22;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import { OApp, MessagingFee, Origin } from "@layerzerolabs/lz-evm-oapp-v2/contracts/oapp/OApp.sol";

interface ISettlementPool {
    function settle(address merchant, uint256 amount) external;
    function replenish(uint256 amount) external;
}

contract OmniTabHub is OApp, ReentrancyGuard {
    using SafeERC20 for IERC20;

    IERC20 public immutable usdc;
    ISettlementPool public settlementPool;

    mapping(bytes32 => bool) public processedPayments;
    mapping(uint32 => bool) public trustedEdges;

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
}

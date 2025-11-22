// SPDX-License-Identifier: MIT
pragma solidity ^0.8.22;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

contract SettlementPool is Ownable, ReentrancyGuard {
    using SafeERC20 for IERC20;

    IERC20 public immutable usdc;

    uint256 public totalShares;
    uint256 public totalLiquidity;

    mapping(address => uint256) public lpShares;

    event Deposited(address indexed lp, uint256 amount, uint256 shares);
    event Withdrawn(address indexed lp, uint256 shares, uint256 amount);

    constructor(address _usdc) Ownable(msg.sender) {
        usdc = IERC20(_usdc);
    }

    function deposit(uint256 amount) external nonReentrant returns (uint256 shares) {
        require(amount > 0, "Amount must be greater than 0");

        if (totalShares == 0) {
            shares = amount;
        } else {
            shares = (amount * totalShares) / totalLiquidity;
        }

        usdc.safeTransferFrom(msg.sender, address(this), amount);

        totalLiquidity += amount;
        totalShares += shares;
        lpShares[msg.sender] += shares;

        emit Deposited(msg.sender, amount, shares);
    }

    function withdraw(uint256 shares) external nonReentrant returns (uint256 amount) {
        require(shares > 0 && shares <= lpShares[msg.sender], "Invalid shares");

        amount = (shares * totalLiquidity) / totalShares;

        totalLiquidity -= amount;
        totalShares -= shares;
        lpShares[msg.sender] -= shares;

        usdc.safeTransfer(msg.sender, amount);

        emit Withdrawn(msg.sender, shares, amount);
    }

    function getSharePrice() external view returns (uint256) {
        if (totalShares == 0) return 1e18;
        return (totalLiquidity * 1e18) / totalShares;
    }

    function getBalance(address lp) external view returns (uint256) {
        if (totalShares == 0) return 0;
        return (lpShares[lp] * totalLiquidity) / totalShares;
    }
}

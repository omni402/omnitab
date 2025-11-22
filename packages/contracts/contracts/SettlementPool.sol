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
    uint256 public poolCap;
    bool public depositsEnabled;

    address public hub;

    mapping(address => uint256) public lpShares;

    event Deposited(address indexed lp, uint256 amount, uint256 shares);
    event Withdrawn(address indexed lp, uint256 shares, uint256 amount);
    event PoolCapUpdated(uint256 oldCap, uint256 newCap);
    event DepositsEnabled(bool enabled);
    event HubUpdated(address oldHub, address newHub);
    event Settled(address indexed merchant, uint256 amount);
    event Replenished(uint256 amount);

    modifier onlyHub() {
        require(msg.sender == hub, "Only hub can call");
        _;
    }

    constructor(address _usdc, uint256 _poolCap) Ownable(msg.sender) {
        usdc = IERC20(_usdc);
        poolCap = _poolCap;
        depositsEnabled = true;
    }

    function deposit(uint256 amount) external nonReentrant returns (uint256 shares) {
        require(depositsEnabled, "Deposits are disabled");
        require(amount > 0, "Amount must be greater than 0");
        require(totalLiquidity + amount <= poolCap, "Pool cap exceeded");

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

    function setPoolCap(uint256 _poolCap) external onlyOwner {
        uint256 oldCap = poolCap;
        poolCap = _poolCap;
        emit PoolCapUpdated(oldCap, _poolCap);
    }

    function setDepositsEnabled(bool _enabled) external onlyOwner {
        depositsEnabled = _enabled;
        emit DepositsEnabled(_enabled);
    }

    function setHub(address _hub) external onlyOwner {
        address oldHub = hub;
        hub = _hub;
        emit HubUpdated(oldHub, _hub);
    }

    function settle(address merchant, uint256 amount) external onlyHub nonReentrant {
        require(amount > 0, "Amount must be greater than 0");
        require(totalLiquidity >= amount, "Insufficient liquidity");

        totalLiquidity -= amount;

        usdc.safeTransfer(merchant, amount);

        emit Settled(merchant, amount);
    }

    function replenish(uint256 amount) external onlyHub nonReentrant {
        require(amount > 0, "Amount must be greater than 0");

        usdc.safeTransferFrom(msg.sender, address(this), amount);

        totalLiquidity += amount;

        emit Replenished(amount);
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

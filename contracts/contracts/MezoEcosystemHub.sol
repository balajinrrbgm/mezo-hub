// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/Pausable.sol";

interface ITroveManager {
    function getTroveOwnersCount() external view returns (uint256);
    function getTCR(uint256 _price) external view returns (uint256);
    function getBorrowingRateWithDecay() external view returns (uint256);
}

interface IBorrowerOperations {
    function minNetDebt() external view returns (uint256);
}

interface IStabilityPool {
    function getTotalMUSDDeposits() external view returns (uint256);
}

interface IPriceFeed {
    function fetchPrice() external view returns (uint256);
}

/**
 * @title MezoEcosystemHub
 * @notice MEZO Utilization Hub — stake MUSD to earn BTC protocol revenue, participate in governance.
 *
 * Mechanics:
 * - Users stake MUSD (the primary stable asset of the Mezo ecosystem)
 * - Protocol collects BTC (native Mezo token) distributed as staking rewards
 * - Governance: any staker can create and vote on proposals
 * - Analytics: aggregates live protocol stats for dashboard display
 *
 * This contract demonstrates maximal MEZO ecosystem utilization:
 * - Deep MUSD integration (staking token + reward denomination reference)
 * - Live on-chain reads from BorrowerOperations, TroveManager, StabilityPool, PriceFeed
 * - BTC-native rewards (Mezo's native asset)
 */
contract MezoEcosystemHub is ReentrancyGuard, Ownable, Pausable {
    using SafeERC20 for IERC20;

    // ──────────────────────────────────────────────
    // External protocol references
    // ──────────────────────────────────────────────
    IERC20 public immutable musd;
    ITroveManager public immutable troveManager;
    IBorrowerOperations public immutable borrowerOperations;
    IStabilityPool public immutable stabilityPool;
    IPriceFeed public immutable priceFeed;

    // ──────────────────────────────────────────────
    // Staking state
    // ──────────────────────────────────────────────
    uint256 public totalStaked;
    mapping(address => uint256) public stakedBalance;

    /// @dev Accumulated BTC rewards per staked MUSD share (18-decimal precision)
    uint256 public btcPerShareAccumulated;

    /// @dev Per-user snapshot of btcPerShareAccumulated at deposit/claim time
    mapping(address => uint256) public btcPerShareSnapshot;

    /// @dev Claimable BTC for each user (accumulated but not yet claimed)
    mapping(address => uint256) public pendingBTC;

    uint256 public totalBTCDistributed;

    // ──────────────────────────────────────────────
    // Governance state
    // ──────────────────────────────────────────────
    struct Proposal {
        uint256 id;
        address proposer;
        string title;
        string description;
        uint256 forVotes;
        uint256 againstVotes;
        uint256 startTime;
        uint256 endTime;
        bool executed;
        bool cancelled;
    }

    uint256 public proposalCount;
    mapping(uint256 => Proposal) public proposals;

    /// @dev voter => proposalId => hasVoted
    mapping(address => mapping(uint256 => bool)) public hasVoted;

    uint256 public constant VOTING_PERIOD = 3 days;
    uint256 public constant MIN_STAKE_TO_PROPOSE = 100e18;   // 100 MUSD

    // ──────────────────────────────────────────────
    // Events
    // ──────────────────────────────────────────────
    event Staked(address indexed user, uint256 amount);
    event Unstaked(address indexed user, uint256 amount);
    event BTCRewardsClaimed(address indexed user, uint256 amount);
    event BTCRewardsDeposited(uint256 amount);
    event ProposalCreated(uint256 indexed id, address indexed proposer, string title);
    event Voted(uint256 indexed proposalId, address indexed voter, bool support, uint256 weight);
    event ProposalExecuted(uint256 indexed id);
    event ProposalCancelled(uint256 indexed id);

    // ──────────────────────────────────────────────
    // Constructor
    // ──────────────────────────────────────────────
    constructor(
        address _musd,
        address _troveManager,
        address _borrowerOperations,
        address _stabilityPool,
        address _priceFeed
    ) Ownable(msg.sender) {
        require(_musd != address(0), "Hub: zero musd");
        require(_troveManager != address(0), "Hub: zero troveManager");
        require(_borrowerOperations != address(0), "Hub: zero borrowerOperations");
        require(_stabilityPool != address(0), "Hub: zero stabilityPool");
        require(_priceFeed != address(0), "Hub: zero priceFeed");

        musd = IERC20(_musd);
        troveManager = ITroveManager(_troveManager);
        borrowerOperations = IBorrowerOperations(_borrowerOperations);
        stabilityPool = IStabilityPool(_stabilityPool);
        priceFeed = IPriceFeed(_priceFeed);
    }

    // ──────────────────────────────────────────────
    // Staking
    // ──────────────────────────────────────────────

    /**
     * @notice Stake MUSD to earn BTC staking rewards and governance power.
     * @param amount Amount of MUSD to stake (18 decimals)
     */
    function stake(uint256 amount) external nonReentrant whenNotPaused {
        require(amount > 0, "Hub: zero amount");
        _updateReward(msg.sender);

        stakedBalance[msg.sender] += amount;
        totalStaked += amount;

        musd.safeTransferFrom(msg.sender, address(this), amount);
        emit Staked(msg.sender, amount);
    }

    /**
     * @notice Unstake MUSD and claim any pending BTC rewards.
     * @param amount Amount to unstake
     */
    function unstake(uint256 amount) external nonReentrant {
        require(amount > 0, "Hub: zero amount");
        require(stakedBalance[msg.sender] >= amount, "Hub: insufficient stake");

        _updateReward(msg.sender);
        _claimReward(msg.sender);

        stakedBalance[msg.sender] -= amount;
        totalStaked -= amount;

        musd.safeTransfer(msg.sender, amount);
        emit Unstaked(msg.sender, amount);
    }

    /**
     * @notice Claim accumulated BTC staking rewards without unstaking.
     */
    function claimRewards() external nonReentrant {
        _updateReward(msg.sender);
        _claimReward(msg.sender);
    }

    /**
     * @notice View pending BTC reward for any address.
     */
    function pendingReward(address user) external view returns (uint256) {
        if (totalStaked == 0) return pendingBTC[user];
        uint256 delta = btcPerShareAccumulated - btcPerShareSnapshot[user];
        uint256 earned = (stakedBalance[user] * delta) / 1e18;
        return pendingBTC[user] + earned;
    }

    // ──────────────────────────────────────────────
    // Reward distribution (owner/protocol deposits BTC)
    // ──────────────────────────────────────────────

    /**
     * @notice Deposit BTC rewards to be distributed pro-rata to all stakers.
     *         Called by the protocol treasury or owner with BTC value.
     */
    function depositRewards() external payable onlyOwner {
        require(msg.value > 0, "Hub: no BTC sent");
        require(totalStaked > 0, "Hub: no stakers");

        btcPerShareAccumulated += (msg.value * 1e18) / totalStaked;
        totalBTCDistributed += msg.value;

        emit BTCRewardsDeposited(msg.value);
    }

    // ──────────────────────────────────────────────
    // Governance
    // ──────────────────────────────────────────────

    /**
     * @notice Create a new governance proposal. Requires MIN_STAKE_TO_PROPOSE staked.
     * @param title Short title (max 100 chars)
     * @param description Full proposal description
     */
    function createProposal(string calldata title, string calldata description)
        external
        returns (uint256 proposalId)
    {
        require(bytes(title).length > 0 && bytes(title).length <= 100, "Hub: invalid title");
        require(bytes(description).length > 0, "Hub: empty description");
        require(stakedBalance[msg.sender] >= MIN_STAKE_TO_PROPOSE, "Hub: insufficient stake to propose");

        proposalId = ++proposalCount;
        proposals[proposalId] = Proposal({
            id: proposalId,
            proposer: msg.sender,
            title: title,
            description: description,
            forVotes: 0,
            againstVotes: 0,
            startTime: block.timestamp,
            endTime: block.timestamp + VOTING_PERIOD,
            executed: false,
            cancelled: false
        });

        emit ProposalCreated(proposalId, msg.sender, title);
    }

    /**
     * @notice Vote on a proposal. Voting weight = staked MUSD balance.
     * @param proposalId Proposal to vote on
     * @param support True for "for", false for "against"
     */
    function vote(uint256 proposalId, bool support) external {
        Proposal storage p = proposals[proposalId];
        require(p.id != 0, "Hub: proposal not found");
        require(block.timestamp <= p.endTime, "Hub: voting ended");
        require(!p.cancelled, "Hub: proposal cancelled");
        require(!hasVoted[msg.sender][proposalId], "Hub: already voted");
        require(stakedBalance[msg.sender] > 0, "Hub: not a staker");

        uint256 weight = stakedBalance[msg.sender];
        if (support) {
            p.forVotes += weight;
        } else {
            p.againstVotes += weight;
        }

        hasVoted[msg.sender][proposalId] = true;
        emit Voted(proposalId, msg.sender, support, weight);
    }

    /**
     * @notice Mark a passed proposal as executed (owner/multisig).
     */
    function executeProposal(uint256 proposalId) external onlyOwner {
        Proposal storage p = proposals[proposalId];
        require(p.id != 0, "Hub: not found");
        require(block.timestamp > p.endTime, "Hub: voting ongoing");
        require(!p.executed && !p.cancelled, "Hub: already finalized");
        require(p.forVotes > p.againstVotes, "Hub: did not pass");

        p.executed = true;
        emit ProposalExecuted(proposalId);
    }

    /**
     * @notice Cancel a proposal (only proposer or owner, before end time).
     */
    function cancelProposal(uint256 proposalId) external {
        Proposal storage p = proposals[proposalId];
        require(p.id != 0, "Hub: not found");
        require(!p.executed && !p.cancelled, "Hub: already finalized");
        require(msg.sender == p.proposer || msg.sender == owner(), "Hub: not authorized");

        p.cancelled = true;
        emit ProposalCancelled(proposalId);
    }

    // ──────────────────────────────────────────────
    // Protocol analytics (aggregated live reads)
    // ──────────────────────────────────────────────

    struct EcosystemStats {
        // Mezo MUSD protocol
        uint256 activeTroves;
        uint256 systemTCR;
        uint256 borrowingRate;
        uint256 spTotalDeposits;
        uint256 btcPriceUSD;
        // MezoHub staking
        uint256 hubTotalStaked;
        uint256 hubTotalBTCDistributed;
        uint256 hubProposalCount;
        uint256 hubActiveProposals;
    }

    /**
     * @notice Aggregates all ecosystem stats in one call.
     * Returns live data from BorrowerOperations, TroveManager, StabilityPool, PriceFeed.
     */
    function ecosystemStats() external view returns (EcosystemStats memory stats) {
        stats.btcPriceUSD = priceFeed.fetchPrice();
        stats.activeTroves = troveManager.getTroveOwnersCount();
        stats.systemTCR = troveManager.getTCR(stats.btcPriceUSD);
        stats.borrowingRate = troveManager.getBorrowingRateWithDecay();
        stats.spTotalDeposits = stabilityPool.getTotalMUSDDeposits();

        stats.hubTotalStaked = totalStaked;
        stats.hubTotalBTCDistributed = totalBTCDistributed;
        stats.hubProposalCount = proposalCount;

        // Count active (non-ended, non-cancelled) proposals
        uint256 active;
        for (uint256 i = 1; i <= proposalCount; i++) {
            if (!proposals[i].cancelled && block.timestamp <= proposals[i].endTime) {
                active++;
            }
        }
        stats.hubActiveProposals = active;
    }

    /**
     * @notice Returns paginated proposal list.
     * @param offset Starting index (1-based proposal ID)
     * @param limit Max proposals to return
     */
    function getProposals(uint256 offset, uint256 limit)
        external
        view
        returns (Proposal[] memory result)
    {
        uint256 from = offset > 0 ? offset : 1;
        uint256 count = 0;
        for (uint256 i = from; i <= proposalCount && count < limit; i++) {
            count++;
        }

        result = new Proposal[](count);
        for (uint256 j = 0; j < count; j++) {
            result[j] = proposals[from + j];
        }
    }

    // ──────────────────────────────────────────────
    // Admin
    // ──────────────────────────────────────────────

    function pause() external onlyOwner { _pause(); }
    function unpause() external onlyOwner { _unpause(); }

    // ──────────────────────────────────────────────
    // Internal helpers
    // ──────────────────────────────────────────────

    function _updateReward(address user) internal {
        if (totalStaked == 0) {
            btcPerShareSnapshot[user] = btcPerShareAccumulated;
            return;
        }
        uint256 delta = btcPerShareAccumulated - btcPerShareSnapshot[user];
        uint256 earned = (stakedBalance[user] * delta) / 1e18;
        pendingBTC[user] += earned;
        btcPerShareSnapshot[user] = btcPerShareAccumulated;
    }

    function _claimReward(address user) internal {
        uint256 reward = pendingBTC[user];
        if (reward == 0) return;
        pendingBTC[user] = 0;

        (bool ok, ) = payable(user).call{value: reward}("");
        require(ok, "Hub: BTC transfer failed");

        emit BTCRewardsClaimed(user, reward);
    }

    // ──────────────────────────────────────────────
    // Receive BTC
    // ──────────────────────────────────────────────
    receive() external payable {}
}

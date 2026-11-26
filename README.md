# MezoHub — Mezo Ecosystem Participation Hub

> **Mezo Hackathon: Building Bitcoin's Future**  
> Track: **MEZO Utilization — MEZO Track**

## Overview

MezoHub is the central coordination layer for the Mezo ecosystem. It aggregates live protocol data from all Mezo contracts, enables MUSD staking for BTC rewards (protocol revenue share), and provides on-chain governance for community-driven protocol evolution.

This project maximally utilizes the Mezo ecosystem: it reads from every major Mezo contract (BorrowerOperations, TroveManager, StabilityPool, PriceFeed) and distributes BTC — the native Mezo token — as staking rewards.

```
MUSD Holders
      ↓
   MezoEcosystemHub
      ├── Staking: stake MUSD → earn BTC rewards
      ├── Governance: create/vote on proposals
      └── Analytics: aggregate all Mezo on-chain data
            ├── TroveManager (active troves, TCR)
            ├── BorrowerOperations (borrowing rate)
            ├── StabilityPool (SP deposits)
            └── PriceFeed (live BTC price)
```

## Key Features

| Feature | Description |
|---------|-------------|
| 📊 **Live Analytics** | Real-time protocol stats from 4 Mezo contracts in one call |
| 🔒 **MUSD Staking** | Stake MUSD to earn BTC (native Mezo token) rewards |
| ⚖️ **Governance** | On-chain proposals + token-weighted voting |
| ₿ **BTC Native Rewards** | Protocol revenue distributed in BTC |
| 🏛️ **No Lock-up** | Unstake with proportional rewards at any time |
| 🔐 **Secure** | ReentrancyGuard, Pausable, Ownable, SafeERC20 |

## Architecture

```
contracts/
  contracts/
    MezoEcosystemHub.sol    ← Main hub (staking + governance + analytics)
  scripts/deploy.ts
  test/MezoEcosystemHub.test.ts
frontend/
  src/
    constants/addresses.ts  ← All Matsnet addresses + full Hub ABI
    config/wagmi.ts         ← @mezo-org/passport wallet config
    hooks/useHub.ts         ← All hub hooks (staking, governance, analytics)
    components/
      Header.tsx            ← Tab nav + Connect
      AnalyticsDashboard.tsx← Live protocol stats grid
      StakingPanel.tsx      ← Stake/unstake/claim UI
      GovernancePanel.tsx   ← Proposals list + voting + creation
    App.tsx
```

## Smart Contract: MezoEcosystemHub

### Staking Interface
```solidity
// Stake MUSD to earn BTC rewards
function stake(uint256 amount) external

// Unstake + auto-claim rewards
function unstake(uint256 amount) external

// Claim BTC rewards without unstaking
function claimRewards() external

// View pending rewards
function pendingReward(address user) external view returns (uint256)
```

### Governance Interface
```solidity
// Create proposal (requires 100+ MUSD staked)
function createProposal(string title, string description) external returns (uint256)

// Vote on proposal (weight = staked balance)
function vote(uint256 proposalId, bool support) external

// 3-day voting period, majority wins
```

### Analytics Interface
```solidity
// All ecosystem data in one call
function ecosystemStats() external view returns (EcosystemStats memory)
// Returns: activeTroves, systemTCR, borrowingRate, spTotalDeposits,
//          btcPriceUSD, hubTotalStaked, hubTotalBTCDistributed, proposals
```

## Matsnet Deployed Addresses

| Contract | Address |
|----------|---------|
| MUSD | `0x118917a40FAF1CD7a13dB0Ef56C86De7973Ac503` |
| TroveManager | `0xE47c80e8c23f6B4A1aE41c34837a0599D5D16bb0` |
| BorrowerOperations | `0xCdF7028ceAB81fA0C6971208e83fa7872994beE5` |
| StabilityPool | `0x1CCA7E410eE41739792eA0A24e00349Dd247680e` |
| PriceFeed | `0x86bCF0841622a5dAC14A313a15f96A95421b9366` |
| MezoEcosystemHub | *(deploy and update `addresses.ts`)* |

## Quick Start

### Contracts

```bash
cd contracts
npm install
cp .env.example .env
# Edit: DEPLOYER_PRIVATE_KEY=0x...

npm run compile
npm run test
npm run deploy:matsnet
```

### Frontend

```bash
cd frontend
npm install
npm run dev
```

Update `MEZO_HUB` in `frontend/src/constants/addresses.ts` with your deployed hub address.

## Governance Flow

1. **Stake 100+ MUSD** to become eligible to propose
2. **Create Proposal**: Title + description submitted on-chain
3. **3-day voting window**: Any staker can vote (weight = staked MUSD)
4. **Resolution**: Proposals that pass (forVotes > againstVotes) can be executed by multisig

## Reward Mechanics

BTC rewards are distributed via an accumulator pattern for gas efficiency:

```
btcPerShareAccumulated += (btcDeposited × 1e18) / totalStaked

userPending = (stakedBalance × (accumulated - snapshot)) / 1e18
```

This means rewards accrue continuously without requiring per-user updates on deposits.

## Hackathon Scoring Alignment

| Criterion | Score | How We Deliver |
|-----------|-------|----------------|
| Mezo Integration | 30% | Reads BorrowerOps + TroveManager + StabilityPool + PriceFeed; MUSD staking; BTC rewards |
| Technical | 20% | Accumulator reward pattern, governance with snapshot voting |
| Business Viability | 30% | Protocol revenue sharing + governance = direct ecosystem alignment |
| UX | 10% | Tab-based dashboard, live analytics, one-click stake/claim |
| Presentation | 10% | Professional dark theme, purple/BTC color scheme |

## Network Info

- **Chain**: Mezo Matsnet Testnet (Chain ID: 31611)
- **RPC**: https://rpc.test.mezo.org
- **Explorer**: https://explorer.test.mezo.org
- **Native Token**: BTC (18 decimals)

## License

MIT

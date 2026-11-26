// Matsnet Testnet (Chain ID: 31611) deployed addresses
export const ADDRESSES = {
  MUSD: '0x118917a40FAF1CD7a13dB0Ef56C86De7973Ac503',
  BORROWER_OPERATIONS: '0xCdF7028ceAB81fA0C6971208e83fa7872994beE5',
  TROVE_MANAGER: '0xE47c80e8c23f6B4A1aE41c34837a0599D5D16bb0',
  STABILITY_POOL: '0x1CCA7E410eE41739792eA0A24e00349Dd247680e',
  HINT_HELPERS: '0x4e4cBA3779d56386ED43631b4dCD6d8EacEcBCF6',
  PRICE_FEED: '0x86bCF0841622a5dAC14A313a15f96A95421b9366',
  // Update after deploying MezoEcosystemHub
  MEZO_HUB: '0x0000000000000000000000000000000000000000' as `0x${string}`,
} as const

export const MUSD_ABI = [
  'function balanceOf(address account) view returns (uint256)',
  'function allowance(address owner, address spender) view returns (uint256)',
  'function approve(address spender, uint256 amount) returns (bool)',
  'function totalSupply() view returns (uint256)',
  'function decimals() view returns (uint8)',
] as const

export const MEZO_HUB_ABI = [
  // Staking
  'function stake(uint256 amount)',
  'function unstake(uint256 amount)',
  'function claimRewards()',
  'function pendingReward(address user) view returns (uint256)',
  'function stakedBalance(address user) view returns (uint256)',
  'function totalStaked() view returns (uint256)',
  'function totalBTCDistributed() view returns (uint256)',
  // Governance
  'function createProposal(string title, string description) returns (uint256)',
  'function vote(uint256 proposalId, bool support)',
  'function cancelProposal(uint256 proposalId)',
  'function proposalCount() view returns (uint256)',
  'function proposals(uint256) view returns (uint256 id, address proposer, string title, string description, uint256 forVotes, uint256 againstVotes, uint256 startTime, uint256 endTime, bool executed, bool cancelled)',
  'function hasVoted(address voter, uint256 proposalId) view returns (bool)',
  'function getProposals(uint256 offset, uint256 limit) view returns (tuple(uint256 id, address proposer, string title, string description, uint256 forVotes, uint256 againstVotes, uint256 startTime, uint256 endTime, bool executed, bool cancelled)[])',
  // Analytics
  'function ecosystemStats() view returns (tuple(uint256 activeTroves, uint256 systemTCR, uint256 borrowingRate, uint256 spTotalDeposits, uint256 btcPriceUSD, uint256 hubTotalStaked, uint256 hubTotalBTCDistributed, uint256 hubProposalCount, uint256 hubActiveProposals))',
  // Events
  'event Staked(address indexed user, uint256 amount)',
  'event Unstaked(address indexed user, uint256 amount)',
  'event BTCRewardsClaimed(address indexed user, uint256 amount)',
  'event ProposalCreated(uint256 indexed id, address indexed proposer, string title)',
  'event Voted(uint256 indexed proposalId, address indexed voter, bool support, uint256 weight)',
] as const

export const MIN_STAKE_TO_PROPOSE = 100n * 10n ** 18n

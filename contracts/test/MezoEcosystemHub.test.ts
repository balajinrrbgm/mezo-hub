import { expect } from 'chai'
import { ethers } from 'hardhat'
import { parseUnits, parseEther } from 'ethers'

describe('MezoEcosystemHub', () => {
  async function deployFixture() {
    const [owner, alice, bob] = await ethers.getSigners()

    // Deploy mock MUSD
    const MockERC20 = await ethers.getContractFactory('MockERC20')
    const musd = await MockERC20.deploy('MUSD', 'MUSD', 18)

    // Deploy mock external contracts
    const MockTroveManager = await ethers.getContractFactory('MockTroveManager')
    const tm = await MockTroveManager.deploy()

    const MockBO = await ethers.getContractFactory('MockBorrowerOperations')
    const bo = await MockBO.deploy()

    const MockSP = await ethers.getContractFactory('MockStabilityPool')
    const sp = await MockSP.deploy()

    const MockPriceFeed = await ethers.getContractFactory('MockPriceFeed')
    const pf = await MockPriceFeed.deploy()

    const Hub = await ethers.getContractFactory('MezoEcosystemHub')
    const hub = await Hub.deploy(
      await musd.getAddress(),
      await tm.getAddress(),
      await bo.getAddress(),
      await sp.getAddress(),
      await pf.getAddress()
    )

    // Fund alice and bob with MUSD
    const mintAmount = parseUnits('10000', 18)
    await musd.mint(alice.address, mintAmount)
    await musd.mint(bob.address, mintAmount)

    return { hub, musd, owner, alice, bob }
  }

  describe('Deployment', () => {
    it('should deploy with correct addresses', async () => {
      const { hub, musd } = await deployFixture()
      expect(await hub.musd()).to.equal(await musd.getAddress())
      expect(await hub.totalStaked()).to.equal(0n)
      expect(await hub.proposalCount()).to.equal(0n)
    })
  })

  describe('Staking', () => {
    it('should allow staking MUSD', async () => {
      const { hub, musd, alice } = await deployFixture()
      const amount = parseUnits('500', 18)

      await musd.connect(alice).approve(await hub.getAddress(), amount)
      await hub.connect(alice).stake(amount)

      expect(await hub.stakedBalance(alice.address)).to.equal(amount)
      expect(await hub.totalStaked()).to.equal(amount)
    })

    it('should allow unstaking MUSD', async () => {
      const { hub, musd, alice } = await deployFixture()
      const amount = parseUnits('500', 18)

      await musd.connect(alice).approve(await hub.getAddress(), amount)
      await hub.connect(alice).stake(amount)
      await hub.connect(alice).unstake(amount)

      expect(await hub.stakedBalance(alice.address)).to.equal(0n)
    })

    it('should revert staking zero', async () => {
      const { hub } = await deployFixture()
      await expect((hub as any).stake(0n)).to.be.revertedWith('Hub: zero amount')
    })
  })

  describe('BTC Rewards', () => {
    it('should distribute BTC rewards proportionally', async () => {
      const { hub, musd, owner, alice, bob } = await deployFixture()
      const aliceStake = parseUnits('750', 18)
      const bobStake = parseUnits('250', 18)
      const rewardAmount = parseEther('0.1')

      // Stake
      await musd.connect(alice).approve(await hub.getAddress(), aliceStake)
      await hub.connect(alice).stake(aliceStake)
      await musd.connect(bob).approve(await hub.getAddress(), bobStake)
      await hub.connect(bob).stake(bobStake)

      // Owner deposits BTC reward
      await hub.connect(owner).depositRewards({ value: rewardAmount })

      // Check pending rewards (alice should get 75%, bob 25%)
      const alicePending = await hub.pendingReward(alice.address)
      const bobPending = await hub.pendingReward(bob.address)

      const tolerance = parseEther('0.00001')
      expect(alicePending).to.be.closeTo(parseEther('0.075'), tolerance)
      expect(bobPending).to.be.closeTo(parseEther('0.025'), tolerance)
    })
  })

  describe('Governance', () => {
    it('should allow creating proposals with sufficient stake', async () => {
      const { hub, musd, alice } = await deployFixture()
      const stake = parseUnits('200', 18) // > MIN_STAKE_TO_PROPOSE (100)

      await musd.connect(alice).approve(await hub.getAddress(), stake)
      await hub.connect(alice).stake(stake)

      await hub.connect(alice).createProposal('Test Proposal', 'This is a test proposal description')
      expect(await hub.proposalCount()).to.equal(1n)
    })

    it('should reject proposals with insufficient stake', async () => {
      const { hub, musd, alice } = await deployFixture()
      const stake = parseUnits('50', 18) // < MIN_STAKE_TO_PROPOSE (100)

      await musd.connect(alice).approve(await hub.getAddress(), stake)
      await hub.connect(alice).stake(stake)

      await expect(
        hub.connect(alice).createProposal('Test', 'Description')
      ).to.be.revertedWith('Hub: insufficient stake to propose')
    })

    it('should allow voting on proposals', async () => {
      const { hub, musd, alice, bob } = await deployFixture()
      const stakeAmount = parseUnits('200', 18)

      await musd.connect(alice).approve(await hub.getAddress(), stakeAmount)
      await hub.connect(alice).stake(stakeAmount)
      await musd.connect(bob).approve(await hub.getAddress(), stakeAmount)
      await hub.connect(bob).stake(stakeAmount)

      await hub.connect(alice).createProposal('Proposal 1', 'Description of proposal 1')

      await hub.connect(alice).vote(1, true)
      await hub.connect(bob).vote(1, false)

      const proposal = await hub.proposals(1)
      expect(proposal.forVotes).to.equal(stakeAmount)
      expect(proposal.againstVotes).to.equal(stakeAmount)
    })

    it('should prevent double voting', async () => {
      const { hub, musd, alice } = await deployFixture()
      const stake = parseUnits('200', 18)

      await musd.connect(alice).approve(await hub.getAddress(), stake)
      await hub.connect(alice).stake(stake)
      await hub.connect(alice).createProposal('Proposal', 'Description')
      await hub.connect(alice).vote(1, true)

      await expect(hub.connect(alice).vote(1, true)).to.be.revertedWith('Hub: already voted')
    })
  })
})

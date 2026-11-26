import { useState } from 'react'
import { formatUnits, parseUnits } from 'viem'
import { useUserState, useStake, useUnstake, useClaimRewards, useApproveMUSD } from '../hooks/useHub'
import { MIN_STAKE_TO_PROPOSE } from '../constants/addresses'

export function StakingPanel() {
  const user = useUserState()
  const { stake, isPending: stakePending } = useStake()
  const { unstake, isPending: unstakePending } = useUnstake()
  const { claim, isPending: claimPending } = useClaimRewards()
  const { approve, isPending: approvePending } = useApproveMUSD()

  const [stakeAmount, setStakeAmount] = useState('')
  const [unstakeAmount, setUnstakeAmount] = useState('')
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  const anyPending = stakePending || unstakePending || claimPending || approvePending

  const handleStake = async () => {
    if (!stakeAmount) return
    setError('')
    setSuccess('')
    try {
      const amount = parseUnits(stakeAmount, 18)
      // Check allowance
      if ((user.musdAllowance ?? 0n) < amount) {
        await approve(amount)
      }
      await stake(stakeAmount)
      setStakeAmount('')
      setSuccess('Successfully staked MUSD!')
      user.refetch()
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Transaction failed')
    }
  }

  const handleUnstake = async () => {
    if (!unstakeAmount) return
    setError('')
    setSuccess('')
    try {
      await unstake(unstakeAmount)
      setUnstakeAmount('')
      setSuccess('Successfully unstaked MUSD!')
      user.refetch()
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Transaction failed')
    }
  }

  const handleClaim = async () => {
    setError('')
    setSuccess('')
    try {
      await claim()
      setSuccess('BTC rewards claimed!')
      user.refetch()
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Transaction failed')
    }
  }

  const canPropose = user.stakedBalance ? user.stakedBalance >= MIN_STAKE_TO_PROPOSE : false
  const stakeToProposeFmt = parseFloat(formatUnits(MIN_STAKE_TO_PROPOSE, 18)).toFixed(0)

  return (
    <div className="space-y-5 animate-fade-in">
      {/* Your staking position */}
      <div className="grid grid-cols-3 gap-4">
        <div className="card text-center">
          <p className="text-xs text-gray-500 mb-1">Staked</p>
          <p className="text-2xl font-display font-bold text-mezo">{user.stakedFormatted}</p>
          <p className="text-xs text-gray-600">MUSD</p>
        </div>
        <div className="card text-center">
          <p className="text-xs text-gray-500 mb-1">Pending BTC</p>
          <p className="text-2xl font-display font-bold text-btc">{user.pendingFormatted}</p>
          <p className="text-xs text-gray-600">BTC</p>
        </div>
        <div className="card text-center">
          <p className="text-xs text-gray-500 mb-1">Voting Power</p>
          <p className="text-2xl font-display font-bold text-hub-violet">{user.stakedFormatted}</p>
          <p className="text-xs text-gray-600">votes</p>
        </div>
      </div>

      {/* Governance eligibility badge */}
      <div className={`rounded-xl px-4 py-3 flex items-center justify-between ${
        canPropose
          ? 'bg-hub-green/10 border border-hub-green/30'
          : 'bg-hub-border/30 border border-hub-border'
      }`}>
        <div>
          <p className={`text-sm font-semibold ${canPropose ? 'text-hub-green' : 'text-gray-400'}`}>
            {canPropose ? '✓ Eligible to Create Proposals' : `Stake ${stakeToProposeFmt}+ MUSD to create proposals`}
          </p>
          <p className="text-xs text-gray-500">
            {canPropose
              ? 'You have enough stake to propose changes to the Mezo ecosystem.'
              : `You need ${stakeToProposeFmt} MUSD staked (currently ${user.stakedFormatted}).`}
          </p>
        </div>
        {!canPropose && (
          <button
            onClick={() => setStakeAmount(stakeToProposeFmt)}
            className="text-xs text-mezo font-medium hover:text-mezo/80 shrink-0 ml-4"
          >
            Auto-fill
          </button>
        )}
      </div>

      {/* Stake input */}
      <div className="card space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="font-display font-semibold text-white">Stake MUSD</h3>
          <span className="text-xs text-gray-500">Balance: {user.musdBalanceFormatted} MUSD</span>
        </div>
        <div className="flex gap-3">
          <input
            type="number"
            min="0"
            step="100"
            value={stakeAmount}
            onChange={e => setStakeAmount(e.target.value)}
            placeholder="Enter MUSD amount"
            className="flex-1 bg-hub-bg border border-hub-border rounded-xl px-4 py-2.5 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-mezo/50"
          />
          <button onClick={() => setStakeAmount(user.musdBalanceFormatted)} className="text-xs text-mezo font-medium">
            Max
          </button>
          <button
            onClick={handleStake}
            disabled={anyPending || !stakeAmount}
            className="px-5 py-2.5 rounded-xl bg-mezo text-white text-sm font-semibold hover:bg-mezo/80 disabled:opacity-50 transition-all"
          >
            {stakePending || approvePending ? 'Pending…' : 'Stake'}
          </button>
        </div>
      </div>

      {/* Unstake input */}
      <div className="card space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="font-display font-semibold text-white">Unstake MUSD</h3>
          <span className="text-xs text-gray-500">Staked: {user.stakedFormatted} MUSD</span>
        </div>
        <div className="flex gap-3">
          <input
            type="number"
            min="0"
            step="100"
            value={unstakeAmount}
            onChange={e => setUnstakeAmount(e.target.value)}
            placeholder="Enter MUSD to withdraw"
            className="flex-1 bg-hub-bg border border-hub-border rounded-xl px-4 py-2.5 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-btc/50"
          />
          <button onClick={() => setUnstakeAmount(user.stakedFormatted)} className="text-xs text-btc font-medium">
            Max
          </button>
          <button
            onClick={handleUnstake}
            disabled={anyPending || !unstakeAmount}
            className="px-5 py-2.5 rounded-xl bg-hub-border text-white text-sm font-semibold hover:bg-hub-border/80 disabled:opacity-50 transition-all"
          >
            {unstakePending ? 'Pending…' : 'Unstake'}
          </button>
        </div>
        <p className="text-xs text-gray-500">Unstaking automatically claims any pending BTC rewards.</p>
      </div>

      {/* Claim rewards */}
      <div className="card flex items-center justify-between">
        <div>
          <p className="text-sm font-semibold text-white">Claim BTC Rewards</p>
          <p className="text-xs text-gray-400 mt-0.5">
            {parseFloat(user.pendingFormatted) > 0
              ? `${user.pendingFormatted} BTC available`
              : 'No rewards pending yet'}
          </p>
        </div>
        <button
          onClick={handleClaim}
          disabled={anyPending || parseFloat(user.pendingFormatted) === 0}
          className="px-5 py-2.5 rounded-xl bg-btc text-black text-sm font-semibold hover:bg-btc/80 disabled:opacity-50 transition-all"
        >
          {claimPending ? 'Claiming…' : `Claim ₿`}
        </button>
      </div>

      {error && (
        <div className="text-xs text-hub-red bg-hub-red/10 border border-hub-red/30 rounded-xl px-4 py-3">{error}</div>
      )}
      {success && (
        <div className="text-xs text-hub-green bg-hub-green/10 border border-hub-green/30 rounded-xl px-4 py-3">✓ {success}</div>
      )}
    </div>
  )
}

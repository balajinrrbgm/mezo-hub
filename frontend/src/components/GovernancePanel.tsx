import { useState } from 'react'
import { formatUnits } from 'viem'
import { useProposals, useCreateProposal, useVote, useUserState } from '../hooks/useHub'
import { MIN_STAKE_TO_PROPOSE } from '../constants/addresses'

interface Proposal {
  id: bigint
  proposer: string
  title: string
  description: string
  forVotes: bigint
  againstVotes: bigint
  startTime: bigint
  endTime: bigint
  executed: boolean
  cancelled: boolean
}

function ProposalCard({ proposal, userAddress, userStaked }: {
  proposal: Proposal
  userAddress?: `0x${string}`
  userStaked?: bigint
}) {
  const { vote, isPending } = useVote()
  const [voted, setVoted] = useState(false)

  const now = BigInt(Math.floor(Date.now() / 1000))
  const isActive = !proposal.cancelled && !proposal.executed && now <= proposal.endTime
  const isPassed = proposal.forVotes > proposal.againstVotes
  const totalVotes = proposal.forVotes + proposal.againstVotes
  const forPct = totalVotes > 0n ? Number((proposal.forVotes * 100n) / totalVotes) : 0
  const endDate = new Date(Number(proposal.endTime) * 1000).toLocaleDateString()

  const handleVote = async (support: boolean) => {
    try {
      await vote(proposal.id, support)
      setVoted(true)
    } catch {}
  }

  let statusBadge = <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-hub-border text-gray-400">Ended</span>
  if (proposal.cancelled) {
    statusBadge = <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-hub-red/10 text-hub-red">Cancelled</span>
  } else if (isActive) {
    statusBadge = <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-mezo/20 text-hub-violet">Active</span>
  } else if (proposal.executed) {
    statusBadge = <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-hub-green/10 text-hub-green">Executed</span>
  } else if (isPassed) {
    statusBadge = <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-hub-green/10 text-hub-green">Passed</span>
  } else {
    statusBadge = <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-hub-red/10 text-hub-red">Defeated</span>
  }

  return (
    <div className="card space-y-4">
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs text-gray-500">#{proposal.id.toString()}</span>
            {statusBadge}
          </div>
          <h3 className="font-display font-semibold text-white">{proposal.title}</h3>
          <p className="text-xs text-gray-400 mt-1 line-clamp-2">{proposal.description}</p>
        </div>
      </div>

      {/* Vote bars */}
      <div className="space-y-2">
        <div className="flex justify-between text-xs text-gray-400 mb-1">
          <span>For: {parseFloat(formatUnits(proposal.forVotes, 18)).toFixed(0)} MUSD ({forPct}%)</span>
          <span>Against: {parseFloat(formatUnits(proposal.againstVotes, 18)).toFixed(0)} MUSD ({100 - forPct}%)</span>
        </div>
        <div className="h-2 bg-hub-border rounded-full overflow-hidden flex">
          <div
            className="h-full bg-hub-green transition-all duration-700"
            style={{ width: `${forPct}%` }}
          />
          <div
            className="h-full bg-hub-red transition-all duration-700"
            style={{ width: `${100 - forPct}%` }}
          />
        </div>
      </div>

      <div className="flex items-center justify-between">
        <span className="text-xs text-gray-500">Ends {endDate}</span>
        {isActive && !voted && userAddress && (userStaked ?? 0n) > 0n && (
          <div className="flex gap-2">
            <button
              onClick={() => handleVote(false)}
              disabled={isPending}
              className="px-4 py-1.5 rounded-lg text-xs font-semibold bg-hub-red/10 border border-hub-red/30 text-hub-red hover:bg-hub-red/20 disabled:opacity-50 transition-all"
            >
              Against
            </button>
            <button
              onClick={() => handleVote(true)}
              disabled={isPending}
              className="px-4 py-1.5 rounded-lg text-xs font-semibold bg-hub-green/10 border border-hub-green/30 text-hub-green hover:bg-hub-green/20 disabled:opacity-50 transition-all"
            >
              {isPending ? '…' : 'For'}
            </button>
          </div>
        )}
        {voted && <span className="text-xs text-hub-green">✓ Voted</span>}
      </div>
    </div>
  )
}

export function GovernancePanel() {
  const user = useUserState()
  const { data: proposals } = useProposals()
  const { createProposal, isPending: createPending, isSuccess } = useCreateProposal()

  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [error, setError] = useState('')
  const [showForm, setShowForm] = useState(false)

  const canPropose = user.stakedBalance ? user.stakedBalance >= MIN_STAKE_TO_PROPOSE : false
  const proposalList = (proposals as Proposal[] | undefined) ?? []

  const handleCreate = async () => {
    if (!title || !description) return
    setError('')
    try {
      await createProposal(title, description)
      setTitle('')
      setDescription('')
      setShowForm(false)
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Transaction failed')
    }
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <h2 className="font-display font-semibold text-xl text-white">Governance</h2>
        <button
          onClick={() => setShowForm(s => !s)}
          disabled={!canPropose}
          title={canPropose ? 'Create a new proposal' : 'Stake 100+ MUSD to propose'}
          className="px-4 py-2 rounded-xl bg-mezo text-white text-sm font-semibold hover:bg-mezo/80 disabled:opacity-40 transition-all"
        >
          + New Proposal
        </button>
      </div>

      {/* Create proposal form */}
      {showForm && (
        <div className="card space-y-4 border-mezo/30">
          <h3 className="font-display font-semibold text-white">Create Proposal</h3>
          <div className="space-y-2">
            <label className="text-xs text-gray-400">Title (max 100 chars)</label>
            <input
              type="text"
              maxLength={100}
              value={title}
              onChange={e => setTitle(e.target.value)}
              placeholder="e.g., Reduce borrowing fee to 0.5%"
              className="w-full bg-hub-bg border border-hub-border rounded-xl px-4 py-2.5 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-mezo/50"
            />
          </div>
          <div className="space-y-2">
            <label className="text-xs text-gray-400">Description</label>
            <textarea
              rows={4}
              value={description}
              onChange={e => setDescription(e.target.value)}
              placeholder="Describe your proposal in detail..."
              className="w-full bg-hub-bg border border-hub-border rounded-xl px-4 py-2.5 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-mezo/50 resize-none"
            />
          </div>
          {error && <div className="text-xs text-hub-red">{error}</div>}
          <div className="flex gap-3">
            <button
              onClick={handleCreate}
              disabled={createPending || !title || !description}
              className="flex-1 py-2.5 rounded-xl bg-mezo text-white font-semibold text-sm hover:bg-mezo/80 disabled:opacity-50 transition-all"
            >
              {createPending ? 'Submitting…' : 'Submit Proposal'}
            </button>
            <button
              onClick={() => setShowForm(false)}
              className="px-5 py-2.5 rounded-xl bg-hub-border text-white text-sm hover:bg-hub-border/80 transition-all"
            >
              Cancel
            </button>
          </div>
          {isSuccess && <div className="text-xs text-hub-green">✓ Proposal created! Stakers can now vote.</div>}
        </div>
      )}

      {/* Proposals list */}
      {proposalList.length === 0 ? (
        <div className="card text-center py-12">
          <div className="text-4xl mb-4">🗳</div>
          <p className="text-gray-400 text-sm">No proposals yet. Stake 100+ MUSD and create the first one!</p>
        </div>
      ) : (
        <div className="space-y-4">
          {proposalList.map((p) => (
            <ProposalCard
              key={p.id.toString()}
              proposal={p}
              userAddress={user.address}
              userStaked={user.stakedBalance}
            />
          ))}
        </div>
      )}
    </div>
  )
}

import { useReadContract, useWriteContract, useWaitForTransactionReceipt, useAccount } from 'wagmi'
import { parseUnits, formatUnits, formatEther, parseEther } from 'viem'
import { useCallback } from 'react'
import { ADDRESSES, MEZO_HUB_ABI, MUSD_ABI } from '../constants/addresses'

// ──────────────────────────────────────────────
// Ecosystem-wide stats
// ──────────────────────────────────────────────
export function useEcosystemStats() {
  return useReadContract({
    address: ADDRESSES.MEZO_HUB,
    abi: MEZO_HUB_ABI,
    functionName: 'ecosystemStats',
  })
}

// ──────────────────────────────────────────────
// User staking info
// ──────────────────────────────────────────────
export function useStakedBalance(address?: `0x${string}`) {
  return useReadContract({
    address: ADDRESSES.MEZO_HUB,
    abi: MEZO_HUB_ABI,
    functionName: 'stakedBalance',
    args: address ? [address] : undefined,
    query: { enabled: !!address },
  })
}

export function usePendingReward(address?: `0x${string}`) {
  return useReadContract({
    address: ADDRESSES.MEZO_HUB,
    abi: MEZO_HUB_ABI,
    functionName: 'pendingReward',
    args: address ? [address] : undefined,
    query: { enabled: !!address },
  })
}

export function useMUSDBalance(address?: `0x${string}`) {
  return useReadContract({
    address: ADDRESSES.MUSD as `0x${string}`,
    abi: MUSD_ABI,
    functionName: 'balanceOf',
    args: address ? [address] : undefined,
    query: { enabled: !!address },
  })
}

export function useMUSDAllowance(owner?: `0x${string}`) {
  return useReadContract({
    address: ADDRESSES.MUSD as `0x${string}`,
    abi: MUSD_ABI,
    functionName: 'allowance',
    args: owner ? [owner, ADDRESSES.MEZO_HUB] : undefined,
    query: { enabled: !!owner },
  })
}

// ──────────────────────────────────────────────
// Proposals
// ──────────────────────────────────────────────
export function useProposals(limit = 20n) {
  return useReadContract({
    address: ADDRESSES.MEZO_HUB,
    abi: MEZO_HUB_ABI,
    functionName: 'getProposals',
    args: [1n, limit],
  })
}

export function useHasVoted(voter?: `0x${string}`, proposalId?: bigint) {
  return useReadContract({
    address: ADDRESSES.MEZO_HUB,
    abi: MEZO_HUB_ABI,
    functionName: 'hasVoted',
    args: voter && proposalId ? [voter, proposalId] : undefined,
    query: { enabled: !!(voter && proposalId) },
  })
}

// ──────────────────────────────────────────────
// Write: Stake / Unstake / Claim
// ──────────────────────────────────────────────
export function useStake() {
  const { writeContractAsync, isPending, data: hash } = useWriteContract()
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({ hash })

  const stake = useCallback(async (amount: string) => {
    return writeContractAsync({
      address: ADDRESSES.MEZO_HUB,
      abi: MEZO_HUB_ABI,
      functionName: 'stake',
      args: [parseUnits(amount, 18)],
    })
  }, [writeContractAsync])

  return { stake, isPending, isConfirming, isSuccess, hash }
}

export function useUnstake() {
  const { writeContractAsync, isPending, data: hash } = useWriteContract()
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({ hash })

  const unstake = useCallback(async (amount: string) => {
    return writeContractAsync({
      address: ADDRESSES.MEZO_HUB,
      abi: MEZO_HUB_ABI,
      functionName: 'unstake',
      args: [parseUnits(amount, 18)],
    })
  }, [writeContractAsync])

  return { unstake, isPending, isConfirming, isSuccess, hash }
}

export function useClaimRewards() {
  const { writeContractAsync, isPending, data: hash } = useWriteContract()
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({ hash })

  const claim = useCallback(async () => {
    return writeContractAsync({
      address: ADDRESSES.MEZO_HUB,
      abi: MEZO_HUB_ABI,
      functionName: 'claimRewards',
    })
  }, [writeContractAsync])

  return { claim, isPending, isConfirming, isSuccess, hash }
}

// ──────────────────────────────────────────────
// Write: Governance
// ──────────────────────────────────────────────
export function useCreateProposal() {
  const { writeContractAsync, isPending, data: hash } = useWriteContract()
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({ hash })

  const createProposal = useCallback(async (title: string, description: string) => {
    return writeContractAsync({
      address: ADDRESSES.MEZO_HUB,
      abi: MEZO_HUB_ABI,
      functionName: 'createProposal',
      args: [title, description],
    })
  }, [writeContractAsync])

  return { createProposal, isPending, isConfirming, isSuccess, hash }
}

export function useVote() {
  const { writeContractAsync, isPending, data: hash } = useWriteContract()
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({ hash })

  const vote = useCallback(async (proposalId: bigint, support: boolean) => {
    return writeContractAsync({
      address: ADDRESSES.MEZO_HUB,
      abi: MEZO_HUB_ABI,
      functionName: 'vote',
      args: [proposalId, support],
    })
  }, [writeContractAsync])

  return { vote, isPending, isConfirming, isSuccess, hash }
}

// ──────────────────────────────────────────────
// Write: Approve MUSD
// ──────────────────────────────────────────────
export function useApproveMUSD() {
  const { writeContractAsync, isPending, data: hash } = useWriteContract()
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({ hash })

  const approve = useCallback(async (amount: bigint) => {
    return writeContractAsync({
      address: ADDRESSES.MUSD as `0x${string}`,
      abi: MUSD_ABI,
      functionName: 'approve',
      args: [ADDRESSES.MEZO_HUB, amount],
    })
  }, [writeContractAsync])

  return { approve, isPending, isConfirming, isSuccess, hash }
}

// ──────────────────────────────────────────────
// Composite user state
// ──────────────────────────────────────────────
export function useUserState() {
  const { address } = useAccount()
  const staked = useStakedBalance(address)
  const pending = usePendingReward(address)
  const musdBal = useMUSDBalance(address)
  const allowance = useMUSDAllowance(address)

  return {
    address,
    stakedBalance: staked.data as bigint | undefined,
    stakedFormatted: staked.data ? parseFloat(formatUnits(staked.data as bigint, 18)).toFixed(2) : '0',
    pendingReward: pending.data as bigint | undefined,
    pendingFormatted: pending.data ? parseFloat(formatEther(pending.data as bigint)).toFixed(8) : '0',
    musdBalance: musdBal.data as bigint | undefined,
    musdBalanceFormatted: musdBal.data ? parseFloat(formatUnits(musdBal.data as bigint, 18)).toFixed(2) : '0',
    musdAllowance: allowance.data as bigint | undefined,
    isLoading: staked.isLoading || pending.isLoading,
    refetch: () => {
      staked.refetch()
      pending.refetch()
      musdBal.refetch()
      allowance.refetch()
    },
  }
}
